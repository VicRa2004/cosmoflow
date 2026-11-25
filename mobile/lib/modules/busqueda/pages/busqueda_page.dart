import 'dart:async';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/colores_noche_indigo.dart';
import '../../../core/widgets/estados.dart';
import '../api/busqueda_api.dart';
import '../models/busqueda_models.dart';

/// `/buscar`: búsqueda global en tareas, notas, proyectos y equipos (`GET /api/busqueda`).
class BusquedaPage extends StatefulWidget {
  const BusquedaPage({
    super.key,
    required this.busquedaApi,
    this.debounce = const Duration(milliseconds: 250),
  });

  final BusquedaApi busquedaApi;
  final Duration debounce;

  @override
  State<BusquedaPage> createState() => _BusquedaPageState();
}

class _BusquedaPageState extends State<BusquedaPage> {
  final TextEditingController _controlador = TextEditingController();
  Timer? _temporizador;
  int _peticionActual = 0;
  bool _cargando = false;
  String? _error;
  ResultadosBusquedaDto? _resultados;

  @override
  void dispose() {
    _temporizador?.cancel();
    _controlador.dispose();
    super.dispose();
  }

  void _alCambiarTexto(String valor) {
    _temporizador?.cancel();
    final limpio = valor.trim();
    if (limpio.length < 2) {
      _peticionActual++;
      setState(() {
        _cargando = false;
        _error = null;
        _resultados = null;
      });
      return;
    }
    setState(() {
      _cargando = true;
      _error = null;
    });
    _temporizador = Timer(widget.debounce, () => _ejecutarBusqueda(limpio));
  }

  Future<void> _ejecutarBusqueda(String consulta) async {
    final id = ++_peticionActual;
    setState(() {
      _cargando = true;
      _error = null;
    });
    try {
      final datos = await widget.busquedaApi.buscar(consulta);
      if (!mounted || id != _peticionActual) return;
      setState(() {
        _resultados = datos;
        _cargando = false;
      });
    } catch (_) {
      if (!mounted || id != _peticionActual) return;
      setState(() {
        _error = 'No se pudo completar la búsqueda.';
        _cargando = false;
      });
    }
  }

  void _limpiar() {
    _controlador.clear();
    _alCambiarTexto('');
  }

  @override
  Widget build(BuildContext context) {
    final texto = _controlador.text;
    final limpio = texto.trim();

    return Scaffold(
      appBar: AppBar(
        titleSpacing: 0,
        title: TextField(
          controller: _controlador,
          autofocus: true,
          maxLength: 100,
          textInputAction: TextInputAction.search,
          decoration: const InputDecoration(
            hintText: 'Buscar tareas, notas, proyectos, equipos…',
            border: InputBorder.none,
            enabledBorder: InputBorder.none,
            focusedBorder: InputBorder.none,
            filled: false,
            counterText: '',
          ),
          onChanged: _alCambiarTexto,
          onSubmitted: (v) {
            final q = v.trim();
            if (q.length >= 2) {
              _temporizador?.cancel();
              _ejecutarBusqueda(q);
            }
          },
        ),
        actions: <Widget>[
          if (texto.isNotEmpty)
            IconButton(
              tooltip: 'Limpiar búsqueda',
              icon: const Icon(Icons.close_rounded),
              onPressed: _limpiar,
            ),
        ],
      ),
      body: SafeArea(child: _cuerpo(limpio)),
    );
  }

  Widget _cuerpo(String consulta) {
    if (consulta.length < 2) {
      return const EstadoVacio(
        icono: Icons.search_rounded,
        titulo: 'Búsqueda global',
        mensaje: 'Escribe al menos 2 caracteres para buscar en tareas, notas, proyectos y equipos.',
      );
    }
    if (_cargando && _resultados == null) {
      return const EstadoCargando();
    }
    if (_error != null) {
      return EstadoError(
        mensaje: _error!,
        onReintentar: () => _ejecutarBusqueda(consulta),
      );
    }
    final res = _resultados;
    if (res == null || res.isEmpty) {
      return EstadoVacio(
        icono: Icons.search_off_rounded,
        titulo: 'Sin resultados',
        mensaje: 'No encontramos coincidencias para «$consulta».',
      );
    }

    final bloques = <Widget>[
      if (_cargando) const LinearProgressIndicator(minHeight: 2),
      if (res.tareas.isNotEmpty) ...<Widget>[
        _CabeceraSeccion(titulo: 'Tareas', cantidad: res.tareas.length),
        for (final t in res.tareas) ...<Widget>[
          ListTile(
            leading: const Icon(Icons.task_alt_rounded),
            title: Text(t.titulo, maxLines: 2, overflow: TextOverflow.ellipsis),
            trailing: const Icon(Icons.chevron_right_rounded),
            onTap: () => context.push('/tareas/${t.id}'),
          ),
          const Divider(height: 1, indent: 56),
        ],
      ],
      if (res.notas.isNotEmpty) ...<Widget>[
        _CabeceraSeccion(titulo: 'Notas', cantidad: res.notas.length),
        for (final n in res.notas) ...<Widget>[
          ListTile(
            leading: const Icon(Icons.description_outlined),
            title: Text(n.titulo, maxLines: 2, overflow: TextOverflow.ellipsis),
            trailing: const Icon(Icons.chevron_right_rounded),
            onTap: () => context.push('/notas/${n.id}'),
          ),
          const Divider(height: 1, indent: 56),
        ],
      ],
      if (res.proyectos.isNotEmpty) ...<Widget>[
        _CabeceraSeccion(titulo: 'Proyectos', cantidad: res.proyectos.length),
        for (final p in res.proyectos) ...<Widget>[
          ListTile(
            leading: const Icon(Icons.folder_outlined),
            title: Text(p.nombre, maxLines: 2, overflow: TextOverflow.ellipsis),
            trailing: const Icon(Icons.chevron_right_rounded),
            onTap: () => context.push(
              '/organizaciones/${p.organizacionId}/proyectos/${p.id}',
            ),
          ),
          const Divider(height: 1, indent: 56),
        ],
      ],
      if (res.equipos.isNotEmpty) ...<Widget>[
        _CabeceraSeccion(titulo: 'Equipos', cantidad: res.equipos.length),
        for (final e in res.equipos) ...<Widget>[
          ListTile(
            leading: const Icon(Icons.groups_outlined),
            title: Text(e.nombre, maxLines: 2, overflow: TextOverflow.ellipsis),
            trailing: const Icon(Icons.chevron_right_rounded),
            onTap: () => context.push(
              '/organizaciones/${e.organizacionId}/equipos/${e.id}',
            ),
          ),
          const Divider(height: 1, indent: 56),
        ],
      ],
    ];

    return ListView(
      padding: const EdgeInsets.only(bottom: 32),
      children: bloques,
    );
  }
}

class _CabeceraSeccion extends StatelessWidget {
  const _CabeceraSeccion({required this.titulo, required this.cantidad});

  final String titulo;
  final int cantidad;

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 4),
      child: Text(
        '$titulo ($cantidad)',
        style: Theme.of(context).textTheme.labelLarge
            ?.copyWith(color: colores.tintaTenue),
      ),
    );
  }
}
