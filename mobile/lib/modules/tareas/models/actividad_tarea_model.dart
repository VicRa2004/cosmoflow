/// Entrada del historial de actividad de una tarea (`GET /api/tareas/{id}/actividad`).
class EntradaActividadDto {
  const EntradaActividadDto({
    required this.id,
    required this.evento,
    required this.datos,
    required this.ocurridoEn,
    this.actorId,
  });

  final int id;
  final String evento;
  final Map<String, dynamic> datos;
  final int? actorId;
  final DateTime ocurridoEn;

  factory EntradaActividadDto.fromJson(Map<String, dynamic> json) =>
      EntradaActividadDto(
        id: (json['id'] as num).toInt(),
        evento: json['evento'] as String? ?? '',
        datos: json['datos'] is Map<String, dynamic>
            ? json['datos'] as Map<String, dynamic>
            : const <String, dynamic>{},
        actorId: (json['actorId'] as num?)?.toInt(),
        ocurridoEn:
            DateTime.tryParse(json['ocurridoEn'] as String? ?? '') ??
            DateTime.now(),
      );
}

/// Respuesta paginada por cursor de `GET /api/tareas/{id}/actividad`.
class PaginaActividadTarea {
  const PaginaActividadTarea({
    required this.datos,
    required this.nombres,
    required this.hayMas,
  });

  final List<EntradaActividadDto> datos;
  final Map<int, String> nombres;
  final bool hayMas;

  factory PaginaActividadTarea.fromJson(Map<String, dynamic> json) {
    final datosRaw = json['datos'];
    final lista = datosRaw is List
        ? datosRaw
              .whereType<Map<String, dynamic>>()
              .map(EntradaActividadDto.fromJson)
              .toList(growable: false)
        : const <EntradaActividadDto>[];
    final nombresRaw = json['nombres'];
    final mapaNombres = <int, String>{};
    if (nombresRaw is Map) {
      for (final entry in nombresRaw.entries) {
        final id = int.tryParse(entry.key.toString());
        if (id != null && entry.value is String) {
          mapaNombres[id] = entry.value as String;
        }
      }
    }
    return PaginaActividadTarea(
      datos: lista,
      nombres: mapaNombres,
      hayMas: json['hayMas'] as bool? ?? false,
    );
  }
}

/// Describe en español una entrada del historial de actividad de una tarea.
String describirActividad(
  EntradaActividadDto entrada,
  Map<int, String> nombres,
) {
  final actor = entrada.actorId != null
      ? (nombres[entrada.actorId!] ?? 'Alguien')
      : 'Sistema';
  final d = entrada.datos;
  return switch (entrada.evento) {
    'tarea.creada' => '$actor creó la tarea',
    'tarea.actualizada' => '$actor actualizó la tarea',
    'tarea.estadoCambiado' => _estadoCambiado(actor, d),
    'tarea.responsablesAsignados' => '$actor actualizó los responsables',
    'tarea.movida' => '$actor movió la tarea',
    'tarea.eliminada' => '$actor eliminó la tarea',
    'tarea.restaurada' => '$actor restauró la tarea',
    'tarea.comentada' => '$actor añadió un comentario',
    _ => '$actor registró un cambio',
  };
}

String _estadoCambiado(String actor, Map<String, dynamic> d) {
  final nuevo = _etiquetaEstado(d['nuevo'] as String?);
  if (nuevo == null) return '$actor cambió el estado';
  return '$actor cambió el estado a «$nuevo»';
}

String? _etiquetaEstado(String? valor) => switch (valor) {
  'pendiente' => 'Pendiente',
  'en_progreso' => 'En progreso',
  'completada' => 'Completada',
  'cancelada' => 'Cancelada',
  _ => null,
};
