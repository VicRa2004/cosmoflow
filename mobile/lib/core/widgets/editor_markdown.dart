import 'dart:convert';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:webview_flutter/webview_flutter.dart';

import '../theme/colores_noche_indigo.dart';

/// Editor WYSIWYG de notas y tareas: el mismo Milkdown Crepe de la web
/// (`assets/editor/`, generado con `pnpm build:editor-movil`) en un WebView.
/// Crece con el contenido; [controller] recibe el Markdown en cada cambio.
///
/// shortcut: sin imágenes, menciones ni menú de `[[` (necesitan la API desde el
/// WebView); los `[[wikilinks]]` escritos se conservan.
class EditorMarkdown extends StatefulWidget {
  const EditorMarkdown({
    super.key,
    required this.controller,
    required this.hint,
    this.onCambio,
  });

  final TextEditingController controller;
  final String hint;
  final VoidCallback? onCambio;

  @override
  State<EditorMarkdown> createState() => _EditorMarkdownState();
}

class _EditorMarkdownState extends State<EditorMarkdown> {
  WebViewController? _web;
  double _altura = 160;

  /// Borde inferior del cursor dentro del editor, o `null` si no tiene el foco.
  double? _cursor;
  double _teclado = 0;

  @override
  void initState() {
    super.initState();
    if (WebViewPlatform.instance == null) return;
    _web = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..addJavaScriptChannel('Cosmoflow', onMessageReceived: _recibir)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageFinished: (_) => _iniciar(),
          // Solo la página local del editor: los enlaces externos se abren en el navegador del dispositivo.
          onNavigationRequest: (peticion) {
            if (peticion.url.startsWith('file:')) {
              return NavigationDecision.navigate;
            }
            final uri = Uri.tryParse(peticion.url);
            if (uri != null &&
                (uri.scheme == 'http' ||
                    uri.scheme == 'https' ||
                    uri.scheme == 'mailto')) {
              launchUrl(uri, mode: LaunchMode.externalApplication);
            }
            return NavigationDecision.prevent;
          },
        ),
      )
      ..loadFlutterAsset('assets/editor/index.html');
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _web?.setBackgroundColor(context.colores.fondo);
  }

  static String _hex(Color c) =>
      '#${(c.toARGB32() & 0xFFFFFF).toRadixString(16).padLeft(6, '0')}';

  void _iniciar() {
    if (!mounted) return;
    final c = context.colores;
    final opciones = jsonEncode(<String, Object>{
      'markdown': widget.controller.text,
      'placeholder': widget.hint,
      'colores': <String, String>{
        '--fondo': _hex(c.fondo),
        '--superficie': _hex(c.superficie),
        '--elevada': _hex(c.elevada),
        '--borde': _hex(c.borde),
        '--borde-fuerte': _hex(c.bordeFuerte),
        '--tinta': _hex(c.tinta),
        '--tinta-tenue': _hex(c.tintaTenue),
        '--indigo': _hex(c.indigoMarca),
        '--peligro': _hex(c.rosePeligro),
      },
    });
    _web?.runJavaScript('window.iniciarEditor($opciones)');
  }

  void _recibir(JavaScriptMessage mensaje) {
    if (!mounted) return;
    final datos = jsonDecode(mensaje.message) as Map<String, dynamic>;
    if (datos['markdown'] case final String markdown) {
      widget.controller.text = markdown;
      widget.onCambio?.call();
    }
    if (datos['altura'] case final num altura) {
      setState(() => _altura = math.max(altura.toDouble(), 160));
    }
    if (datos.containsKey('cursor')) {
      _cursor = (datos['cursor'] as num?)?.toDouble();
      _mostrarCursor();
    }
  }

  /// El WebView no se desplaza (crece con el contenido): mueve la lista para
  /// que el cursor quede por encima del teclado.
  void _mostrarCursor() {
    final cursor = _cursor;
    final caja = context.findRenderObject() as RenderBox?;
    final posicion = Scrollable.maybeOf(context)?.position;
    if (cursor == null || caja == null || posicion == null) return;
    final media = MediaQuery.of(context);
    final limite = media.size.height - media.viewInsets.bottom - 24;
    final exceso = caja.localToGlobal(Offset(0, cursor)).dy - limite;
    if (exceso > 0) {
      posicion.jumpTo(
        math.min(posicion.pixels + exceso, posicion.maxScrollExtent),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final web = _web;
    if (web == null) {
      return TextFormField(
        controller: widget.controller,
        maxLines: 4,
        decoration: InputDecoration(hintText: widget.hint),
        onChanged: (_) => widget.onCambio?.call(),
      );
    }
    // Al abrirse el teclado no hay mensaje del editor: se recoloca aquí.
    final teclado = MediaQuery.viewInsetsOf(context).bottom;
    if (teclado != _teclado) {
      _teclado = teclado;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) _mostrarCursor();
      });
    }
    return SizedBox(
      height: _altura,
      child: WebViewWidget(controller: web),
    );
  }
}
