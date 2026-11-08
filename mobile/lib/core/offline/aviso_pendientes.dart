import 'package:flutter/material.dart';
import '../theme/colores_noche_indigo.dart';
import 'cola_sin_conexion.dart';

/// Lista lo creado sin conexión que aún no llegó al servidor. Al vaciarse
/// (sincronizado), avisa con [onSincronizado] para recargar la lista real.
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
  late int _anterior = _cuantas();

  int _cuantas() =>
      widget.cola.pendientes(widget.usuarioId, widget.ruta).length;

  void _alCambiar() {
    final ahora = _cuantas();
    if (ahora < _anterior) widget.onSincronizado();
    setState(() => _anterior = ahora);
  }

  @override
  void initState() {
    super.initState();
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
                  color: colores.tintaTenue,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    '${pendientes.length} sin sincronizar: se enviarán al recuperar la conexión.',
                    style: textTheme.bodySmall?.copyWith(
                      color: colores.tintaSuave,
                    ),
                  ),
                ),
              ],
            ),
            for (final op in pendientes) ...<Widget>[
              const SizedBox(height: 8),
              Text(
                op.titulo,
                style: textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.w500,
                ),
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

/// Tras crear: `creada == null` significa que quedó en la cola sin conexión.
void avisarSiEncolada(BuildContext context, Object? creada) {
  if (creada != null || !context.mounted) return;
  ScaffoldMessenger.of(context).showSnackBar(
    const SnackBar(
      content: Text('Sin conexión: se guardó y se sincronizará al volver.'),
    ),
  );
}
