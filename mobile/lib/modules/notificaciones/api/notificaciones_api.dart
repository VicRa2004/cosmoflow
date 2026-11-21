import '../../../core/api/api_client.dart';
import '../models/notificacion_models.dart';

/// Cliente de API para `/api/notificaciones/*`.
class NotificacionesApi {
  const NotificacionesApi({required this.apiClient});

  final ApiClient apiClient;

  /// Consulta si el push móvil está disponible en el servidor y cuántos
  /// dispositivos tiene registrados el usuario (`GET /api/notificaciones/movil`).
  Future<EstadoMovilDto> estadoMovil() async {
    final response = await apiClient.dio.get<Map<String, dynamic>>(
      '/notificaciones/movil',
    );
    return EstadoMovilDto.fromJson(response.data ?? const <String, dynamic>{});
  }

  /// Consulta el estado del canal Telegram (`GET /api/notificaciones/telegram`).
  Future<EstadoTelegramDto> estadoTelegram() async {
    final response = await apiClient.dio.get<Map<String, dynamic>>(
      '/notificaciones/telegram',
    );
    return EstadoTelegramDto.fromJson(
      response.data ?? const <String, dynamic>{},
    );
  }

  /// Obtiene las preferencias de notificación del usuario (`GET /api/notificaciones/preferencias`).
  Future<List<PreferenciaNotificacionDto>> obtenerPreferencias() async {
    final response = await apiClient.dio.get<List<dynamic>>(
      '/notificaciones/preferencias',
    );
    return (response.data ?? const <dynamic>[])
        .whereType<Map<String, dynamic>>()
        .map(PreferenciaNotificacionDto.fromJson)
        .toList(growable: false);
  }

  /// Actualiza una o varias preferencias (`PUT /api/notificaciones/preferencias`).
  Future<List<PreferenciaNotificacionDto>> actualizarPreferencias(
    List<PreferenciaNotificacionDto> preferencias,
  ) async {
    final response = await apiClient.dio.put<List<dynamic>>(
      '/notificaciones/preferencias',
      data: preferencias.map((p) => p.toJson()).toList(growable: false),
    );
    return (response.data ?? const <dynamic>[])
        .whereType<Map<String, dynamic>>()
        .map(PreferenciaNotificacionDto.fromJson)
        .toList(growable: false);
  }
}
