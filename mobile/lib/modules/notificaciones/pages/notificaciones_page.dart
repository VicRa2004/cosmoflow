import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../../core/auth/sesion_store.dart';
import '../../../core/widgets/avisos.dart';
import '../../../core/widgets/estados.dart';
import '../../../core/widgets/tarjeta_seccion.dart';
import '../api/notificaciones_api.dart';
import '../models/bandeja_notificacion_models.dart';
import '../widgets/notificacion_fila.dart';

/// `/notificaciones`: bandeja de notificaciones dentro de la app (campana).
class NotificacionesPage extends StatefulWidget {
  const NotificacionesPage({
    super.key,
    required this.sesionStore,
    required this.notificacionesApi,
    this.cargarAlIniciar = true,
  });

  final SesionStore sesionStore;
  final NotificacionesApi notificacionesApi;
  final bool cargarAlIniciar;

  @override
  State<NotificacionesPage> createState() => _NotificacionesPageState();
}

class _NotificacionesPageState extends State<NotificacionesPage> {
  List<NotificacionAppDto> _datos = const <NotificacionAppDto>[];
  int _pagina = 1;
  int _totalPaginas = 1;
  int _noLeidas = 0;
  bool _soloNoLeidas = false;
  bool _cargando = false;
  bool _cargandoMas = false;
  bool _marcandoTodas = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    if (widget.cargarAlIniciar) _cargar();
  }

  Future<void> _cargar({int pagina = 1, bool anexar = false}) async {
    setState(() {
      if (anexar) {
        _cargandoMas = true;
      } else {
        _cargando = _datos.isEmpty;
        _error = null;
      }
    });
    try {
      final bandeja = await widget.notificacionesApi.obtenerBandeja(
        pagina: pagina,
        limite: 20,
        soloNoLeidas: _soloNoLeidas,
      );
      if (!mounted) return;
      setState(() {
        _datos = anexar
            ? <NotificacionAppDto>[..._datos, ...bandeja.datos]
            : bandeja.datos;
        _pagina = bandeja.pagina;
        _totalPaginas = bandeja.totalPaginas;
        _noLeidas = bandeja.noLeidas;
      });
    } catch (_) {
      if (mounted && !anexar) {
        setState(() => _error = 'No se pudieron cargar las notificaciones.');
      }
    } finally {
      if (mounted) {
        setState(() {
          _cargando = false;
          _cargandoMas = false;
        });
      }
    }
  }

  Future<void> _abrir(NotificacionAppDto notificacion) async {
    if (!notificacion.leida) {
      HapticFeedback.selectionClick();
      setState(() {
        _noLeidas = _noLeidas > 0 ? _noLeidas - 1 : 0;
        if (_soloNoLeidas) {
          _datos = _datos.where((n) => n.id != notificacion.id).toList();
        } else {
          _datos = _datos
              .map((n) => n.id == notificacion.id ? n.copyWith(leida: true) : n)
              .toList(growable: false);
        }
      });
      unawaited(
        widget.notificacionesApi.marcarLeida(notificacion.id).catchError((_) {
          if (mounted) _cargar();
        }),
      );
    }

    final destino = notificacion.rutaDestino();
    if (destino != null && mounted) {
      await context.push(destino);
    }
  }

  Future<void> _marcarTodas() async {
    if (_marcandoTodas || _noLeidas == 0) return;
    HapticFeedback.selectionClick();
    setState(() => _marcandoTodas = true);
    try {
      final ok = await ejecutarConAviso(
        context,
        () => widget.notificacionesApi.marcarTodasLeidas(),
        error: 'No se pudieron marcar como leídas.',
      );
      if (ok && mounted) {
        setState(() {
          _noLeidas = 0;
          _datos = _soloNoLeidas
              ? const <NotificacionAppDto>[]
              : _datos
                    .map((n) => n.copyWith(leida: true))
                    .toList(growable: false);
        });
      }
    } finally {
      if (mounted) setState(() => _marcandoTodas = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final yoId = widget.sesionStore.usuario?.id;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notificaciones'),
        actions: <Widget>[
          if (_noLeidas > 0)
            IconButton(
              tooltip: 'Marcar todas como leídas',
              onPressed: _marcandoTodas ? null : _marcarTodas,
              icon: const Icon(LucideIcons.checkCheck),
            ),
          IconButton(
            tooltip: 'Preferencias de notificación',
            onPressed: () => context.push('/perfil/notificaciones'),
            icon: const Icon(LucideIcons.slidersHorizontal),
          ),
        ],
      ),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () => _cargar(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: <Widget>[
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
                child: Row(
                  spacing: 8,
                  children: <Widget>[
                    ChoiceChip(
                      label: const Text('Todas'),
                      selected: !_soloNoLeidas,
                      onSelected: (sel) {
                        if (!sel || !_soloNoLeidas) return;
                        setState(() => _soloNoLeidas = false);
                        _cargar();
                      },
                    ),
                    ChoiceChip(
                      label: Text(
                        _noLeidas > 0 ? 'Sin leer ($_noLeidas)' : 'Sin leer',
                      ),
                      selected: _soloNoLeidas,
                      onSelected: (sel) {
                        if (!sel || _soloNoLeidas) return;
                        setState(() => _soloNoLeidas = true);
                        _cargar();
                      },
                    ),
                  ],
                ),
              ),
              Expanded(child: _lista(yoId)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _lista(int? yoId) {
    if (_cargando) return const EstadoCargando();
    if (_error != null) {
      return EstadoError(mensaje: _error!, onReintentar: _cargar);
    }
    if (_datos.isEmpty) {
      return ListView(
        children: <Widget>[
          const SizedBox(height: 32),
          EstadoVacio(
            icono: _soloNoLeidas ? LucideIcons.checkCheck : LucideIcons.bellOff,
            titulo: _soloNoLeidas ? 'Todo al día' : 'Sin notificaciones',
            mensaje: _soloNoLeidas
                ? 'No tienes notificaciones pendientes por leer.'
                : 'No tienes notificaciones todavía.',
          ),
        ],
      );
    }

    final tieneMas = _pagina < _totalPaginas;
    return ListView(
      padding: const EdgeInsets.only(top: 4, bottom: 32),
      children: <Widget>[
        TarjetaSeccion(
          divisorIndent: 62,
          children: <Widget>[
            for (final item in _datos)
              NotificacionFila(
                notificacion: item,
                yoId: yoId,
                onTap: () => _abrir(item),
              ),
          ],
        ),
        if (tieneMas)
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
            child: OutlinedButton(
              onPressed: _cargandoMas
                  ? null
                  : () => _cargar(pagina: _pagina + 1, anexar: true),
              child: Text(_cargandoMas ? 'Cargando…' : 'Cargar más'),
            ),
          ),
      ],
    );
  }
}
