/// Estados de una tarea según el contrato OpenAPI del backend.
enum EstadoTarea {
  pendiente('pendiente', 'Pendiente'),
  enProgreso('en_progreso', 'En progreso'),
  completada('completada', 'Completada'),
  cancelada('cancelada', 'Cancelada');

  const EstadoTarea(this.valorApi, this.etiqueta);
  final String valorApi;
  final String etiqueta;

  bool get isAbierta =>
      this == EstadoTarea.pendiente || this == EstadoTarea.enProgreso;

  static EstadoTarea fromValorApi(String? valor) {
    for (final estado in EstadoTarea.values) {
      if (estado.valorApi == valor) return estado;
    }
    return EstadoTarea.pendiente;
  }
}

/// Prioridades de una tarea según el contrato OpenAPI del backend.
enum PrioridadTarea {
  baja('baja', 'Baja'),
  media('media', 'Media'),
  alta('alta', 'Alta');

  const PrioridadTarea(this.valorApi, this.etiqueta);
  final String valorApi;
  final String etiqueta;

  static PrioridadTarea fromValorApi(String? valor) {
    for (final prioridad in PrioridadTarea.values) {
      if (prioridad.valorApi == valor) return prioridad;
    }
    return PrioridadTarea.media;
  }
}

/// DTO de Tarea (`TareaDto` en `schema.gen.ts`).
class TareaDto {
  const TareaDto({
    required this.id,
    required this.titulo,
    required this.contenido,
    required this.estado,
    required this.prioridad,
    this.fechaInicio,
    this.fechaVencimiento,
    this.color,
    this.tagIds = const <int>[],
    this.responsableIds = const <int>[],
    this.organizacionId,
    this.equipoId,
    this.proyectoId,
  });

  final int id;
  final String titulo;
  final String contenido;
  final EstadoTarea estado;
  final PrioridadTarea prioridad;
  final String? fechaInicio;
  final String? fechaVencimiento;
  final String? color;
  final List<int> tagIds;
  final List<int> responsableIds;
  final int? organizacionId;
  final int? equipoId;
  final int? proyectoId;

  bool get isCompartida => organizacionId != null;

  factory TareaDto.fromJson(Map<String, dynamic> json) {
    List<int> parsearListaIds(dynamic valor) {
      if (valor is List) {
        return valor.whereType<num>().map((e) => e.toInt()).toList();
      }
      return const <int>[];
    }

    return TareaDto(
      id: (json['id'] as num).toInt(),
      titulo: json['titulo'] as String? ?? '',
      contenido: json['contenido'] as String? ?? '',
      estado: EstadoTarea.fromValorApi(json['estado'] as String?),
      prioridad: PrioridadTarea.fromValorApi(json['prioridad'] as String?),
      fechaInicio: json['fechaInicio'] as String?,
      fechaVencimiento: json['fechaVencimiento'] as String?,
      color: json['color'] as String?,
      tagIds: parsearListaIds(json['tagIds']),
      responsableIds: parsearListaIds(json['responsableIds']),
      organizacionId: (json['organizacionId'] as num?)?.toInt(),
      equipoId: (json['equipoId'] as num?)?.toInt(),
      proyectoId: (json['proyectoId'] as num?)?.toInt(),
    );
  }
}

/// Respuesta paginada de `/api/tareas` y `/api/tareas/pendientes`.
class PaginaTareas {
  const PaginaTareas({
    required this.datos,
    required this.pagina,
    required this.totalPaginas,
    required this.totalElementos,
  });

  final List<TareaDto> datos;
  final int pagina;
  final int totalPaginas;
  final int totalElementos;

  factory PaginaTareas.fromJson(Map<String, dynamic> json) {
    final datosRaw = json['datos'];
    final lista = datosRaw is List
        ? datosRaw
            .whereType<Map<String, dynamic>>()
            .map(TareaDto.fromJson)
            .toList(growable: false)
        : const <TareaDto>[];

    return PaginaTareas(
      datos: lista,
      pagina: (json['pagina'] as num?)?.toInt() ?? 1,
      totalPaginas: (json['totalPaginas'] as num?)?.toInt() ?? 1,
      totalElementos: (json['totalElementos'] as num?)?.toInt() ?? lista.length,
    );
  }
}
