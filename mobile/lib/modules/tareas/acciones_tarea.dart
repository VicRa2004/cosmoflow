import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import '../../core/auth/sesion_store.dart';
import '../../core/widgets/avisos.dart';
import '../../core/widgets/confirmar.dart';
import 'api/tareas_api.dart';
import 'models/tarea_model.dart';

/// Acciones de tarea compartidas por Pendientes y Tareas.
/// Todas devuelven `true` si algo cambió y la lista debe recargarse.
class AccionesTarea {
  const AccionesTarea({required this.sesionStore, required this.tareasApi});

  final SesionStore sesionStore;
  final TareasApi tareasApi;

  Future<bool> crear(BuildContext context) async =>
      await context.push<bool>('/tareas/nueva') ?? false;

  Future<bool> editar(BuildContext context, TareaDto tarea) async =>
      await context.push<bool>('/tareas/${tarea.id}/editar', extra: tarea) ??
      false;

  Future<bool> alternarCompletada(BuildContext context, TareaDto tarea) {
    HapticFeedback.selectionClick();
    return ejecutarConAviso(
      context,
      () => tareasApi.alternarCompletada(tarea),
      error: 'No se pudo actualizar la tarea.',
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
  Future<bool> abrirDetalle(BuildContext context, TareaDto tarea) async {
    await context.push<void>('/tareas/${tarea.id}', extra: tarea);
    return true;
  }
}
