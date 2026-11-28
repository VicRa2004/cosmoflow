import 'dart:async';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../../core/theme/colores_noche_indigo.dart';
import '../../../core/theme/tema_app.dart';
import '../../../core/widgets/estados.dart';
import '../../../core/widgets/tarjeta_seccion.dart';
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
          style: Theme.of(context).textTheme.bodyLarge,
          decoration: const InputDecoration(
            hintText: 'Buscar tareas, notas, proyectos, equipos…',
            border: InputBorder.none,
            enabledBorder: InputBorder.none,
            focusedBorder: InputBorder.none,
            filled: false,
            counterText: '',
            contentPadding: EdgeInsets.symmetric(vertical: 12),
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
              icon: const Icon(LucideIcons.x),
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
        icono: LucideIcons.search,
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
        icono: LucideIcons.searchX,
        titulo: 'Sin resultados',
        mensaje: 'No encontramos coincidencias para «$consulta».',
      );
    }

    final colores = context.colores;
    final secciones = <Widget>[
      if (_cargando)
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(TemaApp.radioCompleto),
            child: const LinearProgressIndicator(minHeight: 3),
          ),
        ),
      if (res.tareas.isNotEmpty)
        TarjetaSeccion(
          titulo: 'Tareas',
          contador: res.tareas.length,
          divisorIndent: 62,
          children: <Widget>[
            for (final t in res.tareas)
              _FilaResultado(
                icono: LucideIcons.squareCheck,
                colorIcono: colores.indigoMarca,
                fondoIcono: colores.indigoSuave,
                titulo: t.titulo,
                onTap: () => context.push('/tareas/${t.id}'),
              ),
          ],
        ),
      if (res.notas.isNotEmpty)
        TarjetaSeccion(
          titulo: 'Notas',
          contador: res.notas.length,
          divisorIndent: 62,
          children: <Widget>[
            for (final n in res.notas)
              _FilaResultado(
                icono: LucideIcons.fileText,
                titulo: n.titulo,
                onTap: () => context.push('/notas/${n.id}'),
              ),
          ],
        ),
      if (res.proyectos.isNotEmpty)
        TarjetaSeccion(
          titulo: 'Proyectos',
          contador: res.proyectos.length,
          divisorIndent: 62,
          children: <Widget>[
            for (final p in res.proyectos)
              _FilaResultado(
                icono: LucideIcons.folderKanban,
                titulo: p.nombre,
                onTap: () => context.push(
                  '/organizaciones/${p.organizacionId}/proyectos/${p.id}',
                ),
              ),
          ],
        ),
      if (res.equipos.isNotEmpty)
        TarjetaSeccion(
          titulo: 'Equipos',
          contador: res.equipos.length,
          divisorIndent: 62,
          children: <Widget>[
            for (final e in res.equipos)
              _FilaResultado(
                icono: LucideIcons.users,
                titulo: e.nombre,
                onTap: () => context.push(
                  '/organizaciones/${e.organizacionId}/equipos/${e.id}',
                ),
              ),
          ],
        ),
    ];

    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(0, 8, 0, 32),
      itemCount: secciones.length,
      separatorBuilder: (_, _) =>
          const SizedBox(height: TemaApp.espacioSeccion),
      itemBuilder: (_, index) => secciones[index],
    );
  }
}

class _FilaResultado extends StatelessWidget {
  const _FilaResultado({
    required this.icono,
    required this.titulo,
    required this.onTap,
    this.colorIcono,
    this.fondoIcono,
  });

  final IconData icono;
  final String titulo;
  final VoidCallback onTap;
  final Color? colorIcono;
  final Color? fondoIcono;

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    return ListTile(
      leading: IconoCaja(
        icono: icono,
        color: colorIcono,
        fondo: fondoIcono,
        dimension: 34,
        tamanoIcono: 17,
      ),
      title: Text(titulo, maxLines: 2, overflow: TextOverflow.ellipsis),
      trailing: Icon(
        LucideIcons.chevronRight,
        size: 18,
        color: colores.tintaTenue,
      ),
      onTap: onTap,
    );
  }
}
