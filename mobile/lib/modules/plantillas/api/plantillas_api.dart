import '../../../core/api/api_client.dart';
import '../../tareas/models/tarea_model.dart';
import '../models/plantilla_model.dart';

/// Cliente de API para `/api/plantillas` y `/api/organizaciones/{id}/plantillas`.
class PlantillasApi {
  const PlantillasApi({required this.apiClient});

  final ApiClient apiClient;

  String _base(int? organizacionId) => organizacionId != null
      ? '/organizaciones/$organizacionId/plantillas'
      : '/plantillas';

  /// Lista las plantillas personales o de una organización (`GET`).
  Future<List<PlantillaTareaDto>> obtenerTodas({int? organizacionId}) async {
    final response = await apiClient.dio.get<List<dynamic>>(
      _base(organizacionId),
    );
    return (response.data ?? const <dynamic>[])
        .whereType<Map<String, dynamic>>()
        .map(PlantillaTareaDto.fromJson)
        .toList(growable: false);
  }

  /// Crea una plantilla nueva (`POST`).
  Future<PlantillaTareaDto> crear({
    required String nombre,
    required String titulo,
    String contenido = '',
    PrioridadTarea prioridad = PrioridadTarea.media,
    String? color,
    List<String> subtareas = const <String>[],
    int? organizacionId,
  }) async {
    final colorLimpio = color?.trim();
    final response = await apiClient.dio.post<Map<String, dynamic>>(
      _base(organizacionId),
      data: <String, dynamic>{
        'nombre': nombre.trim(),
        'titulo': titulo.trim(),
        'contenido': contenido,
        'prioridad': prioridad.valorApi,
        'color': (colorLimpio != null && colorLimpio.isNotEmpty)
            ? colorLimpio
            : null,
        'subtareas': normalizarSubtareasPlantilla(subtareas),
      },
    );
    return PlantillaTareaDto.fromJson(response.data!);
  }

  /// Actualiza una plantilla existente (`PUT`).
  Future<PlantillaTareaDto> actualizar(
    int id, {
    required String nombre,
    required String titulo,
    required String contenido,
    required PrioridadTarea prioridad,
    String? color,
    required List<String> subtareas,
    int? organizacionId,
  }) async {
    final colorLimpio = color?.trim();
    final response = await apiClient.dio.put<Map<String, dynamic>>(
      '${_base(organizacionId)}/$id',
      data: <String, dynamic>{
        'nombre': nombre.trim(),
        'titulo': titulo.trim(),
        'contenido': contenido,
        'prioridad': prioridad.valorApi,
        'color': (colorLimpio != null && colorLimpio.isNotEmpty)
            ? colorLimpio
            : null,
        'subtareas': normalizarSubtareasPlantilla(subtareas),
      },
    );
    return PlantillaTareaDto.fromJson(response.data!);
  }

  /// Elimina una plantilla de forma definitiva (`DELETE`).
  Future<void> eliminar(int id, {int? organizacionId}) async {
    await apiClient.dio.delete<void>('${_base(organizacionId)}/$id');
  }
}
