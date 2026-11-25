import 'package:flutter/material.dart';

import '../../../core/theme/colores_noche_indigo.dart';
import '../models/bandeja_notificacion_models.dart';
import '../utils/describir_notificacion.dart';

/// Fila de una notificación en la bandeja (`NotificacionesPage`).
class NotificacionFila extends StatelessWidget {
  const NotificacionFila({
    super.key,
    required this.notificacion,
    required this.onTap,
    this.yoId,
  });

  final NotificacionAppDto notificacion;
  final VoidCallback onTap;
  final int? yoId;

  IconData _iconoPorEvento(String? evento) {
    return switch (evento) {
      'tareaAsignada' => Icons.person_add_alt_1_outlined,
      'mencion' => Icons.alternate_email_rounded,
      'comentario' => Icons.chat_bubble_outline_rounded,
      'estadoCambiado' => Icons.sync_rounded,
      'vencimiento' => Icons.event_busy_outlined,
      'resumenDiario' => Icons.calendar_today_outlined,
      _ => Icons.notifications_none_rounded,
    };
  }

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final textTheme = Theme.of(context).textTheme;
    final leida = notificacion.leida;
    final etiqueta =
        etiquetasCortasEventoNotificacion[notificacion.evento] ??
        'Notificación';
    final tiempo = tiempoRelativoEs(notificacion.createdAt);
    final tarea = notificacion.tarea;
    final responsables = tarea != null
        ? describirResponsablesNotificacion(tarea.responsables, yoId: yoId)
        : null;

    return Material(
      color: leida
          ? Colors.transparent
          : colores.indigoMarca.withValues(alpha: 0.06),
      child: InkWell(
        onTap: onTap,
        child: ConstrainedBox(
          constraints: const BoxConstraints(minHeight: 68),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Container(
                  width: 36,
                  height: 36,
                  margin: const EdgeInsets.only(top: 2),
                  decoration: BoxDecoration(
                    color: colores.elevada,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    _iconoPorEvento(notificacion.evento),
                    size: 18,
                    color: leida ? colores.tintaTenue : colores.indigoMarca,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      Row(
                        children: <Widget>[
                          Flexible(
                            child: Text(
                              notificacion.actor != null
                                  ? '$etiqueta · ${notificacion.actor!.nombre}'
                                  : etiqueta,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: textTheme.labelMedium?.copyWith(
                                color: leida
                                    ? colores.tintaTenue
                                    : colores.indigoMarca,
                              ),
                            ),
                          ),
                          if (tiempo.isNotEmpty) ...<Widget>[
                            const SizedBox(width: 8),
                            Text(
                              tiempo,
                              style: textTheme.bodySmall?.copyWith(
                                color: colores.tintaTenue,
                              ),
                            ),
                          ],
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        tarea?.titulo ?? notificacion.asunto,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: textTheme.bodyLarge?.copyWith(
                          fontWeight: leida ? FontWeight.w400 : FontWeight.w600,
                          color: leida ? colores.tintaSuave : colores.tinta,
                        ),
                      ),
                      if (responsables != null) ...<Widget>[
                        const SizedBox(height: 4),
                        Text(
                          responsables.asigno != null
                              ? 'Encargado: ${responsables.encargado} · Asignó: ${responsables.asigno}'
                              : 'Encargado: ${responsables.encargado}',
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: textTheme.bodySmall?.copyWith(
                            color: colores.tintaTenue,
                          ),
                        ),
                      ] else if (notificacion.texto
                          .trim()
                          .isNotEmpty) ...<Widget>[
                        const SizedBox(height: 4),
                        Text(
                          notificacion.texto.trim(),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: textTheme.bodySmall?.copyWith(
                            color: colores.tintaTenue,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                if (!leida)
                  Container(
                    width: 8,
                    height: 8,
                    margin: const EdgeInsets.only(left: 8, top: 8),
                    decoration: BoxDecoration(
                      color: colores.indigoMarca,
                      shape: BoxShape.circle,
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
