import '../models/bandeja_notificacion_models.dart';

/// Etiquetas cortas de evento para la bandeja (espejo de `describirNotificacion.ts`).
const Map<String, String> etiquetasCortasEventoNotificacion = <String, String>{
  'tareaAsignada': 'Tarea asignada',
  'mencion': 'Te mencionaron',
  'comentario': 'Nuevo comentario',
  'estadoCambiado': 'Cambio de estado',
  'vencimiento': 'Vence pronto',
  'resumenDiario': 'Resumen del día',
};

String _nombreDe(int id, String nombre, int? yoId) =>
    id == yoId ? 'tú' : nombre;

/// Líneas «Encargado» y «Asignó» de una tarea avisada.
({String encargado, String? asigno}) describirResponsablesNotificacion(
  List<ResponsableAvisoDto> responsables, {
  int? yoId,
}) {
  if (responsables.isEmpty) {
    return (encargado: 'Sin encargado', asigno: null);
  }
  final encargado = responsables
      .map((r) => _nombreDe(r.id, r.nombre, yoId))
      .join(', ');
  if (responsables.every((r) => r.asignadoPor?.id == r.id)) {
    return (encargado: encargado, asigno: 'la misma persona');
  }
  final asignadores = <int, PersonaAvisoDto>{};
  for (final r in responsables) {
    final por = r.asignadoPor;
    if (por != null) asignadores[por.id] = por;
  }
  if (asignadores.isEmpty) {
    return (encargado: encargado, asigno: null);
  }
  final asigno = asignadores.values
      .map((p) => _nombreDe(p.id, p.nombre, yoId))
      .join(', ');
  return (encargado: encargado, asigno: asigno);
}

/// Formato relativo compacto en español (`ahora`, `hace 5 min`, `hace 2 h`, `hace 3 d`).
String tiempoRelativoEs(String iso, {DateTime? ahora}) {
  final fecha = DateTime.tryParse(iso);
  if (fecha == null) return '';
  final referencia = ahora ?? DateTime.now();
  final segundos = referencia.difference(fecha).inSeconds;
  final abs = segundos.abs();
  if (abs < 60) return 'ahora';
  if (abs < 3600) return 'hace ${(abs / 60).round()} min';
  if (abs < 86400) return 'hace ${(abs / 3600).round()} h';
  return 'hace ${(abs / 86400).round()} d';
}
