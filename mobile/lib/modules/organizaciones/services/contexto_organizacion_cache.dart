import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../tareas/models/tarea_model.dart';
import '../api/organizaciones_api.dart';
import '../models/organizacion_models.dart';

/// Tipo de destino dentro de una organización.
enum TipoUbicacionTarea { organizacion, equipo, proyecto }

/// Nombres legibles de dónde vive una tarea compartida (paridad con `DondeTarea` en web).
class UbicacionTarea {
  const UbicacionTarea({
    required this.organizacionId,
    required this.organizacionNombre,
    this.equipoId,
    this.equipoNombre,
    this.proyectoId,
    this.proyectoNombre,
  });

  final int organizacionId;
  final String organizacionNombre;
  final int? equipoId;
  final String? equipoNombre;
  final int? proyectoId;
  final String? proyectoNombre;

  TipoUbicacionTarea get tipo {
    if (equipoId != null) return TipoUbicacionTarea.equipo;
    if (proyectoId != null) return TipoUbicacionTarea.proyecto;
    return TipoUbicacionTarea.organizacion;
  }

  String? get grupoNombre => equipoNombre ?? proyectoNombre;

  /// Etiqueta corta para filas: `Organización · Equipo` / `Organización · Proyecto` / `Organización`.
  String get etiquetaCorta => <String>[
    organizacionNombre,
    if (grupoNombre != null && grupoNombre!.isNotEmpty) grupoNombre!,
  ].join(' · ');

  /// Etiqueta explícita del tipo de grupo (`Equipo`, `Proyecto` u `Organización`).
  String get etiquetaTipo => switch (tipo) {
    TipoUbicacionTarea.equipo => 'Equipo',
    TipoUbicacionTarea.proyecto => 'Proyecto',
    TipoUbicacionTarea.organizacion => 'Organización',
  };

  IconData get icono => switch (tipo) {
    TipoUbicacionTarea.equipo => LucideIcons.users,
    TipoUbicacionTarea.proyecto => LucideIcons.folderKanban,
    TipoUbicacionTarea.organizacion => LucideIcons.building2,
  };
}

class _DatosOrganizacion {
  const _DatosOrganizacion({
    required this.organizacion,
    required this.equipos,
    required this.proyectos,
    required this.miembros,
  });

  final OrganizacionDto organizacion;
  final List<EquipoDto> equipos;
  final List<ProyectoDto> proyectos;
  final List<MiembroDto> miembros;
}

/// Resuelve y cachea en memoria los nombres de organización, equipos, proyectos
/// y miembros para mostrar la ubicación de tareas compartidas sin repetir llamadas.
class ContextoOrganizacionCache {
  ContextoOrganizacionCache({required this.organizacionesApi});

  final OrganizacionesApi organizacionesApi;
  final Map<int, _DatosOrganizacion> _cache = <int, _DatosOrganizacion>{};
  final Map<int, Future<_DatosOrganizacion?>> _enVuelo =
      <int, Future<_DatosOrganizacion?>>{};

  Future<_DatosOrganizacion?> _cargar(int organizacionId) {
    final existente = _cache[organizacionId];
    if (existente != null) return Future<_DatosOrganizacion?>.value(existente);
    return _enVuelo.putIfAbsent(organizacionId, () async {
      try {
        final res = await Future.wait<dynamic>(<Future<dynamic>>[
          organizacionesApi.obtenerUna(organizacionId),
          organizacionesApi.obtenerEquipos(organizacionId),
          organizacionesApi.obtenerProyectos(organizacionId),
          organizacionesApi.obtenerMiembros(organizacionId),
        ]);
        final datos = _DatosOrganizacion(
          organizacion: res[0] as OrganizacionDto,
          equipos: res[1] as List<EquipoDto>,
          proyectos: res[2] as List<ProyectoDto>,
          miembros: res[3] as List<MiembroDto>,
        );
        _cache[organizacionId] = datos;
        return datos;
      } catch (_) {
        return null;
      } finally {
        _enVuelo.remove(organizacionId);
      }
    });
  }

  /// Resuelve la ubicación legible de una tarea compartida, o `null` si es personal o falla.
  Future<UbicacionTarea?> resolverUbicacion({
    required int? organizacionId,
    int? equipoId,
    int? proyectoId,
  }) async {
    if (organizacionId == null) return null;
    final datos = await _cargar(organizacionId);
    if (datos == null) return null;
    final equipo = equipoId == null
        ? null
        : datos.equipos.where((e) => e.id == equipoId).firstOrNull;
    final proyecto = proyectoId == null
        ? null
        : datos.proyectos.where((p) => p.id == proyectoId).firstOrNull;
    return UbicacionTarea(
      organizacionId: organizacionId,
      organizacionNombre: datos.organizacion.nombre,
      equipoId: equipoId,
      equipoNombre: equipo?.nombre,
      proyectoId: proyectoId,
      proyectoNombre: proyecto?.nombre,
    );
  }

  /// Resuelve las ubicaciones de una lista de tareas en paralelo (deduplicando por organización).
  Future<Map<int, UbicacionTarea>> resolverParaTareas(
    List<TareaDto> tareas,
  ) async {
    final orgIds = tareas
        .map((t) => t.organizacionId)
        .whereType<int>()
        .toSet();
    if (orgIds.isEmpty) return const <int, UbicacionTarea>{};
    await Future.wait(orgIds.map(_cargar));
    final resultado = <int, UbicacionTarea>{};
    for (final tarea in tareas) {
      final orgId = tarea.organizacionId;
      if (orgId == null) continue;
      final datos = _cache[orgId];
      if (datos == null) continue;
      final equipo = tarea.equipoId == null
          ? null
          : datos.equipos.where((e) => e.id == tarea.equipoId).firstOrNull;
      final proyecto = tarea.proyectoId == null
          ? null
          : datos.proyectos.where((p) => p.id == tarea.proyectoId).firstOrNull;
      resultado[tarea.id] = UbicacionTarea(
        organizacionId: orgId,
        organizacionNombre: datos.organizacion.nombre,
        equipoId: tarea.equipoId,
        equipoNombre: equipo?.nombre,
        proyectoId: tarea.proyectoId,
        proyectoNombre: proyecto?.nombre,
      );
    }
    return resultado;
  }

  /// Devuelve los miembros cacheados (o los carga) para una organización.
  Future<List<MiembroDto>> obtenerMiembros(int organizacionId) async {
    final datos = await _cargar(organizacionId);
    return datos?.miembros ?? const <MiembroDto>[];
  }
}
