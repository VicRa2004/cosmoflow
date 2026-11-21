/// Estado del canal móvil (`GET /api/notificaciones/movil`).
class EstadoMovilDto {
  const EstadoMovilDto({required this.disponible, required this.dispositivos});

  final bool disponible;
  final int dispositivos;

  factory EstadoMovilDto.fromJson(Map<String, dynamic> json) {
    return EstadoMovilDto(
      disponible: json['disponible'] as bool? ?? false,
      dispositivos: (json['dispositivos'] as num?)?.toInt() ?? 0,
    );
  }
}

/// Estado del canal Telegram (`GET /api/notificaciones/telegram`).
class EstadoTelegramDto {
  const EstadoTelegramDto({required this.disponible, required this.vinculado});

  final bool disponible;
  final bool vinculado;

  factory EstadoTelegramDto.fromJson(Map<String, dynamic> json) {
    return EstadoTelegramDto(
      disponible: json['disponible'] as bool? ?? false,
      vinculado: json['vinculado'] as bool? ?? false,
    );
  }
}

/// Preferencia de notificación por evento y canal (`GET/PUT /api/notificaciones/preferencias`).
class PreferenciaNotificacionDto {
  const PreferenciaNotificacionDto({
    required this.evento,
    required this.canal,
    required this.activo,
    this.personalizado,
  });

  final String evento;
  final String canal;
  final bool activo;
  final bool? personalizado;

  PreferenciaNotificacionDto copyWith({bool? activo, bool? personalizado}) {
    return PreferenciaNotificacionDto(
      evento: evento,
      canal: canal,
      activo: activo ?? this.activo,
      personalizado: personalizado ?? this.personalizado,
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
    'evento': evento,
    'canal': canal,
    'activo': activo,
  };

  factory PreferenciaNotificacionDto.fromJson(Map<String, dynamic> json) {
    return PreferenciaNotificacionDto(
      evento: json['evento'] as String? ?? '',
      canal: json['canal'] as String? ?? '',
      activo: json['activo'] as bool? ?? false,
      personalizado: json['personalizado'] as bool?,
    );
  }
}

/// Etiquetas humanas por evento de notificación (espejo de la web).
const Map<String, String> etiquetasEventoNotificacion = <String, String>{
  'tareaAsignada': 'Te asignan una tarea',
  'mencion': 'Te mencionan en una tarea',
  'estadoCambiado': 'Cambia el estado de una tarea que creaste',
  'vencimiento': 'Una tarea tuya vence mañana o hoy',
  'comentario': 'Comentan una tarea que creaste o de la que eres responsable',
};

/// Etiquetas humanas por canal de notificación (espejo de la web).
const Map<String, String> etiquetasCanalNotificacion = <String, String>{
  'app': 'En la app',
  'correo': 'Correo',
  'movil': 'Móvil',
  'telegram': 'Telegram',
};
