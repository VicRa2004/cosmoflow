import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../../core/theme/colores_noche_indigo.dart';
import '../../../core/theme/tema_app.dart';
import '../../../core/widgets/avisos.dart';
import '../../../core/widgets/confirmar.dart';
import '../../../core/widgets/estados.dart';
import '../../../core/widgets/tarjeta_seccion.dart';
import '../api/perfil_api.dart';
import '../models/perfil_models.dart';

/// `/perfil/calendario`: gestionar la suscripción iCalendar (.ics) de pendientes.
class CalendarioSuscripcionPage extends StatefulWidget {
  const CalendarioSuscripcionPage({
    super.key,
    required this.perfilApi,
    this.cargarAlIniciar = true,
  });

  final PerfilApi perfilApi;
  final bool cargarAlIniciar;

  @override
  State<CalendarioSuscripcionPage> createState() =>
      _CalendarioSuscripcionPageState();
}

class _CalendarioSuscripcionPageState extends State<CalendarioSuscripcionPage> {
  SuscripcionCalendarioDto? _estado;
  String? _urlGenerada;
  bool _cargando = false;
  bool _ocupado = false;
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
      final estado = await widget.perfilApi.estadoCalendario();
      if (mounted) setState(() => _estado = estado);
    } catch (_) {
      if (mounted) {
        setState(
          () => _error = 'No se pudo consultar tu suscripción de calendario.',
        );
      }
    } finally {
      if (mounted) setState(() => _cargando = false);
    }
  }

  Future<void> _generar() async {
    if (_estado?.activa == true) {
      final ok = await confirmar(
        context,
        titulo: '¿Regenerar URL?',
        mensaje: 'La URL anterior dejará de funcionar y tendrás que actualizarla en tu app de calendario.',
        accion: 'Regenerar',
      );
      if (!ok || !mounted) return;
    }
    setState(() => _ocupado = true);
    try {
      final ok = await ejecutarConAviso(
        context,
        () async {
          final url = await widget.perfilApi.generarCalendario();
          if (mounted) setState(() => _urlGenerada = url);
        },
        error: 'No se pudo generar la URL de calendario.',
        exito: 'URL de calendario generada.',
      );
      if (ok) await _cargar();
    } finally {
      if (mounted) setState(() => _ocupado = false);
    }
  }

  Future<void> _desactivar() async {
    final ok = await confirmar(
      context,
      titulo: '¿Desactivar suscripción?',
      mensaje: 'Tu app de calendario dejará de recibir actualizaciones.',
      accion: 'Desactivar',
    );
    if (!ok || !mounted) return;
    setState(() => _ocupado = true);
    try {
      final hecho = await ejecutarConAviso(
        context,
        widget.perfilApi.desactivarCalendario,
        error: 'No se pudo desactivar la suscripción.',
        exito: 'Suscripción desactivada.',
      );
      if (hecho && mounted) {
        setState(() => _urlGenerada = null);
        await _cargar();
      }
    } finally {
      if (mounted) setState(() => _ocupado = false);
    }
  }

  Future<void> _copiarUrl(String url) async {
    await Clipboard.setData(ClipboardData(text: url));
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('URL copiada al portapapeles.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final textTheme = Theme.of(context).textTheme;
    final activa = _estado?.activa == true;

    return Scaffold(
      appBar: AppBar(title: const Text('Calendario iCalendar')),
      body: _cargando && _estado == null
          ? const EstadoCargando()
          : _error != null && _estado == null
          ? EstadoError(mensaje: _error!, onReintentar: _cargar)
          : ListView(
              padding: const EdgeInsets.only(top: 8, bottom: 40),
              children: <Widget>[
                TarjetaSeccion(
                  mostrarDivisores: false,
                  paddingInterno: const EdgeInsets.all(16),
                  children: <Widget>[
                    Row(
                      children: <Widget>[
                        IconoCaja(
                          icono: LucideIcons.calendarSync,
                          color: activa
                              ? colores.emeraldExito
                              : colores.indigoMarca,
                          fondo: activa
                              ? colores.emeraldSuave
                              : colores.indigoSuave,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: <Widget>[
                              Text(
                                activa
                                    ? 'Suscripción activa'
                                    : 'Suscripción inactiva',
                                style: textTheme.titleMedium,
                              ),
                              const SizedBox(height: 2),
                              Text(
                                'Sincroniza tus tareas pendientes con Google Calendar, Apple Calendar u Outlook mediante una URL privada .ics.',
                                style: textTheme.bodySmall,
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    if (_urlGenerada != null &&
                        _urlGenerada!.isNotEmpty) ...<Widget>[
                      const SizedBox(height: 16),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: colores.elevada,
                          borderRadius: BorderRadius.circular(
                            TemaApp.radioControl,
                          ),
                        ),
                        child: Row(
                          children: <Widget>[
                            Expanded(
                              child: SelectableText(
                                _urlGenerada!,
                                style: textTheme.bodySmall?.copyWith(
                                  color: colores.tinta,
                                ),
                              ),
                            ),
                            IconButton(
                              tooltip: 'Copiar URL',
                              onPressed: () => _copiarUrl(_urlGenerada!),
                              icon: const Icon(LucideIcons.copy, size: 18),
                            ),
                          ],
                        ),
                      ),
                    ],
                    const SizedBox(height: 16),
                    FilledButton.icon(
                      onPressed: _ocupado ? null : _generar,
                      icon: const Icon(LucideIcons.link, size: 16),
                      label: Text(
                        activa
                            ? 'Regenerar URL privada'
                            : 'Generar URL privada',
                      ),
                    ),
                    if (activa) ...<Widget>[
                      const SizedBox(height: 10),
                      OutlinedButton(
                        onPressed: _ocupado ? null : _desactivar,
                        style: OutlinedButton.styleFrom(
                          foregroundColor: colores.rosePeligro,
                          side: BorderSide(
                            color: colores.rosePeligro.withValues(alpha: 0.4),
                          ),
                        ),
                        child: const Text('Desactivar suscripción'),
                      ),
                    ],
                  ],
                ),
              ],
            ),
    );
  }
}
