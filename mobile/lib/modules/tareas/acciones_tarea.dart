import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';

import '../../core/auth/sesion_store.dart';
import '../../core/widgets/avisos.dart';
import '../../core/widgets/confirmar.dart';
import '../organizaciones/services/contexto_organizacion_cache.dart';
import '../tags/models/tag_model.dart';
import 'api/tareas_api.dart';
import 'models/tarea_model.dart';
import 'pages/tarea_editor_page.dart';
import 'widgets/selector_destino_tarea_sheet.dart';
import 'widgets/tarea_form.dart';

/// Acciones de tarea compartidas por Pendientes, Tareas y vistas de organización.
/// Todas devuelven `true` si algo cambió y la lista debe recargarse.
class AccionesTarea {
  const AccionesTarea({
    required this.sesionStore,
    required this.tareasApi,
    this.organizacionId,
    this.equipoId,
    this.proyectoId,
    this.tags = const <TagDto>[],
    this.responsables = const <ResponsableCandidato>[],
  });

  final SesionStore sesionStore;
  final TareasApi tareasApi;
  final int? organizacionId;
  final int? equipoId;
  final int? proyectoId;
  final List<TagDto> tags;
  final List<ResponsableCandidato> responsables;

  TareaEditorArgs _args([TareaDto? tarea, UbicacionTarea? ubicacion]) =>
      TareaEditorArgs(
        tarea: tarea,
        organizacionId: organizacionId ?? tarea?.organizacionId,
        equipoId: equipoId ?? tarea?.equipoId,
        proyectoId: proyectoId ?? tarea?.proyectoId,
        ubicacion: ubicacion,
        tags: tags,
        responsables: responsables,
      );

  Future<bool> crear(BuildContext context) async =>
      await context.push<bool>('/tareas/nueva', extra: _args()) ?? false;

  Future<bool> crearEnDestino(
    BuildContext context,
    DestinoNuevaTarea destino,
  ) async =>
      await context.push<bool>(
        '/tareas/nueva',
        extra: TareaEditorArgs(
          organizacionId: destino.organizacionId,
          equipoId: destino.equipoId,
          proyectoId: destino.proyectoId,
          ubicacion: destino.ubicacion,
        ),
      ) ??
      false;

  Future<bool> editar(BuildContext context, TareaDto tarea) async =>
      await context.push<bool>(
        '/tareas/${tarea.id}/editar',
        extra: _args(tarea),
      ) ??
      false;

  Future<bool> alternarCompletada(BuildContext context, TareaDto tarea) {
    HapticFeedback.selectionClick();
    return ejecutarConAviso(
      context,
      () => tareasApi.alternarCompletada(tarea),
      error: 'No se pudo actualizar la tarea.',
    );
  }

  Future<bool> cambiarEstado(
    BuildContext context,
    TareaDto tarea,
    EstadoTarea estado,
  ) {
    if (tarea.estado == estado) return Future<bool>.value(false);
    HapticFeedback.selectionClick();
    return ejecutarConAviso(
      context,
      () => tareasApi.cambiarEstado(tarea.id, estado),
      error: 'No se pudo cambiar el estado.',
    );
  }

  Future<bool> alternarFijada(BuildContext context, TareaDto tarea) {
    HapticFeedback.selectionClick();
    return ejecutarConAviso(
      context,
      () => tareasApi.alternarFijada(tarea),
      error: 'No se pudo actualizar el fijado.',
    );
  }

  Future<bool> eliminar(BuildContext context, TareaDto tarea) async {
    final ok = await confirmar(
      context,
      titulo: '¿Eliminar tarea?',
      mensaje: '«${tarea.titulo}» se eliminará definitivamente.',
      accion: 'Eliminar',
    );
    if (!ok || !context.mounted) return false;
    return ejecutarConAviso(
      context,
      () => tareasApi.eliminar(tarea.id),
      error: 'No se pudo eliminar la tarea.',
      exito: 'Tarea eliminada.',
    );
  }

  /// Abre `/tareas/:id`. Devuelve `true` siempre: dentro pudo editarse o eliminarse.
  Future<bool> abrirDetalle(
    BuildContext context,
    TareaDto tarea, {
    UbicacionTarea? ubicacion,
  }) async {
    await context.push<void>(
      '/tareas/${tarea.id}',
      extra: _args(tarea, ubicacion),
    );
    return true;
  }
}
