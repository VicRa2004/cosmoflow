/// Sesión activa del usuario (`GET /api/auth/sesiones`).
class SesionActivaDto {
  const SesionActivaDto({
    required this.id,
    required this.createdAt,
    required this.expiraEn,
    required this.isActual,
  });

  final int id;
  final DateTime createdAt;
  final DateTime expiraEn;
  final bool isActual;

  factory SesionActivaDto.fromJson(
    Map<String, dynamic> json,
  ) => SesionActivaDto(
    id: (json['id'] as num).toInt(),
    createdAt:
        DateTime.tryParse(json['createdAt'] as String? ?? '') ?? DateTime.now(),
    expiraEn:
        DateTime.tryParse(json['expiraEn'] as String? ?? '') ?? DateTime.now(),
    isActual: json['isActual'] as bool? ?? false,
  );
}

/// Estado de la verificación en dos pasos (`GET /api/auth/dos-pasos`).
class EstadoDosPasosDto {
  const EstadoDosPasosDto({
    required this.isActivo,
    required this.codigosRestantes,
  });

  final bool isActivo;
  final int codigosRestantes;

  factory EstadoDosPasosDto.fromJson(Map<String, dynamic> json) =>
      EstadoDosPasosDto(
        isActivo: json['isActivo'] as bool? ?? false,
        codigosRestantes: (json['codigosRestantes'] as num?)?.toInt() ?? 0,
      );
}

/// Datos de inicio de configuración TOTP (`POST /api/auth/dos-pasos/iniciar`).
class InicioDosPasosDto {
  const InicioDosPasosDto({required this.secreto, required this.uri});

  final String secreto;
  final String uri;

  factory InicioDosPasosDto.fromJson(Map<String, dynamic> json) =>
      InicioDosPasosDto(
        secreto: json['secreto'] as String? ?? '',
        uri: json['uri'] as String? ?? '',
      );
}

/// Estado de la suscripción iCalendar (`GET /api/calendario/suscripcion`).
class SuscripcionCalendarioDto {
  const SuscripcionCalendarioDto({required this.activa, this.creadaEn});

  final bool activa;
  final DateTime? creadaEn;

  factory SuscripcionCalendarioDto.fromJson(Map<String, dynamic> json) =>
      SuscripcionCalendarioDto(
        activa: json['activa'] as bool? ?? false,
        creadaEn: DateTime.tryParse(json['creadaEn'] as String? ?? ''),
      );
}
