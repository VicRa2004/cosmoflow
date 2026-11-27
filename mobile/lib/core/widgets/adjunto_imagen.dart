import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../api/adjuntos_api.dart';
import '../theme/colores_noche_indigo.dart';
import '../theme/tema_app.dart';

/// Muestra una imagen privada de `/api/adjuntos/{id}` descargada con Bearer.
/// Al tocarla abre una vista ampliable a pantalla completa.
class AdjuntoImagen extends StatefulWidget {
  const AdjuntoImagen({
    super.key,
    required this.url,
    required this.adjuntosApi,
    this.alt,
    this.alto = 160,
    this.ancho,
    this.fit = BoxFit.cover,
    this.permitirAmpliar = true,
  });

  final String url;
  final AdjuntosApi adjuntosApi;
  final String? alt;
  final double? alto;
  final double? ancho;
  final BoxFit fit;
  final bool permitirAmpliar;

  @override
  State<AdjuntoImagen> createState() => _AdjuntoImagenState();
}

class _AdjuntoImagenState extends State<AdjuntoImagen> {
  late Future<Uint8List> _descarga;

  @override
  void initState() {
    super.initState();
    _descarga = widget.adjuntosApi.descargar(widget.url);
  }

  @override
  void didUpdateWidget(covariant AdjuntoImagen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.url != widget.url ||
        oldWidget.adjuntosApi != widget.adjuntosApi) {
      _descarga = widget.adjuntosApi.descargar(widget.url);
    }
  }

  void _abrirVisor(BuildContext context, Uint8List bytes) {
    final titulo = (widget.alt != null && widget.alt!.trim().isNotEmpty)
        ? widget.alt!.trim()
        : 'Adjunto';
    showDialog<void>(
      context: context,
      builder: (ctx) => Dialog.fullscreen(
        child: Scaffold(
          appBar: AppBar(
            leading: const CloseButton(),
            title: Text(titulo, overflow: TextOverflow.ellipsis),
          ),
          body: SafeArea(
            child: Center(
              child: InteractiveViewer(
                minScale: 0.5,
                maxScale: 4,
                child: Image.memory(bytes, fit: BoxFit.contain),
              ),
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    return FutureBuilder<Uint8List>(
      future: _descarga,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return Container(
            width: widget.ancho ?? 180,
            height: widget.alto ?? 120,
            decoration: BoxDecoration(
              color: colores.elevada,
              borderRadius: BorderRadius.circular(TemaApp.radioControl),
              border: Border.all(color: colores.borde),
            ),
            child: const Center(
              child: SizedBox.square(
                dimension: 20,
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
            ),
          );
        }
        if (snapshot.hasError || !snapshot.hasData || snapshot.data!.isEmpty) {
          return Container(
            width: widget.ancho,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              color: colores.elevada,
              borderRadius: BorderRadius.circular(TemaApp.radioControl),
              border: Border.all(color: colores.borde),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: <Widget>[
                Icon(
                  LucideIcons.imageOff,
                  size: 18,
                  color: colores.tintaTenue,
                ),
                const SizedBox(width: 8),
                Flexible(
                  child: Text(
                    widget.alt != null && widget.alt!.isNotEmpty
                        ? 'Imagen no disponible: ${widget.alt}'
                        : 'Imagen no disponible',
                    style: Theme.of(context).textTheme.bodySmall
                        ?.copyWith(color: colores.tintaTenue),
                  ),
                ),
              ],
            ),
          );
        }
        final bytes = snapshot.data!;
        final imagen = ClipRRect(
          borderRadius: BorderRadius.circular(TemaApp.radioControl),
          child: Image.memory(
            bytes,
            width: widget.ancho,
            height: widget.alto,
            fit: widget.fit,
            semanticLabel: widget.alt,
          ),
        );
        if (!widget.permitirAmpliar) return imagen;
        return InkWell(
          borderRadius: BorderRadius.circular(TemaApp.radioControl),
          onTap: () => _abrirVisor(context, bytes),
          child: imagen,
        );
      },
    );
  }
}
