import 'package:flutter/material.dart';

import '../theme/colores_noche_indigo.dart';
import 'cola_sin_conexion.dart';

/// Lista las operaciones hechas sin conexión que aún no llegaron al servidor.
/// Al vaciarse (sincronizado), avisa con [onSincronizado] para recargar la lista
/// real y muestra un `SnackBar` si hubo conflictos resueltos («gana el último»).
class AvisoPendientes extends StatefulWidget {
  const AvisoPendientes({
    super.key,
    required this.cola,
    required this.usuarioId,
    required this.ruta,
    required this.onSincronizado,
  });

  final ColaSinConexion cola;
  final int usuarioId;
  final String ruta;
  final VoidCallback onSincronizado;

  @override
  State<AvisoPendientes> createState() => _AvisoPendientesState();
}

class _AvisoPendientesState extends State<AvisoPendientes> {
  int _anterior = 0;

  int _cuantas() =>
      widget.cola.pendientes(widget.usuarioId, widget.ruta).length;

  void _alCambiar() {
    final ahora = _cuantas();
    final conflictos = widget.cola.consumirConflictos(
      widget.usuarioId,
      widget.ruta,
    );
    if (conflictos.isNotEmpty && mounted) {
      final mensajero = ScaffoldMessenger.of(context);
      for (final c in conflictos) {
        mensajero.showSnackBar(SnackBar(content: Text(c.mensaje)));
      }
    }
    if (ahora < _anterior) widget.onSincronizado();
    setState(() => _anterior = ahora);
  }

  @override
  void initState() {
    super.initState();
    _anterior = _cuantas();
    widget.cola.addListener(_alCambiar);
  }

  @override
  void dispose() {
    widget.cola.removeListener(_alCambiar);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final pendientes = widget.cola.pendientes(widget.usuarioId, widget.ruta);
    if (pendientes.isEmpty) return const SizedBox.shrink();
    final colores = context.colores;
    final textTheme = Theme.of(context).textTheme;
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Row(
              children: <Widget>[
                Icon(
                  Icons.cloud_off_rounded,
                  size: 18,
                  color: colores.amberAviso,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    '${pendientes.length} ${pendientes.length == 1 ? 'cambio pendiente' : 'cambios pendientes'} de subir.',
                    style: textTheme.bodySmall?.copyWith(
                      color: colores.tintaSuave,
                    ),
                  ),
                ),
              ],
            ),
            for (final op in pendientes) ...<Widget>[
              const SizedBox(height: 8),
              Row(
                children: <Widget>[
                  Expanded(
                    child: Text(
                      op.titulo,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: textTheme.bodyMedium?.copyWith(
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    op.etiquetaTipo,
                    style: textTheme.labelMedium?.copyWith(
                      color: colores.amberAviso,
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// [AvisoPendientes] con margen inferior, o nada si no hay cola o sesión.
Widget avisoPendientes({
  required ColaSinConexion? cola,
  required int? usuarioId,
  required String ruta,
  required VoidCallback onSincronizado,
}) {
  if (cola == null || usuarioId == null) return const SizedBox.shrink();
  return Padding(
    padding: const EdgeInsets.only(bottom: 12),
    child: AvisoPendientes(
      cola: cola,
      usuarioId: usuarioId,
      ruta: ruta,
      onSincronizado: onSincronizado,
    ),
  );
}

/// Tras crear/editar/eliminar: si quedó en la cola sin conexión, avisa al usuario.
void avisarSiEncolada(
  BuildContext context,
  Object? resultado, {
  String mensaje =
      'Sin conexión: el cambio quedó pendiente y se subirá al volver.',
}) {
  if (resultado != null && resultado != false) return;
  if (!context.mounted) return;
  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(mensaje)));
}
