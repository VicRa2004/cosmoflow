/// Persona mencionada como actor o responsable en una notificación.
class PersonaAvisoDto {
  const PersonaAvisoDto({required this.id, required this.nombre});

  final int id;
  final String nombre;

  factory PersonaAvisoDto.fromJson(Map<String, dynamic> json) {
    return PersonaAvisoDto(
      id: (json['id'] as num).toInt(),
      nombre: json['nombre'] as String? ?? '',
    );
  }
}

/// Responsable actual de una tarea con quien lo asignó, si se conoce.
class ResponsableAvisoDto {
  const ResponsableAvisoDto({
    required this.id,
    required this.nombre,
    this.asignadoPor,
  });

  final int id;
  final String nombre;
  final PersonaAvisoDto? asignadoPor;

  factory ResponsableAvisoDto.fromJson(Map<String, dynamic> json) {
    final asignadoRaw = json['asignadoPor'];
    return ResponsableAvisoDto(
      id: (json['id'] as num).toInt(),
      nombre: json['nombre'] as String? ?? '',
      asignadoPor: asignadoRaw is Map<String, dynamic>
          ? PersonaAvisoDto.fromJson(asignadoRaw)
          : null,
    );
  }
}

/// Resumen actual de la tarea asociada a una notificación.
class TareaAvisoDto {
  const TareaAvisoDto({
    required this.titulo,
    this.responsables = const <ResponsableAvisoDto>[],
  });

  final String titulo;
  final List<ResponsableAvisoDto> responsables;

  factory TareaAvisoDto.fromJson(Map<String, dynamic> json) {
    final rawResp = json['responsables'];
    final lista = rawResp is List
        ? rawResp
              .whereType<Map<String, dynamic>>()
              .map(ResponsableAvisoDto.fromJson)
              .toList(growable: false)
        : const <ResponsableAvisoDto>[];
    return TareaAvisoDto(
      titulo: json['titulo'] as String? ?? '',
      responsables: lista,
    );
  }
}

/// Notificación dentro de la app (`NotificacionApp` en `schema.gen.ts`).
class NotificacionAppDto {
  const NotificacionAppDto({
    required this.id,
    required this.asunto,
    required this.texto,
    required this.enlace,
    required this.leida,
    required this.createdAt,
    this.tipo,
    this.recursoId,
    this.evento,
    this.actor,
    this.tarea,
  });

  final int id;
  final String asunto;
  final String texto;
  final String enlace;
  final String? tipo;
  final int? recursoId;
  final String? evento;
  final PersonaAvisoDto? actor;
  final TareaAvisoDto? tarea;
  final bool leida;
  final String createdAt;

  NotificacionAppDto copyWith({bool? leida}) {
    return NotificacionAppDto(
      id: id,
      asunto: asunto,
      texto: texto,
      enlace: enlace,
      tipo: tipo,
      recursoId: recursoId,
      evento: evento,
      actor: actor,
      tarea: tarea,
      leida: leida ?? this.leida,
      createdAt: createdAt,
    );
  }

  /// Ruta interna de GoRouter para abrir la entidad relacionada, si existe.
  String? rutaDestino() {
    if (tipo == 'tarea' && recursoId != null) return '/tareas/$recursoId';
    if (tipo == 'nota' && recursoId != null) return '/notas/$recursoId';
    final uri = Uri.tryParse(enlace);
    if (uri != null && uri.path.startsWith('/')) {
      final query = uri.hasQuery ? '?${uri.query}' : '';
      return '${uri.path}$query';
    }
    return enlace.startsWith('/') ? enlace : null;
  }

  factory NotificacionAppDto.fromJson(Map<String, dynamic> json) {
    final actorRaw = json['actor'];
    final tareaRaw = json['tarea'];
    return NotificacionAppDto(
      id: (json['id'] as num).toInt(),
      asunto: json['asunto'] as String? ?? '',
      texto: json['texto'] as String? ?? '',
      enlace: json['enlace'] as String? ?? '',
      tipo: json['tipo'] as String?,
      recursoId: (json['recursoId'] as num?)?.toInt(),
      evento: json['evento'] as String?,
      actor: actorRaw is Map<String, dynamic>
          ? PersonaAvisoDto.fromJson(actorRaw)
          : null,
      tarea: tareaRaw is Map<String, dynamic>
          ? TareaAvisoDto.fromJson(tareaRaw)
          : null,
      leida: json['leida'] as bool? ?? false,
      createdAt: json['createdAt'] as String? ?? '',
    );
  }
}

/// Respuesta paginada de `GET /api/notificaciones`.
class BandejaNotificacionesDto {
  const BandejaNotificacionesDto({
    required this.datos,
    required this.pagina,
    required this.totalElementos,
    required this.totalPaginas,
    required this.noLeidas,
  });

  final List<NotificacionAppDto> datos;
  final int pagina;
  final int totalElementos;
  final int totalPaginas;
  final int noLeidas;

  factory BandejaNotificacionesDto.fromJson(Map<String, dynamic> json) {
    final raw = json['datos'];
    final lista = raw is List
        ? raw
              .whereType<Map<String, dynamic>>()
              .map(NotificacionAppDto.fromJson)
              .toList(growable: false)
        : const <NotificacionAppDto>[];
    return BandejaNotificacionesDto(
      datos: lista,
      pagina: (json['pagina'] as num?)?.toInt() ?? 1,
      totalElementos: (json['totalElementos'] as num?)?.toInt() ?? lista.length,
      totalPaginas: (json['totalPaginas'] as num?)?.toInt() ?? 1,
      noLeidas: (json['noLeidas'] as num?)?.toInt() ?? 0,
    );
  }
}
