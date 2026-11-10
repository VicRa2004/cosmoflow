import 'package:flutter/material.dart';
import '../../../core/theme/colores_noche_indigo.dart';
import '../models/tarea_model.dart';

/// Tarjeta/fila de tarea con punto de color, badges semánticos, vencimiento y botón «Completar»/«Reabrir».
class TareaCard extends StatelessWidget {
  const TareaCard({
    super.key,
    required this.tarea,
    required this.onTap,
    this.onAlternarCompletada,
    this.mostrarEstado = true,
    this.puedeActualizar = true,
  });

  final TareaDto tarea;
  final VoidCallback onTap;
  final VoidCallback? onAlternarCompletada;
  final bool mostrarEstado;
  final bool puedeActualizar;

  static Color? _parsearColorHex(String? hex) {
    if (hex == null || hex.isEmpty) return null;
    final limpio = hex.replaceFirst('#', '');
    if (limpio.length != 6) return null;
    final valor = int.tryParse('FF$limpio', radix: 16);
    return valor != null ? Color(valor) : null;
  }

  static String _hoyIso() {
    final ahora = DateTime.now();
    final m = ahora.month.toString().padLeft(2, '0');
    final d = ahora.day.toString().padLeft(2, '0');
    return '${ahora.year}-$m-$d';
  }

  static String _mananaIso() {
    final manana = DateTime.now().add(const Duration(days: 1));
    final m = manana.month.toString().padLeft(2, '0');
    final d = manana.day.toString().padLeft(2, '0');
    return '${manana.year}-$m-$d';
  }

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final textTheme = Theme.of(context).textTheme;
    final puntoColor = _parsearColorHex(tarea.color);
    final isCompletada = tarea.estado == EstadoTarea.completada;
    final mostrarBotonAccion =
        puedeActualizar &&
        tarea.estado != EstadoTarea.cancelada &&
        onAlternarCompletada != null;

    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(8),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  if (puntoColor != null) ...<Widget>[
                    Padding(
                      padding: const EdgeInsets.only(top: 5, right: 8),
                      child: Container(
                        width: 8,
                        height: 8,
                        decoration: BoxDecoration(
                          color: puntoColor,
                          shape: BoxShape.circle,
                        ),
                      ),
                    ),
                  ],
                  Expanded(
                    child: Text(
                      tarea.titulo,
                      style: textTheme.bodyMedium?.copyWith(
                        fontWeight: FontWeight.w500,
                        decoration:
                            isCompletada ? TextDecoration.lineThrough : null,
                        color: isCompletada
                            ? colores.tintaTenue
                            : colores.tinta,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Wrap(
                spacing: 8,
                runSpacing: 6,
                crossAxisAlignment: WrapCrossAlignment.center,
                children: <Widget>[
                  _PrioridadBadge(prioridad: tarea.prioridad),
                  if (mostrarEstado) _EstadoBadge(estado: tarea.estado),
                  _TextoVencimiento(
                    tarea: tarea,
                    hoyIso: _hoyIso(),
                    mananaIso: _mananaIso(),
                  ),
                  Text(
                    tarea.isCompartida ? 'Compartida' : 'Personal',
                    style: textTheme.bodySmall,
                  ),
                ],
              ),
              if (mostrarBotonAccion) ...<Widget>[
                const SizedBox(height: 12),
                Align(
                  alignment: Alignment.centerRight,
                  child: OutlinedButton.icon(
                    onPressed: onAlternarCompletada,
                    style: OutlinedButton.styleFrom(
                      minimumSize: const Size(0, 32),
                      padding: const EdgeInsets.symmetric(horizontal: 10),
                    ),
                    icon: Icon(
                      isCompletada
                          ? Icons.replay_rounded
                          : Icons.check_circle_outline_rounded,
                      size: 16,
                    ),
                    label: Text(
                      isCompletada ? 'Reabrir' : 'Completar',
                      style: const TextStyle(fontSize: 13),
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _PrioridadBadge extends StatelessWidget {
  const _PrioridadBadge({required this.prioridad});

  final PrioridadTarea prioridad;

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    Color texto;
    Color fondo;

    switch (prioridad) {
      case PrioridadTarea.alta:
        texto = colores.rosePeligro;
        fondo = colores.rosePeligro.withValues(alpha: 0.12);
      case PrioridadTarea.media:
        texto = const Color(0xFFD97706);
        fondo = const Color(0xFFD97706).withValues(alpha: 0.12);
      case PrioridadTarea.baja:
        texto = colores.tintaSuave;
        fondo = colores.elevada;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: fondo,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: colores.borde, width: 1),
      ),
      child: Text(
        prioridad.etiqueta,
        style: TextStyle(
          color: texto,
          fontSize: 12,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }
}

class _EstadoBadge extends StatelessWidget {
  const _EstadoBadge({required this.estado});

  final EstadoTarea estado;

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    Color texto;
    Color fondo;

    switch (estado) {
      case EstadoTarea.enProgreso:
        texto = colores.indigoMarca;
        fondo = colores.indigoMarca.withValues(alpha: 0.12);
      case EstadoTarea.completada:
        texto = const Color(0xFF059669);
        fondo = const Color(0xFF059669).withValues(alpha: 0.12);
      case EstadoTarea.cancelada:
        texto = const Color(0xFFD97706);
        fondo = const Color(0xFFD97706).withValues(alpha: 0.12);
      case EstadoTarea.pendiente:
        texto = colores.tintaSuave;
        fondo = colores.elevada;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: fondo,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: colores.borde, width: 1),
      ),
      child: Text(
        estado.etiqueta,
        style: TextStyle(
          color: texto,
          fontSize: 12,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }
}

class _TextoVencimiento extends StatelessWidget {
  const _TextoVencimiento({
    required this.tarea,
    required this.hoyIso,
    required this.mananaIso,
  });

  final TareaDto tarea;
  final String hoyIso;
  final String mananaIso;

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final dia = tarea.fechaVencimiento;
    if (dia == null || dia.isEmpty) {
      return Text(
        'Sin fecha',
        style: TextStyle(color: colores.tintaTenue, fontSize: 12),
      );
    }

    if (tarea.estado.isAbierta && dia.compareTo(hoyIso) < 0) {
      return Text(
        '$dia · vencida',
        style: TextStyle(
          color: colores.rosePeligro,
          fontSize: 12,
          fontWeight: FontWeight.w500,
        ),
      );
    }
    if (tarea.estado.isAbierta && dia == hoyIso) {
      return const Text(
        'Hoy',
        style: TextStyle(
          color: Color(0xFFD97706),
          fontSize: 12,
          fontWeight: FontWeight.w500,
        ),
      );
    }
    if (tarea.estado.isAbierta && dia == mananaIso) {
      return const Text(
        'Mañana',
        style: TextStyle(
          color: Color(0xFFD97706),
          fontSize: 12,
        ),
      );
    }

    return Text(
      dia,
      style: TextStyle(color: colores.tintaSuave, fontSize: 12),
    );
  }
}
