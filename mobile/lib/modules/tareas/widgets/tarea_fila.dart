import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../../core/theme/colores_noche_indigo.dart';
import '../../../core/widgets/tarjeta_seccion.dart';
import '../models/tarea_model.dart';

/// Fila de lista de tarea: casilla circular (48 dp), título Inter, pills de
/// metadatos y acción de fijar con iconos Lucide.
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
        constraints: const BoxConstraints(minHeight: 62),
        child: Padding(
          padding: EdgeInsets.fromLTRB(6, 10, puedeFijar ? 6 : 16, 10),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: <Widget>[
              SizedBox.square(
                dimension: 48,
                child: puedeMarcar
                    ? Checkbox(
                        value: completada,
                        shape: const CircleBorder(),
                        semanticLabel: completada ? 'Reabrir' : 'Completar',
                        onChanged: (_) {
                          HapticFeedback.selectionClick();
                          onAlternarCompletada!();
                        },
                      )
                    : Icon(
                        tarea.estado == EstadoTarea.cancelada
                            ? LucideIcons.ban
                            : LucideIcons.circle,
                        size: 20,
                        color: colores.tintaTenue,
                      ),
              ),
              const SizedBox(width: 2),
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
                              fontWeight: FontWeight.w500,
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
                            LucideIcons.lock,
                            size: 14,
                            color: colores.amberAviso,
                            semanticLabel: 'Bloqueada',
                          ),
                        ],
                        if (tarea.recurrencia != null) ...<Widget>[
                          const SizedBox(width: 6),
                          Icon(
                            LucideIcons.repeat,
                            size: 14,
                            color: colores.indigoMarca,
                            semanticLabel:
                                'Se repite: ${tarea.recurrencia!.etiqueta}',
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 5),
                    _Metadatos(tarea: tarea, mostrarEstado: mostrarEstado),
                  ],
                ),
              ),
              if (puedeFijar)
                IconButton(
                  tooltip: tarea.isFijada ? 'Desfijar tarea' : 'Fijar tarea',
                  onPressed: onAlternarFijada,
                  icon: Icon(
                    LucideIcons.pin,
                    size: 17,
                    color: tarea.isFijada
                        ? colores.indigoMarca
                        : colores.tintaTenue.withValues(alpha: 0.65),
                  ),
                )
              else if (tarea.isFijada)
                Padding(
                  padding: const EdgeInsets.only(left: 8),
                  child: Icon(
                    LucideIcons.pin,
                    size: 16,
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
    final (textoFecha, colorFecha, fondoFecha) = _vencimiento(colores);

    return Wrap(
      spacing: 6,
      runSpacing: 4,
      crossAxisAlignment: WrapCrossAlignment.center,
      children: <Widget>[
        if (tarea.prioridad == PrioridadTarea.alta)
          InsigniaPill(
            texto: 'Alta',
            icono: LucideIcons.flag,
            colorTexto: colores.rosePeligro,
            colorFondo: colores.roseSuave,
          ),
        if (textoFecha != null)
          InsigniaPill(
            texto: textoFecha,
            icono: LucideIcons.calendar,
            colorTexto: colorFecha,
            colorFondo: fondoFecha,
          ),
        if (tarea.bloqueada)
          InsigniaPill(
            texto: 'Bloqueada',
            colorTexto: colores.amberAviso,
            colorFondo: colores.amberSuave,
          ),
        if (mostrarEstado)
          InsigniaPill(
            texto: tarea.estado.etiqueta,
            colorTexto: colores.tintaSuave,
            colorFondo: colores.elevada,
          ),
        if (tarea.isCompartida)
          InsigniaPill(
            texto: 'Compartida',
            icono: LucideIcons.users,
            colorTexto: colores.indigoMarca,
            colorFondo: colores.indigoSuave,
          ),
      ],
    );
  }

  (String?, Color, Color) _vencimiento(ColoresNocheIndigo colores) {
    final dia = tarea.fechaVencimiento;
    if (dia == null || dia.isEmpty) {
      return (null, colores.tintaTenue, colores.elevada);
    }
    final ahora = DateTime.now();
    final hoy = DateTime(ahora.year, ahora.month, ahora.day);
    final fecha = DateTime.tryParse(dia);
    if (fecha == null || !tarea.estado.isAbierta) {
      return (dia, colores.tintaTenue, colores.elevada);
    }
    final dias = fecha.difference(hoy).inDays;
    if (dias < 0) return ('Vencida · $dia', colores.rosePeligro, colores.roseSuave);
    if (dias == 0) return ('Hoy', colores.amberAviso, colores.amberSuave);
    if (dias == 1) return ('Mañana', colores.amberAviso, colores.amberSuave);
    return (dia, colores.tintaSuave, colores.elevada);
  }
}
