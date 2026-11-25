import 'package:flutter/material.dart';

import '../../../core/theme/colores_noche_indigo.dart';
import '../../tareas/models/estadisticas_tareas_model.dart';

/// Tarjeta con recuento de tareas por estado, prioridad y responsable.
class EstadisticasTareasCard extends StatelessWidget {
  const EstadisticasTareasCard({
    super.key,
    required this.estadisticas,
    required this.nombres,
    this.titulo = 'Tareas',
  });

  final EstadisticasTareasDto estadisticas;
  final Map<int, String> nombres;
  final String titulo;

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final textTheme = Theme.of(context).textTheme;
    final total = estadisticas.total;

    final segmentos = <({String etiqueta, int valor, Color color})>[
      (
        etiqueta: 'Pendiente',
        valor: estadisticas.pendiente,
        color: colores.amberAviso,
      ),
      (
        etiqueta: 'En progreso',
        valor: estadisticas.enProgreso,
        color: colores.indigoMarca,
      ),
      (
        etiqueta: 'Completada',
        valor: estadisticas.completada,
        color: colores.emeraldExito,
      ),
      (
        etiqueta: 'Cancelada',
        valor: estadisticas.cancelada,
        color: colores.bordeFuerte,
      ),
    ];

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Text(titulo, style: textTheme.titleMedium),
            const SizedBox(height: 2),
            Text(
              '$total ${total == 1 ? 'tarea' : 'tareas'} en total.',
              style: textTheme.bodySmall?.copyWith(color: colores.tintaTenue),
            ),
            const SizedBox(height: 16),
            Row(
              children: <Widget>[
                Expanded(
                  child: _CifraBox(
                    valor: '${estadisticas.abiertas}',
                    etiqueta: 'Abiertas',
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _CifraBox(
                    valor: '${estadisticas.completada}',
                    etiqueta: 'Completadas',
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: <Widget>[
                Expanded(
                  child: _CifraBox(
                    valor: '${estadisticas.vencidas}',
                    etiqueta: 'Vencidas',
                    alerta: estadisticas.vencidas > 0,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _CifraBox(
                    valor: '${estadisticas.porcentajeAvance}%',
                    etiqueta: 'Avance cerradas',
                  ),
                ),
              ],
            ),
            if (total > 0) ...<Widget>[
              const SizedBox(height: 16),
              ClipRRect(
                borderRadius: BorderRadius.circular(999),
                child: SizedBox(
                  height: 9,
                  child: Row(
                    children: <Widget>[
                      for (final seg in segmentos)
                        if (seg.valor > 0)
                          Expanded(
                            flex: seg.valor,
                            child: ColoredBox(color: seg.color),
                          ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 12,
                runSpacing: 6,
                children: <Widget>[
                  for (final seg in segmentos)
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: <Widget>[
                        Container(
                          width: 8,
                          height: 8,
                          decoration: BoxDecoration(
                            color: seg.color,
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          '${seg.etiqueta}: ${seg.valor}',
                          style: textTheme.bodySmall?.copyWith(
                            color: colores.tintaSuave,
                          ),
                        ),
                      ],
                    ),
                ],
              ),
            ],
            const SizedBox(height: 20),
            Text(
              'Abiertas por prioridad',
              style: textTheme.labelLarge?.copyWith(color: colores.tintaSuave),
            ),
            const SizedBox(height: 8),
            _FilaDato(
              etiqueta: 'Alta',
              valor: '${estadisticas.alta}',
              puntoColor: colores.rosePeligro,
            ),
            _FilaDato(
              etiqueta: 'Media',
              valor: '${estadisticas.media}',
              puntoColor: colores.amberAviso,
            ),
            _FilaDato(
              etiqueta: 'Baja',
              valor: '${estadisticas.baja}',
              puntoColor: colores.tintaTenue,
            ),
            const SizedBox(height: 20),
            Text(
              'Por responsable (abiertas / completadas)',
              style: textTheme.labelLarge?.copyWith(color: colores.tintaSuave),
            ),
            const SizedBox(height: 8),
            if (estadisticas.porResponsable.isEmpty)
              Text(
                'Sin responsables asignados.',
                style: textTheme.bodySmall?.copyWith(color: colores.tintaTenue),
              )
            else
              for (final r in estadisticas.porResponsable)
                _FilaDato(
                  etiqueta: nombres[r.usuarioId] ?? 'Antiguo miembro',
                  valor: '${r.abiertas} / ${r.completadas}',
                ),
          ],
        ),
      ),
    );
  }
}

class _CifraBox extends StatelessWidget {
  const _CifraBox({
    required this.valor,
    required this.etiqueta,
    this.alerta = false,
  });

  final String valor;
  final String etiqueta;
  final bool alerta;

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final textTheme = Theme.of(context).textTheme;

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: alerta ? colores.roseSuave : colores.fondo,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: alerta
              ? colores.rosePeligro.withValues(alpha: 0.3)
              : colores.borde,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text(
            valor,
            style: textTheme.titleLarge?.copyWith(
              color: alerta ? colores.rosePeligro : colores.tinta,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            etiqueta,
            style: textTheme.bodySmall?.copyWith(color: colores.tintaTenue),
          ),
        ],
      ),
    );
  }
}

class _FilaDato extends StatelessWidget {
  const _FilaDato({
    required this.etiqueta,
    required this.valor,
    this.puntoColor,
  });

  final String etiqueta;
  final String valor;
  final Color? puntoColor;

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final textTheme = Theme.of(context).textTheme;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: <Widget>[
          if (puntoColor != null) ...<Widget>[
            Container(
              width: 8,
              height: 8,
              decoration: BoxDecoration(
                color: puntoColor,
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 8),
          ],
          Expanded(
            child: Text(
              etiqueta,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: textTheme.bodyMedium,
            ),
          ),
          Text(
            valor,
            style: textTheme.bodyMedium?.copyWith(color: colores.tintaSuave),
          ),
        ],
      ),
    );
  }
}
