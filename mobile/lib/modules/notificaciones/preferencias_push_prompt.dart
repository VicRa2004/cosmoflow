import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../core/widgets/avisos.dart';
import 'api/notificaciones_api.dart';
import 'models/notificacion_models.dart';

/// Aviso que solo se activa a mano: «solo móvil» ni lo cuenta ni lo enciende.
const _soloManual = 'resumenDiario';

String _clavePromptVisto(int usuarioId) => 'push_prompt_visto_$usuarioId';

/// Comprueba si conviene ofrecer al usuario pasar sus avisos a solo móvil:
/// basta con que algún evento tenga `movil` desactivado.
bool debeOfrecerSoloMovil(List<PreferenciaNotificacionDto> preferencias) {
  final deMovil = preferencias.where(
    (p) => p.canal == 'movil' && p.evento != _soloManual,
  );
  if (deMovil.isEmpty) return false;
  return deMovil.any((p) => !p.activo);
}

/// Construye el lote para `PUT /api/notificaciones/preferencias`:
/// activa `canal: "movil"` y desactiva `canal: "correo"` en todos los eventos
/// salvo el resumen diario, que solo se activa a mano.
List<PreferenciaNotificacionDto> construirPreferenciasSoloMovil(
  List<PreferenciaNotificacionDto> actuales,
) {
  final eventos = actuales.map((p) => p.evento).toSet();
  if (eventos.isEmpty) {
    eventos.addAll(etiquetasEventoNotificacion.keys);
  }
  // Pasar a solo móvil no debe activar avisos que el usuario nunca pidió.
  eventos.remove(_soloManual);
  return <PreferenciaNotificacionDto>[
    for (final evento in eventos) ...<PreferenciaNotificacionDto>[
      PreferenciaNotificacionDto(evento: evento, canal: 'movil', activo: true),
      PreferenciaNotificacionDto(
        evento: evento,
        canal: 'correo',
        activo: false,
      ),
    ],
  ];
}

/// Pregunta una sola vez por usuario, al entrar a la app móvil con push activo,
/// si desea recibir sus avisos solo por móvil en lugar de por correo.
Future<void> ofrecerSoloMovilSiCorresponde({
  required BuildContext context,
  required int usuarioId,
  required NotificacionesApi notificacionesApi,
  SharedPreferences? prefs,
  VoidCallback? onPreferenciasActualizadas,
}) async {
  try {
    final storage = prefs ?? await SharedPreferences.getInstance();
    final clave = _clavePromptVisto(usuarioId);
    if (storage.getBool(clave) ?? false) return;

    final movil = await notificacionesApi.estadoMovil();
    if (!movil.disponible || movil.dispositivos == 0) return;

    final preferencias = await notificacionesApi.obtenerPreferencias();
    if (!debeOfrecerSoloMovil(preferencias)) {
      await storage.setBool(clave, true);
      return;
    }

    await storage.setBool(clave, true);
    if (!context.mounted) return;

    final aceptar = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('¿Recibir avisos solo en el móvil?'),
        content: const Text(
          'Podemos enviarte tareas asignadas, menciones y vencimientos como notificaciones push y desactivar el correo. Puedes cambiarlo cuando quieras desde Perfil.',
        ),
        actions: <Widget>[
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Ahora no'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Usar solo móvil'),
          ),
        ],
      ),
    );

    if (aceptar != true || !context.mounted) return;
    final ok = await ejecutarConAviso(
      context,
      () => notificacionesApi.actualizarPreferencias(
        construirPreferenciasSoloMovil(preferencias),
      ),
      error: 'No se pudieron actualizar tus preferencias de notificación.',
      exito: 'Avisos configurados solo por móvil',
    );
    if (ok) onPreferenciasActualizadas?.call();
  } catch (_) {
    // Si falla la red no bloqueamos el uso normal de la app.
  }
}
