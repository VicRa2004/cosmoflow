import '../../tareas/widgets/tarea_form.dart';

List<int> _parsearIds(dynamic valor) {
  if (valor is List) {
    return valor.whereType<num>().map((e) => e.toInt()).toList(growable: false);
  }
  return const <int>[];
}

List<String> _parsearStrings(dynamic valor) {
  if (valor is List) {
    return valor.whereType<String>().toList(growable: false);
  }
  return const <String>[];
}

/// DTO de Organización (`OrganizacionDto` en `schema.gen.ts`).
class OrganizacionDto {
  const OrganizacionDto({
    required this.id,
    required this.nombre,
    required this.descripcion,
    this.color,
    this.avatarUrl,
    this.isAdmin = false,
    this.permisos = const <String>[],
  });

  final int id;
  final String nombre;
  final String descripcion;
  final String? color;
  final String? avatarUrl;
  final bool isAdmin;
  final List<String> permisos;

  /// Comprueba si el usuario tiene un permiso dentro de esta organización.
  bool puede(String permiso) => isAdmin || permisos.contains(permiso);

  factory OrganizacionDto.fromJson(Map<String, dynamic> json) {
    return OrganizacionDto(
      id: (json['id'] as num).toInt(),
      nombre: json['nombre'] as String? ?? '',
      descripcion: json['descripcion'] as String? ?? '',
      color: json['color'] as String?,
      avatarUrl: json['avatarUrl'] as String?,
      isAdmin: json['isAdmin'] as bool? ?? false,
      permisos: _parsearStrings(json['permisos']),
    );
  }
}

/// Respuesta paginada de `GET /api/organizaciones`.
class PaginaOrganizaciones {
  const PaginaOrganizaciones({
    required this.datos,
    required this.pagina,
    required this.totalPaginas,
    required this.totalElementos,
  });

  final List<OrganizacionDto> datos;
  final int pagina;
  final int totalPaginas;
  final int totalElementos;

  factory PaginaOrganizaciones.fromJson(Map<String, dynamic> json) {
    final datosRaw = json['datos'];
    final lista = datosRaw is List
        ? datosRaw
              .whereType<Map<String, dynamic>>()
              .map(OrganizacionDto.fromJson)
              .toList(growable: false)
        : const <OrganizacionDto>[];

    return PaginaOrganizaciones(
      datos: lista,
      pagina: (json['pagina'] as num?)?.toInt() ?? 1,
      totalPaginas: (json['totalPaginas'] as num?)?.toInt() ?? 1,
      totalElementos: (json['totalElementos'] as num?)?.toInt() ?? lista.length,
    );
  }
}

/// Miembro de una organización (`GET /api/organizaciones/{id}/miembros`).
class MiembroDto {
  const MiembroDto({
    required this.usuarioId,
    required this.nombre,
    required this.email,
    this.avatarUrl,
    this.isAdmin = false,
  });

  final int usuarioId;
  final String nombre;
  final String email;
  final String? avatarUrl;
  final bool isAdmin;

  factory MiembroDto.fromJson(Map<String, dynamic> json) {
    return MiembroDto(
      usuarioId: (json['usuarioId'] as num).toInt(),
      nombre: json['nombre'] as String? ?? '',
      email: json['email'] as String? ?? '',
      avatarUrl: json['avatarUrl'] as String?,
      isAdmin: json['isAdmin'] as bool? ?? false,
    );
  }
}

/// Integrante de un equipo con su flag de delegación (`puedeCrearTareas`).
class MiembroEquipoDto {
  const MiembroEquipoDto({
    required this.usuarioId,
    this.puedeCrearTareas = false,
  });

  final int usuarioId;
  final bool puedeCrearTareas;

  factory MiembroEquipoDto.fromJson(Map<String, dynamic> json) {
    return MiembroEquipoDto(
      usuarioId: (json['usuarioId'] as num).toInt(),
      puedeCrearTareas: json['puedeCrearTareas'] as bool? ?? false,
    );
  }
}

/// DTO de Equipo (`GET /api/organizaciones/{id}/equipos`).
class EquipoDto {
  const EquipoDto({
    required this.id,
    required this.nombre,
    required this.descripcion,
    this.color,
    this.avatarUrl,
    this.liderId,
    this.miembros = const <MiembroEquipoDto>[],
    this.tagIds = const <int>[],
  });

  final int id;
  final String nombre;
  final String descripcion;
  final String? color;
  final String? avatarUrl;
  final int? liderId;
  final List<MiembroEquipoDto> miembros;
  final List<int> tagIds;

  /// RN-22: sin líder, cualquier miembro del equipo puede crear tareas;
  /// con líder, solo el líder o quien tenga `puedeCrearTareas`.
  bool puedeCrearTareas(int? usuarioId) {
    if (usuarioId == null) return false;
    final miembro = miembros.where((m) => m.usuarioId == usuarioId).firstOrNull;
    if (miembro == null) return false;
    if (liderId == null) return true;
    return liderId == usuarioId || miembro.puedeCrearTareas;
  }

  factory EquipoDto.fromJson(Map<String, dynamic> json) {
    final miembrosRaw = json['miembros'];
    final listaMiembros = miembrosRaw is List
        ? miembrosRaw
              .whereType<Map<String, dynamic>>()
              .map(MiembroEquipoDto.fromJson)
              .toList(growable: false)
        : const <MiembroEquipoDto>[];

    return EquipoDto(
      id: (json['id'] as num).toInt(),
      nombre: json['nombre'] as String? ?? '',
      descripcion: json['descripcion'] as String? ?? '',
      color: json['color'] as String?,
      avatarUrl: json['avatarUrl'] as String?,
      liderId: (json['liderId'] as num?)?.toInt(),
      miembros: listaMiembros,
      tagIds: _parsearIds(json['tagIds']),
    );
  }
}

/// Estados de un proyecto según el contrato OpenAPI.
enum EstadoProyecto {
  activo('activo', 'Activo'),
  enPausa('en_pausa', 'En pausa'),
  terminado('terminado', 'Terminado');

  const EstadoProyecto(this.valorApi, this.etiqueta);
  final String valorApi;
  final String etiqueta;

  static EstadoProyecto fromValorApi(String? valor) {
    for (final e in EstadoProyecto.values) {
      if (e.valorApi == valor) return e;
    }
    return EstadoProyecto.activo;
  }
}

/// Progreso de tareas de un proyecto.
class ProgresoProyectoDto {
  const ProgresoProyectoDto({required this.tareas, required this.completadas});

  final int tareas;
  final int completadas;

  factory ProgresoProyectoDto.fromJson(Map<String, dynamic>? json) {
    if (json == null) {
      return const ProgresoProyectoDto(tareas: 0, completadas: 0);
    }
    return ProgresoProyectoDto(
      tareas: (json['tareas'] as num?)?.toInt() ?? 0,
      completadas: (json['completadas'] as num?)?.toInt() ?? 0,
    );
  }
}

/// DTO de Proyecto (`GET /api/organizaciones/{id}/proyectos`).
class ProyectoDto {
  const ProyectoDto({
    required this.id,
    required this.nombre,
    required this.descripcion,
    required this.estado,
    this.color,
    this.fechaInicio,
    this.fechaFin,
    this.progreso = const ProgresoProyectoDto(tareas: 0, completadas: 0),
    this.equipoIds = const <int>[],
    this.integranteIds = const <int>[],
  });

  final int id;
  final String nombre;
  final String descripcion;
  final EstadoProyecto estado;
  final String? color;
  final String? fechaInicio;
  final String? fechaFin;
  final ProgresoProyectoDto progreso;
  final List<int> equipoIds;
  final List<int> integranteIds;

  factory ProyectoDto.fromJson(Map<String, dynamic> json) {
    return ProyectoDto(
      id: (json['id'] as num).toInt(),
      nombre: json['nombre'] as String? ?? '',
      descripcion: json['descripcion'] as String? ?? '',
      estado: EstadoProyecto.fromValorApi(json['estado'] as String?),
      color: json['color'] as String?,
      fechaInicio: json['fechaInicio'] as String?,
      fechaFin: json['fechaFin'] as String?,
      progreso: ProgresoProyectoDto.fromJson(
        json['progreso'] as Map<String, dynamic>?,
      ),
      equipoIds: _parsearIds(json['equipoIds']),
      integranteIds: _parsearIds(json['integranteIds']),
    );
  }
}

/// RN-23 y RN-44: filtra qué miembros de la organización pueden ser responsables
/// según el destino de la tarea (organización, equipo o proyecto).
List<ResponsableCandidato> filtrarMiembrosDestino({
  required List<MiembroDto> miembros,
  List<EquipoDto> equipos = const <EquipoDto>[],
  List<ProyectoDto> proyectos = const <ProyectoDto>[],
  int? equipoId,
  int? proyectoId,
}) {
  Iterable<MiembroDto> elegibles = miembros;
  if (equipoId != null) {
    final equipo = equipos.where((e) => e.id == equipoId).firstOrNull;
    final ids =
        equipo?.miembros.map((m) => m.usuarioId).toSet() ?? const <int>{};
    elegibles = miembros.where((m) => ids.contains(m.usuarioId));
  } else if (proyectoId != null) {
    final proyecto = proyectos.where((p) => p.id == proyectoId).firstOrNull;
    final ids = <int>{...?proyecto?.integranteIds};
    for (final eq in equipos) {
      if (proyecto?.equipoIds.contains(eq.id) ?? false) {
        for (final m in eq.miembros) {
          ids.add(m.usuarioId);
        }
      }
    }
    elegibles = miembros.where((m) => ids.contains(m.usuarioId));
  }
  return elegibles
      .map((m) => (id: m.usuarioId, nombre: m.nombre))
      .toList(growable: false);
}
