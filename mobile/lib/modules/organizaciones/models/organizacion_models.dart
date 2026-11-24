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

/// Resumen de un rol asignado a un miembro.
class RolResumenDto {
  const RolResumenDto({required this.id, required this.nombre});

  final int id;
  final String nombre;

  factory RolResumenDto.fromJson(Map<String, dynamic> json) {
    return RolResumenDto(
      id: (json['id'] as num).toInt(),
      nombre: json['nombre'] as String? ?? '',
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
    this.roles = const <RolResumenDto>[],
  });

  final int usuarioId;
  final String nombre;
  final String email;
  final String? avatarUrl;
  final bool isAdmin;
  final List<RolResumenDto> roles;

  factory MiembroDto.fromJson(Map<String, dynamic> json) {
    final rolesRaw = json['roles'];
    final listaRoles = rolesRaw is List
        ? rolesRaw
              .whereType<Map<String, dynamic>>()
              .map(RolResumenDto.fromJson)
              .toList(growable: false)
        : const <RolResumenDto>[];

    return MiembroDto(
      usuarioId: (json['usuarioId'] as num).toInt(),
      nombre: json['nombre'] as String? ?? '',
      email: json['email'] as String? ?? '',
      avatarUrl: json['avatarUrl'] as String?,
      isAdmin: json['isAdmin'] as bool? ?? false,
      roles: listaRoles,
    );
  }
}

/// Invitación pendiente a una organización.
class InvitacionDto {
  const InvitacionDto({
    required this.id,
    required this.email,
    required this.expiraEn,
    this.isCaducada = false,
  });

  final int id;
  final String email;
  final String expiraEn;
  final bool isCaducada;

  factory InvitacionDto.fromJson(Map<String, dynamic> json) {
    return InvitacionDto(
      id: (json['id'] as num).toInt(),
      email: json['email'] as String? ?? '',
      expiraEn: json['expiraEn'] as String? ?? '',
      isCaducada: json['isCaducada'] as bool? ?? false,
    );
  }
}

/// Rol personalizado de una organización (`GET /api/organizaciones/{id}/roles`).
class RolOrganizacionDto {
  const RolOrganizacionDto({
    required this.id,
    required this.nombre,
    this.permisos = const <String>[],
    this.totalMiembros = 0,
  });

  final int id;
  final String nombre;
  final List<String> permisos;
  final int totalMiembros;

  factory RolOrganizacionDto.fromJson(Map<String, dynamic> json) {
    return RolOrganizacionDto(
      id: (json['id'] as num).toInt(),
      nombre: json['nombre'] as String? ?? '',
      permisos: _parsearStrings(json['permisos']),
      totalMiembros: (json['totalMiembros'] as num?)?.toInt() ?? 0,
    );
  }
}

/// Plantilla de rol sugerida por el catálogo del backend.
class PlantillaRolDto {
  const PlantillaRolDto({required this.nombre, required this.permisos});

  final String nombre;
  final List<String> permisos;

  factory PlantillaRolDto.fromJson(Map<String, dynamic> json) {
    return PlantillaRolDto(
      nombre: json['nombre'] as String? ?? '',
      permisos: _parsearStrings(json['permisos']),
    );
  }
}

/// Catálogo de permisos y plantillas de roles de una organización.
class CatalogoPermisosOrganizacionDto {
  const CatalogoPermisosOrganizacionDto({
    this.permisos = const <String>[],
    this.plantillas = const <PlantillaRolDto>[],
  });

  final List<String> permisos;
  final List<PlantillaRolDto> plantillas;

  factory CatalogoPermisosOrganizacionDto.fromJson(Map<String, dynamic> json) {
    final plantillasRaw = json['plantillas'];
    final listaPlantillas = plantillasRaw is List
        ? plantillasRaw
              .whereType<Map<String, dynamic>>()
              .map(PlantillaRolDto.fromJson)
              .toList(growable: false)
        : const <PlantillaRolDto>[];

    return CatalogoPermisosOrganizacionDto(
      permisos: _parsearStrings(json['permisos']),
      plantillas: listaPlantillas,
    );
  }
}

/// Texto humano de cada permiso de organización (RN-17).
const Map<String, String> etiquetasPermisoOrganizacion = <String, String>{
  'organizacion:editar': 'Editar nombre, descripción, color e imagen',
  'miembros:invitar': 'Invitar y gestionar invitaciones',
  'miembros:expulsar': 'Expulsar miembros',
  'roles:gestionar': 'Crear roles y asignarlos',
  'equipos:crear': 'Crear equipos',
  'equipos:editar': 'Editar equipos',
  'equipos:eliminar': 'Eliminar equipos',
  'proyectos:crear': 'Crear proyectos',
  'proyectos:editar': 'Editar proyectos',
  'proyectos:eliminar': 'Eliminar proyectos',
  'tags:gestionar': 'Gestionar los tags de la organización',
  'plantillas:gestionar':
      'Gestionar las plantillas de tareas de la organización',
};

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
