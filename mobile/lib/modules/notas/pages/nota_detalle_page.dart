import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/auth/sesion_store.dart';
import '../../../core/offline/aviso_pendientes.dart';
import '../../../core/theme/colores_noche_indigo.dart';
import '../../../core/widgets/avisos.dart';
import '../../../core/widgets/confirmar.dart';
import '../../../core/widgets/contenido_markdown.dart';
import '../../../core/widgets/estados.dart';
import '../api/notas_api.dart';
import '../models/nota_model.dart';
import 'nota_editor_page.dart';

/// `/notas/:id`: lectura a pantalla completa, con Editar y Eliminar en la AppBar.
/// Pinta al instante con la nota de `args` y la refresca por id.
class NotaDetallePage extends StatefulWidget {
  const NotaDetallePage({
    super.key,
    required this.id,
    required this.sesionStore,
    required this.notasApi,
    this.args = const NotaEditorArgs(),
  });

  final int id;
  final SesionStore sesionStore;
  final NotasApi notasApi;

  /// Nota ya conocida, tags y carpetas para el editor.
  final NotaEditorArgs args;

  @override
  State<NotaDetallePage> createState() => _NotaDetallePageState();
}

class _NotaDetallePageState extends State<NotaDetallePage> {
  late NotaDto? _nota = widget.args.nota;
  String? _mensajeError;

  @override
  void initState() {
    super.initState();
    widget.notasApi.cola?.addListener(_alCambiarCola);
    _cargar();
  }

  @override
  void dispose() {
    widget.notasApi.cola?.removeListener(_alCambiarCola);
    super.dispose();
  }

  void _alCambiarCola() {
    if (mounted) setState(() {});
  }

  Future<void> _cargar() async {
    try {
      final nota = await widget.notasApi.obtenerUno(widget.id);
      if (mounted) setState(() => _nota = nota);
    } catch (_) {
      if (mounted && _nota == null) {
        setState(() => _mensajeError = 'No se pudo cargar la nota.');
      }
    }
  }

  Future<void> _editar(NotaDto nota) async {
    final a = widget.args;
    final guardada = await context.push<bool>(
      '/notas/${nota.id}/editar',
      extra: NotaEditorArgs(
        nota: nota,
        tags: a.tags,
        carpetas: a.carpetas,
        proyectoId: a.proyectoId ?? nota.proyectoId,
      ),
    );
    if (guardada ?? false) await _cargar();
  }

  Future<void> _eliminar(NotaDto nota) async {
    final ok = await confirmar(
      context,
      titulo: '¿Eliminar nota?',
      mensaje: '«${nota.titulo}» se eliminará definitivamente.',
      accion: 'Eliminar',
    );
    if (!ok || !mounted) return;
    final hecho = await ejecutarConAviso(context, () async {
      final borrada = await widget.notasApi.eliminar(
        nota.id,
        titulo: nota.titulo,
      );
      if (!mounted) return;
      if (borrada) {
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text('Nota eliminada.')));
      } else {
        avisarSiEncolada(
          context,
          false,
          mensaje: 'Sin conexión: la eliminación quedó pendiente de subir.',
        );
      }
    }, error: 'No se pudo eliminar la nota.');
    if (hecho && mounted) context.pop();
  }

  @override
  Widget build(BuildContext context) {
    final usuarioId = widget.sesionStore.usuario?.id;
    final notaBase = _nota;
    final nota = notaBase == null
        ? null
        : widget.notasApi.aplicarPendiente(usuarioId, notaBase);
    final pendiente =
        nota != null &&
        usuarioId != null &&
        (widget.notasApi.cola?.tieneCambiosPendientes(
              usuarioId,
              '/notas',
              nota.id,
            ) ??
            false);
    final store = widget.sesionStore;
    return Scaffold(
      appBar: AppBar(
        actions: <Widget>[
          if (nota != null && store.puede('notas:actualizar'))
            IconButton(
              tooltip: 'Editar',
              icon: const Icon(Icons.edit_outlined),
              onPressed: () => _editar(nota),
            ),
          if (nota != null && store.puede('notas:eliminar'))
            PopupMenuButton<void>(
              itemBuilder: (_) => <PopupMenuEntry<void>>[
                PopupMenuItem<void>(
                  onTap: () => _eliminar(nota),
                  child: const Text('Eliminar'),
                ),
              ],
            ),
        ],
      ),
      body: nota == null
          ? (_mensajeError == null
                ? const EstadoCargando()
                : EstadoError(mensaje: _mensajeError!, onReintentar: _cargar))
          : RefreshIndicator(
              onRefresh: _cargar,
              child: _contenido(nota, pendiente),
            ),
    );
  }

  Widget _contenido(NotaDto nota, bool pendiente) {
    final textTheme = Theme.of(context).textTheme;
    final colores = context.colores;
    final carpeta = widget.args.carpetas
        .where((c) => c.id == nota.carpetaId)
        .firstOrNull;
    final tags = widget.args.tags
        .where((t) => nota.tagIds.contains(t.id))
        .toList(growable: false);

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 48),
      children: <Widget>[
        Text(nota.titulo, style: textTheme.headlineSmall),
        if (pendiente) ...<Widget>[
          const SizedBox(height: 8),
          Row(
            children: <Widget>[
              Icon(
                Icons.cloud_upload_outlined,
                size: 16,
                color: colores.amberAviso,
              ),
              const SizedBox(width: 6),
              Text(
                'Cambios pendientes de subir',
                style: textTheme.labelMedium?.copyWith(
                  color: colores.amberAviso,
                ),
              ),
            ],
          ),
        ],
        if (carpeta != null || tags.isNotEmpty) ...<Widget>[
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: <Widget>[
              if (carpeta != null)
                Chip(
                  avatar: const Icon(Icons.folder_outlined),
                  label: Text(carpeta.nombre),
                ),
              for (final tag in tags) Chip(label: Text(tag.nombre)),
            ],
          ),
        ],
        const SizedBox(height: 16),
        const Divider(),
        const SizedBox(height: 16),
        ContenidoMarkdown(texto: nota.contenido),
      ],
    );
  }
}
