import '../../tareas/models/tarea_model.dart';

/// DTO de Plantilla de tarea (`PlantillaTareaDto` en `schema.gen.ts`).
class PlantillaTareaDto {
  const PlantillaTareaDto({
    required this.id,
    required this.nombre,
    required this.titulo,
    this.contenido = '',
    this.prioridad = PrioridadTarea.media,
    this.color,
    this.subtareas = const <String>[],
  });

  final int id;
  final String nombre;
  final String titulo;
  final String contenido;
  final PrioridadTarea prioridad;
  final String? color;
  final List<String> subtareas;

  factory PlantillaTareaDto.fromJson(Map<String, dynamic> json) {
    final rawSubtareas = json['subtareas'];
    final listaSubtareas = rawSubtareas is List
        ? rawSubtareas
              .whereType<String>()
              .map((s) => s.trim())
              .where((s) => s.isNotEmpty)
              .toList(growable: false)
        : const <String>[];

    return PlantillaTareaDto(
      id: (json['id'] as num).toInt(),
      nombre: json['nombre'] as String? ?? '',
      titulo: json['titulo'] as String? ?? '',
      contenido: json['contenido'] as String? ?? '',
      prioridad: PrioridadTarea.fromValorApi(json['prioridad'] as String?),
      color: json['color'] as String?,
      subtareas: listaSubtareas,
    );
  }
}

/// Recorta espacios, descarta subtareas vacías y limita a 100 elementos.
List<String> normalizarSubtareasPlantilla(Iterable<String> subtareas) {
  return subtareas
      .map((s) => s.trim())
      .where((s) => s.isNotEmpty)
      .take(100)
      .toList(growable: false);
}

/// Construye el cuerpo para `POST /api/plantillas` desde una [TareaDto].
///
/// RN-60: no incluye `tagIds`, fechas ni `responsableIds`.
Map<String, dynamic> construirPayloadPlantillaDesdeTarea(
  TareaDto tarea, {
  required String nombre,
}) {
  final color = tarea.color?.trim();
  return <String, dynamic>{
    'nombre': nombre.trim(),
    'titulo': tarea.titulo.trim(),
    'contenido': tarea.contenido,
    'prioridad': tarea.prioridad.valorApi,
    'color': (color != null && color.isNotEmpty) ? color : null,
    'subtareas': normalizarSubtareasPlantilla(
      tarea.subtareas.map((s) => s.titulo),
    ),
  };
}
