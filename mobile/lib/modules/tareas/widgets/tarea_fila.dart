import 'package:flutter/material.dart';
import '../../../core/theme/colores_noche_indigo.dart';
import '../models/tarea_model.dart';

const Color _ambar = Color(0xFFD97706);

/// Fila de lista: casilla de completar (48 dp), título y una línea de metadatos.
class TareaFila extends StatelessWidget {
  const TareaFila({
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

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final textTheme = Theme.of(context).textTheme;
    final completada = tarea.estado == EstadoTarea.completada;
    final puedeMarcar =
        puedeActualizar &&
        tarea.estado != EstadoTarea.cancelada &&
        onAlternarCompletada != null;

    return InkWell(
      onTap: onTap,
      child: ConstrainedBox(
        constraints: const BoxConstraints(minHeight: 64),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(4, 8, 16, 8),
          child: Row(
            children: <Widget>[
              SizedBox.square(
                dimension: 48,
                child: puedeMarcar
                    ? Checkbox(
                        value: completada,
                        shape: const CircleBorder(),
                        semanticLabel: completada ? 'Reabrir' : 'Completar',
                        onChanged: (_) => onAlternarCompletada!(),
                      )
                    : Icon(
                        tarea.estado == EstadoTarea.cancelada
                            ? Icons.block_rounded
                            : Icons.radio_button_unchecked_rounded,
                        color: colores.tintaTenue,
                      ),
              ),
              const SizedBox(width: 4),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Text(
                      tarea.titulo,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: textTheme.bodyLarge?.copyWith(
                        decoration: completada
                            ? TextDecoration.lineThrough
                            : null,
                        color: completada ? colores.tintaTenue : colores.tinta,
                      ),
                    ),
                    const SizedBox(height: 2),
                    _Metadatos(tarea: tarea, mostrarEstado: mostrarEstado),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Metadatos extends StatelessWidget {
  const _Metadatos({required this.tarea, required this.mostrarEstado});

  final TareaDto tarea;
  final bool mostrarEstado;

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final base = Theme.of(context).textTheme.bodySmall;
    final (texto, color) = _vencimiento(colores);
    final partes = <InlineSpan>[
      if (tarea.prioridad == PrioridadTarea.alta)
        TextSpan(
          text: '● Alta  ',
          style: TextStyle(color: colores.rosePeligro),
        ),
      TextSpan(
        text: texto,
        style: TextStyle(color: color),
      ),
      if (mostrarEstado) TextSpan(text: ' · ${tarea.estado.etiqueta}'),
      if (tarea.isCompartida) const TextSpan(text: ' · Compartida'),
    ];
    return Text.rich(
      TextSpan(children: partes),
      maxLines: 1,
      overflow: TextOverflow.ellipsis,
      style: base?.copyWith(color: colores.tintaTenue),
    );
  }

  (String, Color) _vencimiento(ColoresNocheIndigo colores) {
    final dia = tarea.fechaVencimiento;
    if (dia == null || dia.isEmpty) return ('Sin fecha', colores.tintaTenue);
    final ahora = DateTime.now();
    final hoy = DateTime(ahora.year, ahora.month, ahora.day);
    final fecha = DateTime.tryParse(dia);
    if (fecha == null || !tarea.estado.isAbierta) {
      return (dia, colores.tintaTenue);
    }
    final dias = fecha.difference(hoy).inDays;
    if (dias < 0) return ('Vencida · $dia', colores.rosePeligro);
    if (dias == 0) return ('Hoy', _ambar);
    if (dias == 1) return ('Mañana', _ambar);
    return (dia, colores.tintaTenue);
  }
}
