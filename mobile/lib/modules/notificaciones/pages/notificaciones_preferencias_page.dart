import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../../core/theme/colores_noche_indigo.dart';
import '../../../core/widgets/avisos.dart';
import '../../../core/widgets/estados.dart';
import '../../../core/widgets/tarjeta_seccion.dart';
import '../api/notificaciones_api.dart';
import '../models/notificacion_models.dart';
import '../preferencias_push_prompt.dart';

/// Vista `/perfil/notificaciones`: elegir canal (en la app, correo, móvil, telegram)
/// por tipo de aviso dentro de tarjetas agrupadas.
class NotificacionesPreferenciasPage extends StatefulWidget {
  const NotificacionesPreferenciasPage({
    super.key,
    required this.notificacionesApi,
    this.cargarAlIniciar = true,
    this.onPreferenciasActualizadas,
  });

  final NotificacionesApi notificacionesApi;
  final bool cargarAlIniciar;
  final VoidCallback? onPreferenciasActualizadas;

  @override
  State<NotificacionesPreferenciasPage> createState() =>
      _NotificacionesPreferenciasPageState();
}

class _NotificacionesPreferenciasPageState
    extends State<NotificacionesPreferenciasPage> {
  List<PreferenciaNotificacionDto> _preferencias =
      const <PreferenciaNotificacionDto>[];
  EstadoMovilDto? _movil;
  EstadoTelegramDto? _telegram;
  bool _cargando = false;
  bool _guardando = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    if (widget.cargarAlIniciar) _cargar();
  }

  Future<void> _cargar() async {
    setState(() {
      _cargando = true;
      _error = null;
    });
    try {
      final res = await Future.wait<dynamic>(<Future<dynamic>>[
        widget.notificacionesApi.obtenerPreferencias(),
        widget.notificacionesApi.estadoMovil(),
        widget.notificacionesApi.estadoTelegram(),
      ]);
      if (!mounted) return;
      setState(() {
        _preferencias = res[0] as List<PreferenciaNotificacionDto>;
        _movil = res[1] as EstadoMovilDto;
        _telegram = res[2] as EstadoTelegramDto;
      });
    } catch (_) {
      if (mounted) {
        setState(() => _error = 'No se pudieron cargar tus preferencias.');
      }
    } finally {
      if (mounted) setState(() => _cargando = false);
    }
  }

  bool _canalVisible(String canal) {
    if (canal == 'movil') return _movil?.disponible ?? false;
    if (canal == 'telegram') return _telegram?.disponible ?? false;
    return true;
  }

  bool _canalBloqueado(String canal) {
    if (canal == 'movil') return (_movil?.dispositivos ?? 0) == 0;
    if (canal == 'telegram') return !(_telegram?.vinculado ?? false);
    return false;
  }

  Future<void> _alternar(PreferenciaNotificacionDto pref, bool activo) async {
    final previas = _preferencias;
    final actualizada = pref.copyWith(activo: activo, personalizado: true);
    setState(() {
      _guardando = true;
      _preferencias = _preferencias
          .map(
            (p) => (p.evento == pref.evento && p.canal == pref.canal)
                ? actualizada
                : p,
          )
          .toList(growable: false);
    });
    try {
      final nuevas = await widget.notificacionesApi.actualizarPreferencias(
        <PreferenciaNotificacionDto>[actualizada],
      );
      if (mounted) setState(() => _preferencias = nuevas);
      widget.onPreferenciasActualizadas?.call();
    } catch (_) {
      if (mounted) {
        setState(() => _preferencias = previas);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('No se pudo guardar el cambio de notificación.'),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _guardando = false);
    }
  }

  Future<void> _activarSoloMovil() async {
    setState(() => _guardando = true);
    try {
      final lote = construirPreferenciasSoloMovil(_preferencias);
      final ok = await ejecutarConAviso(
        context,
        () async {
          final nuevas = await widget.notificacionesApi.actualizarPreferencias(
            lote,
          );
          if (mounted) setState(() => _preferencias = nuevas);
          widget.onPreferenciasActualizadas?.call();
        },
        error: 'No se pudieron actualizar las preferencias.',
        exito: 'Avisos configurados solo por móvil',
      );
      if (!ok && mounted) await _cargar();
    } finally {
      if (mounted) setState(() => _guardando = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final textTheme = Theme.of(context).textTheme;
    final visibles = _preferencias
        .where((p) => _canalVisible(p.canal))
        .toList(growable: false);
    final movil = _movil;
    final mostrarBotonSoloMovil =
        movil != null &&
        movil.disponible &&
        movil.dispositivos > 0 &&
        debeOfrecerSoloMovil(_preferencias);

    final bloques = <Widget>[
      for (final entrada in etiquetasEventoNotificacion.entries)
        if (visibles.any((p) => p.evento == entrada.key))
          _BloqueEvento(
            descripcion: entrada.value,
            preferencias: visibles
                .where((p) => p.evento == entrada.key)
                .toList(growable: false),
            guardando: _guardando,
            estaBloqueado: _canalBloqueado,
            onAlternar: _alternar,
          ),
    ];

    return Scaffold(
      appBar: AppBar(title: const Text('Notificaciones')),
      body: _cargando && _preferencias.isEmpty
          ? const EstadoCargando()
          : _error != null && _preferencias.isEmpty
          ? EstadoError(mensaje: _error!, onReintentar: _cargar)
          : RefreshIndicator(
              onRefresh: _cargar,
              child: ListView(
                padding: const EdgeInsets.only(top: 8, bottom: 48),
                children: <Widget>[
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
                    child: Text(
                      'Nunca te avisamos de lo que haces tú.',
                      style: textTheme.bodySmall?.copyWith(
                        color: colores.tintaTenue,
                      ),
                    ),
                  ),
                  if (movil != null && movil.disponible) ...<Widget>[
                    TarjetaSeccion(
                      mostrarDivisores: false,
                      paddingInterno: const EdgeInsets.all(16),
                      children: <Widget>[
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: <Widget>[
                            IconoCaja(
                              icono: LucideIcons.smartphone,
                              color: movil.dispositivos > 0
                                  ? colores.indigoMarca
                                  : colores.tintaTenue,
                              fondo: movil.dispositivos > 0
                                  ? colores.indigoSuave
                                  : colores.elevada,
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                movil.dispositivos > 0
                                    ? 'Notificaciones push activas en ${movil.dispositivos} ${movil.dispositivos == 1 ? 'dispositivo' : 'dispositivos'}.'
                                    : 'Aún no hay dispositivos registrados para recibir notificaciones push.',
                                style: textTheme.bodyMedium?.copyWith(
                                  color: colores.tintaSuave,
                                ),
                              ),
                            ),
                          ],
                        ),
                        if (mostrarBotonSoloMovil) ...<Widget>[
                          const SizedBox(height: 14),
                          SizedBox(
                            width: double.infinity,
                            child: OutlinedButton(
                              onPressed: _guardando ? null : _activarSoloMovil,
                              child: const Text(
                                'Recibir solo por móvil (desactivar correo)',
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 20),
                  ],
                  if (bloques.isNotEmpty)
                    TarjetaSeccion(
                      titulo: 'Canales por evento',
                      divisorIndent: 16,
                      children: bloques,
                    ),
                ],
              ),
            ),
    );
  }
}

class _BloqueEvento extends StatelessWidget {
  const _BloqueEvento({
    required this.descripcion,
    required this.preferencias,
    required this.guardando,
    required this.estaBloqueado,
    required this.onAlternar,
  });

  final String descripcion;
  final List<PreferenciaNotificacionDto> preferencias;
  final bool guardando;
  final bool Function(String canal) estaBloqueado;
  final void Function(PreferenciaNotificacionDto pref, bool activo) onAlternar;

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final textTheme = Theme.of(context).textTheme;
    final heredaOrg = preferencias.any((p) => p.personalizado == false);

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text(
            descripcion,
            style: textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w500),
          ),
          if (heredaOrg) ...<Widget>[
            const SizedBox(height: 2),
            Text(
              'Sin elegir: en cada organización vale lo que ella decida.',
              style: textTheme.bodySmall?.copyWith(color: colores.tintaTenue),
            ),
          ],
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: <Widget>[
              for (final p in preferencias)
                FilterChip(
                  label: Text(etiquetasCanalNotificacion[p.canal] ?? p.canal),
                  selected: p.activo,
                  onSelected: (guardando || estaBloqueado(p.canal))
                      ? null
                      : (sel) => onAlternar(p, sel),
                ),
            ],
          ),
        ],
      ),
    );
  }
}
