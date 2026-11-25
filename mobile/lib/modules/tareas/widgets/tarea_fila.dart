import 'package:flutter/material.dart';

import '../../../core/theme/colores_noche_indigo.dart';
import '../models/tarea_model.dart';

/// Fila de lista: casilla de completar (48 dp), título, metadatos y acción de fijar.
class TareaFila extends StatelessWidget {
  const TareaFila({
    super.key,
    required this.tarea,
    required this.onTap,
    this.onAlternarCompletada,
    this.onAlternarFijada,
    this.mostrarEstado = true,
    this.puedeActualizar = true,
  });

  final TareaDto tarea;
  final VoidCallback onTap;
  final VoidCallback? onAlternarCompletada;
  final VoidCallback? onAlternarFijada;
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
    final puedeFijar = puedeActualizar && onAlternarFijada != null;

    return InkWell(
      onTap: onTap,
      child: ConstrainedBox(
        constraints: const BoxConstraints(minHeight: 64),
        child: Padding(
          padding: EdgeInsets.fromLTRB(4, 8, puedeFijar ? 4 : 16, 8),
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
                    Row(
                      children: <Widget>[
                        Expanded(
                          child: Text(
                            tarea.titulo,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: textTheme.bodyLarge?.copyWith(
                              decoration: completada
                                  ? TextDecoration.lineThrough
                                  : null,
                              color: completada
                                  ? colores.tintaTenue
                                  : colores.tinta,
                            ),
                          ),
                        ),
                        if (tarea.bloqueada) ...<Widget>[
                          const SizedBox(width: 6),
                          Icon(
                            Icons.lock_outline_rounded,
                            size: 16,
                            color: colores.amberAviso,
                            semanticLabel: 'Bloqueada',
                          ),
                        ],
                        if (tarea.recurrencia != null) ...<Widget>[
                          const SizedBox(width: 6),
                          Icon(
                            Icons.repeat_rounded,
                            size: 16,
                            color: colores.indigoMarca,
                            semanticLabel:
                                'Se repite: ${tarea.recurrencia!.etiqueta}',
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 2),
                    _Metadatos(tarea: tarea, mostrarEstado: mostrarEstado),
                  ],
                ),
              ),
              if (puedeFijar)
                IconButton(
                  tooltip: tarea.isFijada ? 'Desfijar tarea' : 'Fijar tarea',
                  onPressed: onAlternarFijada,
                  icon: Icon(
                    tarea.isFijada
                        ? Icons.push_pin_rounded
                        : Icons.push_pin_outlined,
                    size: 20,
                    color: tarea.isFijada
                        ? colores.indigoMarca
                        : colores.tintaTenue,
                  ),
                )
              else if (tarea.isFijada)
                Padding(
                  padding: const EdgeInsets.only(left: 8),
                  child: Icon(
                    Icons.push_pin_rounded,
                    size: 18,
                    color: colores.indigoMarca,
                    semanticLabel: 'Fijada',
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
      if (tarea.bloqueada)
        TextSpan(
          text: 'Bloqueada · ',
          style: TextStyle(color: colores.amberAviso),
        ),
      TextSpan(
        text: texto,
        style: TextStyle(color: color),
      ),
      if (mostrarEstado) TextSpan(text: ' · ${tarea.estado.etiqueta}'),
      if (tarea.recurrencia != null)
        TextSpan(text: ' · ${tarea.recurrencia!.etiqueta}'),
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
    if (dias == 0) return ('Hoy', colores.amberAviso);
    if (dias == 1) return ('Mañana', colores.amberAviso);
    return (dia, colores.tintaTenue);
  }
}
