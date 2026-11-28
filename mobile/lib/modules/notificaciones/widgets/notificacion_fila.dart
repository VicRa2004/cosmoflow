import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../../core/theme/colores_noche_indigo.dart';
import '../../../core/widgets/tarjeta_seccion.dart';
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
      'tareaAsignada' => LucideIcons.userPlus,
      'mencion' => LucideIcons.atSign,
      'comentario' => LucideIcons.messageSquare,
      'estadoCambiado' => LucideIcons.refreshCw,
      'vencimiento' => LucideIcons.clockAlert,
      'resumenDiario' => LucideIcons.calendar,
      _ => LucideIcons.bell,
    };
  }

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final textTheme = Theme.of(context).textTheme;
    final leida = notificacion.leida;
    final esVencimiento = notificacion.evento == 'vencimiento';
    final etiqueta =
        etiquetasCortasEventoNotificacion[notificacion.evento] ??
        'Notificación';
    final tiempo = tiempoRelativoEs(notificacion.createdAt);
    final tarea = notificacion.tarea;
    final responsables = tarea != null
        ? describirResponsablesNotificacion(tarea.responsables, yoId: yoId)
        : null;

    final colorIcono = leida
        ? colores.tintaTenue
        : esVencimiento
        ? colores.rosePeligro
        : colores.indigoMarca;
    final fondoIcono = leida
        ? colores.elevada
        : esVencimiento
        ? colores.roseSuave
        : colores.indigoSuave;

    return Material(
      color: leida
          ? colores.superficie
          : colores.indigoSuave.withValues(alpha: 0.4),
      child: InkWell(
        onTap: onTap,
        child: ConstrainedBox(
          constraints: const BoxConstraints(minHeight: 68),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Padding(
                  padding: const EdgeInsets.only(top: 2),
                  child: IconoCaja(
                    icono: _iconoPorEvento(notificacion.evento),
                    color: colorIcono,
                    fondo: fondoIcono,
                    dimension: 36,
                    tamanoIcono: 18,
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
                                    : esVencimiento
                                    ? colores.rosePeligro
                                    : colores.indigoMarca,
                                fontWeight: leida
                                    ? FontWeight.w500
                                    : FontWeight.w600,
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
                      color: esVencimiento
                          ? colores.rosePeligro
                          : colores.indigoMarca,
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
