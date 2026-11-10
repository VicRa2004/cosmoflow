import 'package:flutter/material.dart';
import 'package:flutter_markdown_plus/flutter_markdown_plus.dart';
import 'package:url_launcher/url_launcher.dart';
import '../theme/colores_noche_indigo.dart';

/// Contenido Markdown de tareas y notas con la tipografía del tema.
/// Los enlaces http(s) y mailto se abren fuera de la app.
class ContenidoMarkdown extends StatelessWidget {
  const ContenidoMarkdown({super.key, required this.texto});

  final String texto;

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final tema = Theme.of(context);
    if (texto.trim().isEmpty) {
      return Text(
        'Sin contenido.',
        style: tema.textTheme.bodyLarge?.copyWith(color: colores.tintaTenue),
      );
    }
    final hoja = MarkdownStyleSheet.fromTheme(tema).copyWith(
      p: tema.textTheme.bodyLarge,
      listBullet: tema.textTheme.bodyLarge,
      code: tema.textTheme.bodyMedium?.copyWith(
        fontFamily: 'monospace',
        backgroundColor: colores.elevada,
      ),
      codeblockDecoration: BoxDecoration(
        color: colores.elevada,
        borderRadius: BorderRadius.circular(8),
      ),
      blockquoteDecoration: BoxDecoration(
        border: Border(left: BorderSide(color: colores.bordeFuerte, width: 3)),
      ),
      a: TextStyle(color: colores.indigoMarca),
      horizontalRuleDecoration: BoxDecoration(
        border: Border(top: BorderSide(color: colores.borde)),
      ),
    );
    return MarkdownBody(
      data: texto,
      selectable: true,
      styleSheet: hoja,
      onTapLink: (_, href, _) => abrirEnlace(context, href),
    );
  }

  /// Solo esquemas seguros: el contenido lo escribe el usuario.
  static const Set<String> esquemasPermitidos = <String>{
    'http',
    'https',
    'mailto',
  };

  static Future<void> abrirEnlace(BuildContext context, String? href) async {
    final uri = href == null ? null : Uri.tryParse(href);
    final mensajero = ScaffoldMessenger.of(context);
    final abierto =
        uri != null &&
        esquemasPermitidos.contains(uri.scheme) &&
        await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (!abierto) {
      mensajero.showSnackBar(
        const SnackBar(content: Text('No se pudo abrir el enlace.')),
      );
    }
  }
}
