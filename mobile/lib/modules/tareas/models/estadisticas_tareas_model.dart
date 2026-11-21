/// Recuento de tareas por responsable.
class ResponsableEstadisticaDto {
  const ResponsableEstadisticaDto({
    required this.usuarioId,
    required this.abiertas,
    required this.completadas,
  });

  final int usuarioId;
  final int abiertas;
  final int completadas;

  factory ResponsableEstadisticaDto.fromJson(Map<String, dynamic> json) {
    return ResponsableEstadisticaDto(
      usuarioId: (json['usuarioId'] as num).toInt(),
      abiertas: (json['abiertas'] as num?)?.toInt() ?? 0,
      completadas: (json['completadas'] as num?)?.toInt() ?? 0,
    );
  }
}

/// Respuesta de `GET /api/tareas/estadisticas`.
class EstadisticasTareasDto {
  const EstadisticasTareasDto({
    required this.total,
    required this.pendiente,
    required this.enProgreso,
    required this.completada,
    required this.cancelada,
    required this.baja,
    required this.media,
    required this.alta,
    required this.vencidas,
    this.porResponsable = const <ResponsableEstadisticaDto>[],
  });

  final int total;
  final int pendiente;
  final int enProgreso;
  final int completada;
  final int cancelada;
  final int baja;
  final int media;
  final int alta;
  final int vencidas;
  final List<ResponsableEstadisticaDto> porResponsable;

  int get abiertas => pendiente + enProgreso;
  int get cerradas => completada + cancelada;
  int get porcentajeAvance =>
      cerradas == 0 ? 0 : ((completada / cerradas) * 100).round();

  factory EstadisticasTareasDto.fromJson(Map<String, dynamic> json) {
    final porEstado =
        json['porEstado'] as Map<String, dynamic>? ?? const <String, dynamic>{};
    final porPrioridad =
        json['abiertasPorPrioridad'] as Map<String, dynamic>? ??
        const <String, dynamic>{};
    final respRaw = json['porResponsable'];
    final responsables = respRaw is List
        ? respRaw
              .whereType<Map<String, dynamic>>()
              .map(ResponsableEstadisticaDto.fromJson)
              .toList(growable: false)
        : const <ResponsableEstadisticaDto>[];

    return EstadisticasTareasDto(
      total: (json['total'] as num?)?.toInt() ?? 0,
      pendiente: (porEstado['pendiente'] as num?)?.toInt() ?? 0,
      enProgreso: (porEstado['en_progreso'] as num?)?.toInt() ?? 0,
      completada: (porEstado['completada'] as num?)?.toInt() ?? 0,
      cancelada: (porEstado['cancelada'] as num?)?.toInt() ?? 0,
      baja: (porPrioridad['baja'] as num?)?.toInt() ?? 0,
      media: (porPrioridad['media'] as num?)?.toInt() ?? 0,
      alta: (porPrioridad['alta'] as num?)?.toInt() ?? 0,
      vencidas: (json['vencidas'] as num?)?.toInt() ?? 0,
      porResponsable: responsables,
    );
  }
}
