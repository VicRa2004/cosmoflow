import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../../../core/api/adjuntos_api.dart';
import '../../../core/theme/colores_noche_indigo.dart';
import '../../../core/widgets/adjunto_imagen.dart';
import '../../../core/widgets/avisos.dart';
import '../../../core/widgets/confirmar.dart';

/// Archivo elegido por el usuario para subir como adjunto.
typedef ArchivoSeleccionado = ({String nombre, Uint8List bytes});

/// Callback inyectable para elegir un archivo (permite pruebas sin canales nativos).
typedef SelectorArchivoAdjunto = Future<ArchivoSeleccionado?> Function(
  BuildContext context,
);

/// Sección de adjuntos de una tarea: previsualización, subida y eliminación.
/// Los adjuntos viven referenciados en el Markdown de `contenido`; al eliminar
/// uno se quita su referencia y el backend limpia los huérfanos.
class AdjuntosTareaSection extends StatefulWidget {
  const AdjuntosTareaSection({
    super.key,
    required this.contenido,
    required this.adjuntosApi,
    this.organizacionId,
    this.equipoId,
    this.proyectoId,
    this.puedeEditar = false,
    this.onAdjuntoSubido,
    this.onEliminarAdjunto,
    this.selectorArchivo,
  });

  final String contenido;
  final AdjuntosApi adjuntosApi;
  final int? organizacionId;
  final int? equipoId;
  final int? proyectoId;
  final bool puedeEditar;
  final Future<void> Function(AdjuntoDto adjunto, String alt)? onAdjuntoSubido;
  final Future<void> Function(AdjuntoReferencia adjunto)? onEliminarAdjunto;
  final SelectorArchivoAdjunto? selectorArchivo;

  @override
  State<AdjuntosTareaSection> createState() => _AdjuntosTareaSectionState();
}

class _AdjuntosTareaSectionState extends State<AdjuntosTareaSection> {
  bool _subiendo = false;
  final ImagePicker _picker = ImagePicker();

  Future<ArchivoSeleccionado?> _elegirConImagePicker(
    BuildContext context,
  ) async {
    final fuente = await showModalBottomSheet<ImageSource>(
      context: context,
      showDragHandle: true,
      useSafeArea: true,
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            ListTile(
              leading: const Icon(Icons.photo_library_outlined),
              title: const Text('Elegir de la galería'),
              onTap: () => Navigator.of(ctx).pop(ImageSource.gallery),
            ),
            ListTile(
              leading: const Icon(Icons.photo_camera_outlined),
              title: const Text('Tomar una foto'),
              onTap: () => Navigator.of(ctx).pop(ImageSource.camera),
            ),
          ],
        ),
      ),
    );
    if (fuente == null) return null;
    final archivo = await _picker.pickImage(source: fuente);
    if (archivo == null) return null;
    final bytes = await archivo.readAsBytes();
    return (nombre: archivo.name, bytes: bytes);
  }

  Future<void> _subir() async {
    if (_subiendo) return;
    final elegido = widget.selectorArchivo != null
        ? await widget.selectorArchivo!(context)
        : await _elegirConImagePicker(context);
    if (elegido == null || !mounted) return;

    if (elegido.bytes.lengthInBytes > adjuntoMaxBytes) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('La imagen no puede superar los 5 MB.')),
      );
      return;
    }

    setState(() => _subiendo = true);
    try {
      await ejecutarConAviso(
        context,
        () async {
          final adjunto = await widget.adjuntosApi.subir(
            bytes: elegido.bytes,
            nombreArchivo: elegido.nombre,
            organizacionId: widget.organizacionId,
            equipoId: widget.equipoId,
            proyectoId: widget.proyectoId,
          );
          await widget.onAdjuntoSubido?.call(adjunto, elegido.nombre);
        },
        error: 'No se pudo subir el adjunto.',
        exito: 'Adjunto subido.',
      );
    } finally {
      if (mounted) setState(() => _subiendo = false);
    }
  }

  Future<void> _eliminar(AdjuntoReferencia adjunto) async {
    final ok = await confirmar(
      context,
      titulo: '¿Eliminar adjunto?',
      mensaje: 'Se quitará la imagen de esta tarea.',
      accion: 'Eliminar',
    );
    if (!ok || !mounted) return;
    await ejecutarConAviso(
      context,
      () async => widget.onEliminarAdjunto?.call(adjunto),
      error: 'No se pudo eliminar el adjunto.',
      exito: 'Adjunto eliminado.',
    );
  }

  @override
  Widget build(BuildContext context) {
    final adjuntos = extraerAdjuntosMarkdown(widget.contenido);
    final colores = context.colores;
    final textTheme = Theme.of(context).textTheme;

    if (adjuntos.isEmpty && !widget.puedeEditar) {
      return const SizedBox.shrink();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        Row(
          children: <Widget>[
            Expanded(
              child: Text(
                adjuntos.isEmpty ? 'Adjuntos' : 'Adjuntos (${adjuntos.length})',
                style: textTheme.titleMedium,
              ),
            ),
            if (widget.puedeEditar && widget.onAdjuntoSubido != null)
              TextButton.icon(
                onPressed: _subiendo ? null : _subir,
                icon: _subiendo
                    ? const SizedBox.square(
                        dimension: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.attach_file_rounded, size: 20),
                label: Text(_subiendo ? 'Subiendo…' : 'Adjuntar'),
              ),
          ],
        ),
        if (adjuntos.isEmpty)
          Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Text(
              'Sin archivos adjuntos (PNG, JPEG o WebP, máx. 5 MB).',
              style: textTheme.bodySmall?.copyWith(color: colores.tintaTenue),
            ),
          )
        else ...<Widget>[
          const SizedBox(height: 8),
          SizedBox(
            height: 124,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: adjuntos.length,
              separatorBuilder: (_, _) => const SizedBox(width: 12),
              itemBuilder: (context, index) {
                final item = adjuntos[index];
                return _TarjetaAdjunto(
                  adjunto: item,
                  adjuntosApi: widget.adjuntosApi,
                  onEliminar:
                      widget.puedeEditar && widget.onEliminarAdjunto != null
                      ? () => _eliminar(item)
                      : null,
                );
              },
            ),
          ),
        ],
      ],
    );
  }
}

class _TarjetaAdjunto extends StatelessWidget {
  const _TarjetaAdjunto({
    required this.adjunto,
    required this.adjuntosApi,
    this.onEliminar,
  });

  final AdjuntoReferencia adjunto;
  final AdjuntosApi adjuntosApi;
  final VoidCallback? onEliminar;

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    return SizedBox(
      width: 124,
      child: Stack(
        children: <Widget>[
          Positioned.fill(
            child: Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: colores.borde),
              ),
              child: AdjuntoImagen(
                url: adjunto.url,
                adjuntosApi: adjuntosApi,
                alt: adjunto.alt,
                ancho: 124,
                alto: 124,
              ),
            ),
          ),
          if (onEliminar != null)
            Positioned(
              top: 4,
              right: 4,
              child: Material(
                color: colores.superficie.withValues(alpha: 0.9),
                shape: const CircleBorder(),
                child: IconButton(
                  tooltip: 'Eliminar adjunto',
                  constraints: const BoxConstraints.tightFor(
                    width: 36,
                    height: 36,
                  ),
                  padding: EdgeInsets.zero,
                  iconSize: 18,
                  color: colores.rosePeligro,
                  onPressed: onEliminar,
                  icon: const Icon(Icons.delete_outline_rounded),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
