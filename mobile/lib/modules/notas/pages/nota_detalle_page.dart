import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../../core/auth/sesion_store.dart';
import '../../../core/theme/colores_noche_indigo.dart';
import '../../../core/widgets/avisos.dart';
import '../../../core/widgets/confirmar.dart';
import '../../../core/widgets/contenido_markdown.dart';
import '../../../core/widgets/estados.dart';
import '../../../core/widgets/tarjeta_seccion.dart';
import '../api/notas_api.dart';
import '../models/nota_model.dart';
import '../widgets/mover_a_carpeta_sheet.dart';
import 'nota_editor_page.dart';

enum _MenuNotaDetalle { mover, duplicar, eliminar }

/// `/notas/:id`: lectura editorial limpia estilo Obsidian / Apple Notes.
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
    _cargar();
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

  Future<void> _alternarFijada(NotaDto nota) async {
    await ejecutarConAviso(
      context,
      () async {
        final actualizada = await widget.notasApi.alternarFijada(nota);
        if (mounted) setState(() => _nota = actualizada);
      },
      error: 'No se pudo actualizar la nota.',
      exito: nota.isFijada ? 'Nota desfijada.' : 'Nota fijada.',
    );
  }

  Future<void> _mover(NotaDto nota) async {
    final destino = await mostrarMoverACarpetaSheet(
      context,
      titulo: 'Mover nota a…',
      carpetas: widget.args.carpetas,
      carpetaActualId: nota.carpetaId,
    );
    if (destino == null || !mounted || destino.carpetaId == nota.carpetaId) {
      return;
    }
    await ejecutarConAviso(
      context,
      () async {
        final actualizada = await widget.notasApi.moverNota(
          nota.id,
          destino.carpetaId,
        );
        if (mounted) setState(() => _nota = actualizada);
      },
      error: 'No se pudo mover la nota.',
      exito: 'Nota movida.',
    );
  }

  Future<void> _duplicar(NotaDto nota) async {
    NotaDto? copia;
    final ok = await ejecutarConAviso(
      context,
      () async => copia = await widget.notasApi.duplicar(nota.id),
      error: 'No se pudo duplicar la nota.',
      exito: 'Nota duplicada.',
    );
    if (ok && copia != null && mounted) {
      await context.push<void>(
        '/notas/${copia!.id}',
        extra: NotaEditorArgs(
          nota: copia,
          tags: widget.args.tags,
          carpetas: widget.args.carpetas,
          proyectoId: widget.args.proyectoId ?? nota.proyectoId,
        ),
      );
    }
  }

  Future<void> _eliminar(NotaDto nota) async {
    final ok = await confirmar(
      context,
      titulo: '¿Eliminar nota?',
      mensaje: '«${nota.titulo}» se enviará a la papelera.',
      accion: 'Eliminar',
    );
    if (!ok || !mounted) return;
    final hecho = await ejecutarConAviso(
      context,
      () => widget.notasApi.eliminar(nota.id),
      error: 'No se pudo eliminar la nota.',
      exito: 'Nota eliminada.',
    );
    if (hecho && mounted) context.pop();
  }

  String? _fechaEdicion(DateTime? fecha) {
    if (fecha == null) return null;
    final l = fecha.toLocal();
    final d = l.day.toString().padLeft(2, '0');
    final m = l.month.toString().padLeft(2, '0');
    final h = l.hour.toString().padLeft(2, '0');
    final min = l.minute.toString().padLeft(2, '0');
    return 'Editada el $d/$m/${l.year} a las $h:$min';
  }

  @override
  Widget build(BuildContext context) {
    final nota = _nota;
    final store = widget.sesionStore;
    final colores = context.colores;
    final puedeActualizar = store.puede('notas:actualizar');
    final puedeCrear = store.puede('notas:crear');
    final puedeEliminar = store.puede('notas:eliminar');
    final tieneMenu = puedeActualizar || puedeCrear || puedeEliminar;

    return Scaffold(
      backgroundColor: colores.superficie,
      appBar: AppBar(
        backgroundColor: colores.superficie,
        actions: <Widget>[
          if (nota != null && puedeActualizar)
            IconButton(
              tooltip: nota.isFijada ? 'Desfijar' : 'Fijar',
              icon: Icon(
                nota.isFijada ? LucideIcons.pinOff : LucideIcons.pin,
                color: nota.isFijada ? colores.amberAviso : null,
              ),
              onPressed: () => _alternarFijada(nota),
            ),
          if (nota != null && puedeActualizar)
            IconButton(
              tooltip: 'Editar',
              icon: const Icon(LucideIcons.squarePen),
              onPressed: () => _editar(nota),
            ),
          if (nota != null && tieneMenu)
            PopupMenuButton<_MenuNotaDetalle>(
              icon: const Icon(LucideIcons.ellipsisVertical),
              onSelected: (accion) => switch (accion) {
                _MenuNotaDetalle.mover => _mover(nota),
                _MenuNotaDetalle.duplicar => _duplicar(nota),
                _MenuNotaDetalle.eliminar => _eliminar(nota),
              },
              itemBuilder: (_) => <PopupMenuEntry<_MenuNotaDetalle>>[
                if (puedeActualizar)
                  const PopupMenuItem<_MenuNotaDetalle>(
                    value: _MenuNotaDetalle.mover,
                    child: Text('Mover a…'),
                  ),
                if (puedeCrear)
                  const PopupMenuItem<_MenuNotaDetalle>(
                    value: _MenuNotaDetalle.duplicar,
                    child: Text('Duplicar'),
                  ),
                if (puedeEliminar)
                  PopupMenuItem<_MenuNotaDetalle>(
                    value: _MenuNotaDetalle.eliminar,
                    child: Text(
                      'Eliminar',
                      style: TextStyle(color: colores.rosePeligro),
                    ),
                  ),
              ],
            ),
        ],
      ),
      body: nota == null
          ? (_mensajeError == null
                ? const EstadoCargando()
                : EstadoError(mensaje: _mensajeError!, onReintentar: _cargar))
          : RefreshIndicator(onRefresh: _cargar, child: _contenido(nota)),
    );
  }

  Widget _contenido(NotaDto nota) {
    final textTheme = Theme.of(context).textTheme;
    final colores = context.colores;
    final carpeta = widget.args.carpetas
        .where((c) => c.id == nota.carpetaId)
        .firstOrNull;
    final tags = widget.args.tags
        .where((t) => nota.tagIds.contains(t.id))
        .toList(growable: false);
    final fecha = _fechaEdicion(nota.updatedAt ?? nota.createdAt);

    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 4, 20, 64),
      children: <Widget>[
        if (fecha != null) ...<Widget>[
          Text(
            fecha,
            style: textTheme.bodySmall?.copyWith(color: colores.tintaTenue),
          ),
          const SizedBox(height: 8),
        ],
        Text(nota.titulo, style: textTheme.headlineMedium),
        if (nota.isFijada || carpeta != null || tags.isNotEmpty) ...<Widget>[
          const SizedBox(height: 12),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: <Widget>[
              if (nota.isFijada)
                InsigniaPill(
                  texto: 'Fijada',
                  icono: LucideIcons.pin,
                  colorTexto: colores.amberAviso,
                  colorFondo: colores.amberSuave,
                ),
              if (carpeta != null)
                InsigniaPill(
                  texto: carpeta.nombre,
                  icono: LucideIcons.folder,
                  colorTexto: colores.indigoMarca,
                  colorFondo: colores.indigoSuave,
                ),
              for (final tag in tags)
                InsigniaPill(
                  texto: '#${tag.nombre}',
                  colorTexto: colores.indigoMarca,
                  colorFondo: colores.indigoSuave,
                ),
            ],
          ),
        ],
        const SizedBox(height: 18),
        Divider(color: colores.borde, height: 1),
        const SizedBox(height: 18),
        ContenidoMarkdown(texto: nota.contenido),
      ],
    );
  }
}
