import 'dart:async';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../../core/auth/sesion_store.dart';
import '../../../core/offline/aviso_pendientes.dart';
import '../../../core/theme/colores_noche_indigo.dart';
import '../../../core/widgets/avisos.dart';
import '../../../core/widgets/confirmar.dart';
import '../../../core/widgets/estados.dart';
import '../../../core/widgets/tarjeta_seccion.dart';
import '../../tags/api/tags_api.dart';
import '../../tags/models/tag_model.dart';
import '../api/notas_api.dart';
import '../models/carpeta_model.dart';
import '../models/nota_model.dart';
import '../widgets/carpeta_fila.dart';
import '../widgets/carpeta_form_sheet.dart';
import '../widgets/mover_a_carpeta_sheet.dart';
import '../widgets/nota_fila.dart';
import 'nota_editor_page.dart';

/// Vista `/notas` estilo árbol desplegable de Obsidian iOS: al pulsar una carpeta
/// se expanden sus subcarpetas y notas justo debajo con sangría limpia, búsqueda
/// en tiempo real y ordenación sincronizada.
class NotasPage extends StatefulWidget {
  const NotasPage({
    super.key,
    required this.sesionStore,
    required this.notasApi,
    required this.tagsApi,
    this.proyectoId,
    this.organizacionId,
    this.mostrarAppBar = true,
    this.cargarAlIniciar = true,
  });

  final SesionStore sesionStore;
  final NotasApi notasApi;
  final TagsApi tagsApi;
  final int? proyectoId;
  final int? organizacionId;
  final bool mostrarAppBar;
  final bool cargarAlIniciar;

  @override
  State<NotasPage> createState() => _NotasPageState();
}

class _NotasPageState extends State<NotasPage> {
  final _busqueda = TextEditingController();
  final _focoBusqueda = FocusNode();
  List<NotaDto> _notas = const <NotaDto>[];
  List<TagDto> _tags = const <TagDto>[];
  List<CarpetaDto> _carpetas = const <CarpetaDto>[];
  final Set<int> _expandidas = <int>{};
  int? _tagId;
  bool _mostrarBuscador = false;
  OrdenNotas _orden = OrdenNotas.creada;
  bool _isCargando = false;
  String? _mensajeError;

  bool get _enModoFiltro => _busqueda.text.trim().isNotEmpty || _tagId != null;

  List<NotaDto> get _notasFiltradas {
    final q = _busqueda.text.trim().toLowerCase();
    return _notas
        .where((n) {
          if (_tagId != null && !n.tagIds.contains(_tagId)) return false;
          if (q.isEmpty) return true;
          return n.titulo.toLowerCase().contains(q) ||
              n.contenido.toLowerCase().contains(q);
        })
        .toList(growable: false);
  }

  @override
  void initState() {
    super.initState();
    if (widget.cargarAlIniciar) {
      unawaited(_cargarOrden());
      _cargar();
    }
  }

  @override
  void dispose() {
    _busqueda.dispose();
    _focoBusqueda.dispose();
    super.dispose();
  }

  Future<void> _cargarOrden() async {
    final orden = await widget.notasApi.obtenerOrdenNotas();
    if (mounted && orden != _orden) {
      setState(() => _orden = orden);
    }
  }

  void _cambiarOrden(OrdenNotas nuevo) {
    setState(() => _orden = nuevo);
    unawaited(widget.notasApi.guardarOrdenNotas(nuevo));
  }

  Future<void> _cargar() async {
    setState(() {
      _isCargando = _notas.isEmpty && _carpetas.isEmpty;
      _mensajeError = null;
    });
    try {
      final r = await Future.wait<dynamic>(<Future<dynamic>>[
        widget.notasApi.obtenerTodos(proyectoId: widget.proyectoId),
        widget.tagsApi.obtenerTodos(organizacionId: widget.organizacionId),
        widget.notasApi.obtenerCarpetas(proyectoId: widget.proyectoId),
      ]);
      if (mounted) {
        setState(() {
          _notas = (r[0] as PaginaNotas).datos;
          _tags = (r[1] as PaginaTags).datos;
          _carpetas = r[2] as List<CarpetaDto>;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() => _mensajeError = 'No se pudieron cargar las notas.');
      }
    } finally {
      if (mounted) setState(() => _isCargando = false);
    }
  }

  void _alternarCarpeta(int carpetaId) {
    setState(() {
      if (!_expandidas.remove(carpetaId)) {
        _expandidas.add(carpetaId);
      }
    });
  }

  Future<void> _abrirEditor(String ruta, {int? carpetaInicial}) async {
    final guardada = await context.push<bool>(
      ruta,
      extra: NotaEditorArgs(
        tags: _tags,
        carpetas: _carpetas,
        carpetaInicial: carpetaInicial,
        proyectoId: widget.proyectoId,
      ),
    );
    if (guardada ?? false) {
      if (carpetaInicial != null) _expandidas.add(carpetaInicial);
      await _cargar();
    }
  }

  Future<void> _abrirDetalle(NotaDto nota) async {
    final puedeEditar = widget.sesionStore.puede('notas:actualizar');
    final ruta = puedeEditar ? '/notas/${nota.id}/editar' : '/notas/${nota.id}';
    await context.push<dynamic>(
      ruta,
      extra: NotaEditorArgs(
        nota: nota,
        tags: _tags,
        carpetas: _carpetas,
        proyectoId: widget.proyectoId,
      ),
    );
    if (mounted) await _cargar();
  }

  Future<void> _crearCarpeta({int? padreId}) async {
    final datos = await mostrarCarpetaFormSheet(context);
    if (datos == null || !mounted) return;
    final ok = await ejecutarConAviso(
      context,
      () => widget.notasApi.crearCarpeta(
        nombre: datos.nombre,
        color: datos.color,
        padreId: padreId,
        proyectoId: widget.proyectoId,
      ),
      error: 'No se pudo crear la carpeta.',
      exito: 'Carpeta creada.',
    );
    if (ok) {
      if (padreId != null) _expandidas.add(padreId);
      await _cargar();
    }
  }

  Future<void> _manejarAccionCarpeta(
    CarpetaDto carpeta,
    AccionCarpeta accion,
  ) async {
    switch (accion) {
      case AccionCarpeta.nuevaNota:
        await _abrirEditor('/notas/nueva', carpetaInicial: carpeta.id);
      case AccionCarpeta.nuevaSubcarpeta:
        await _crearCarpeta(padreId: carpeta.id);
      case AccionCarpeta.editar:
        final datos = await mostrarCarpetaFormSheet(context, carpeta: carpeta);
        if (datos == null || !mounted) return;
        final ok = await ejecutarConAviso(
          context,
          () => widget.notasApi.actualizarCarpeta(
            carpeta.id,
            nombre: datos.nombre,
            color: datos.color,
            limpiarColor: datos.color == null,
          ),
          error: 'No se pudo actualizar la carpeta.',
          exito: 'Carpeta actualizada.',
        );
        if (ok) await _cargar();
      case AccionCarpeta.mover:
        final destino = await mostrarMoverACarpetaSheet(
          context,
          titulo: 'Mover «${carpeta.nombre}» a…',
          carpetas: _carpetas,
          carpetaActualId: carpeta.padreId,
          excluirIds: descendientesDeCarpeta(carpeta.id, _carpetas),
        );
        if (destino == null ||
            !mounted ||
            destino.carpetaId == carpeta.padreId) {
          return;
        }
        final ok = await ejecutarConAviso(
          context,
          () => widget.notasApi.actualizarCarpeta(
            carpeta.id,
            padreId: destino.carpetaId,
            actualizarPadre: true,
          ),
          error: 'No se pudo mover la carpeta.',
          exito: 'Carpeta movida.',
        );
        if (ok) await _cargar();
      case AccionCarpeta.eliminar:
        final okConfirm = await confirmar(
          context,
          titulo: '¿Eliminar carpeta?',
          mensaje:
              '«${carpeta.nombre}» se eliminará. Sus notas y subcarpetas subirán un nivel.',
          accion: 'Eliminar',
        );
        if (!okConfirm || !mounted) return;
        final ok = await ejecutarConAviso(
          context,
          () => widget.notasApi.eliminarCarpeta(carpeta.id),
          error: 'No se pudo eliminar la carpeta.',
          exito: 'Carpeta eliminada.',
        );
        if (ok) await _cargar();
    }
  }

  Future<void> _manejarAccionNota(NotaDto nota, AccionNota accion) async {
    switch (accion) {
      case AccionNota.fijar:
        final ok = await ejecutarConAviso(
          context,
          () => widget.notasApi.alternarFijada(nota),
          error: 'No se pudo actualizar la nota.',
          exito: nota.isFijada ? 'Nota desfijada.' : 'Nota fijada.',
        );
        if (ok) await _cargar();
      case AccionNota.mover:
        final destino = await mostrarMoverACarpetaSheet(
          context,
          titulo: 'Mover nota a…',
          carpetas: _carpetas,
          carpetaActualId: nota.carpetaId,
        );
        if (destino == null ||
            !mounted ||
            destino.carpetaId == nota.carpetaId) {
          return;
        }
        final ok = await ejecutarConAviso(
          context,
          () => widget.notasApi.moverNota(nota.id, destino.carpetaId),
          error: 'No se pudo mover la nota.',
          exito: 'Nota movida.',
        );
        if (ok) await _cargar();
      case AccionNota.duplicar:
        final ok = await ejecutarConAviso(
          context,
          () => widget.notasApi.duplicar(nota.id),
          error: 'No se pudo duplicar la nota.',
          exito: 'Nota duplicada.',
        );
        if (ok) await _cargar();
      case AccionNota.eliminar:
        final okConfirm = await confirmar(
          context,
          titulo: '¿Eliminar nota?',
          mensaje: '«${nota.titulo}» se enviará a la papelera.',
          accion: 'Eliminar',
        );
        if (!okConfirm || !mounted) return;
        final ok = await ejecutarConAviso(
          context,
          () => widget.notasApi.eliminar(nota.id),
          error: 'No se pudo eliminar la nota.',
          exito: 'Nota eliminada.',
        );
        if (ok) await _cargar();
    }
  }

  int _contarElementosCarpeta(int carpetaId) {
    final sub = _carpetas.where((c) => c.padreId == carpetaId).length;
    final nts = _notas.where((n) => n.carpetaId == carpetaId).length;
    return sub + nts;
  }

  Widget _botonCircular({
    required IconData icono,
    required String tooltip,
    required VoidCallback onTap,
    bool activo = false,
  }) {
    final colores = context.colores;
    return Padding(
      padding: const EdgeInsets.only(right: 6),
      child: Material(
        color: activo ? colores.indigoSuave : colores.superficie,
        shape: CircleBorder(
          side: BorderSide(
            color: activo
                ? colores.indigoMarca.withValues(alpha: 0.35)
                : colores.borde,
            width: 1,
          ),
        ),
        clipBehavior: Clip.antiAlias,
        child: IconButton(
          tooltip: tooltip,
          visualDensity: VisualDensity.compact,
          onPressed: onTap,
          icon: Icon(
            icono,
            size: 18,
            color: activo ? colores.indigoMarca : colores.tintaSuave,
          ),
        ),
      ),
    );
  }

  Widget _botonOrden() {
    final colores = context.colores;
    return Padding(
      padding: const EdgeInsets.only(right: 10),
      child: Material(
        color: colores.superficie,
        shape: CircleBorder(side: BorderSide(color: colores.borde, width: 1)),
        clipBehavior: Clip.antiAlias,
        child: PopupMenuButton<OrdenNotas>(
          tooltip: 'Ordenar',
          icon: Icon(
            LucideIcons.arrowUpDown,
            size: 18,
            color: colores.tintaSuave,
          ),
          onSelected: _cambiarOrden,
          itemBuilder: (_) => <PopupMenuEntry<OrdenNotas>>[
            for (final opcion in OrdenNotas.values)
              CheckedPopupMenuItem<OrdenNotas>(
                value: opcion,
                checked: _orden == opcion,
                child: Text(opcion.etiqueta),
              ),
          ],
        ),
      ),
    );
  }

  Widget _filtroTags() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
      child: Row(
        spacing: 8,
        children: <Widget>[
          ChoiceChip(
            label: const Text('Todos'),
            selected: _tagId == null,
            onSelected: (_) => setState(() => _tagId = null),
          ),
          for (final tag in _tags)
            ChoiceChip(
              label: Text('#${tag.nombre}'),
              selected: _tagId == tag.id,
              onSelected: (sel) => setState(() => _tagId = sel ? tag.id : null),
            ),
        ],
      ),
    );
  }

  /// Construye recursivamente el nodo de carpeta + su contenido expandible debajo.
  Widget _construirNodoCarpeta(CarpetaDto carpeta, int nivel) {
    final store = widget.sesionStore;
    final colores = context.colores;
    final expandida = _expandidas.contains(carpeta.id);
    final subcarpetas = ordenarCarpetas(
      _carpetas.where((c) => c.padreId == carpeta.id).toList(),
      _orden,
    );
    final notasDentro = ordenarNotas(
      _notas.where((n) => n.carpetaId == carpeta.id).toList(),
      _orden,
    );
    final sangriaDivisor = 16.0 + ((nivel + 1) * 20.0);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: <Widget>[
        CarpetaFila(
          carpeta: carpeta,
          expandida: expandida,
          nivelIndentacion: nivel,
          cantidadElementos: _contarElementosCarpeta(carpeta.id),
          onTap: () => _alternarCarpeta(carpeta.id),
          puedeCrear: store.puede('notas:crear'),
          puedeEditar: store.puede('notas:actualizar'),
          puedeEliminar: store.puede('notas:eliminar'),
          onAccion: (a) => _manejarAccionCarpeta(carpeta, a),
        ),
        AnimatedSize(
          duration: const Duration(milliseconds: 220),
          curve: Curves.easeOutCubic,
          alignment: Alignment.topCenter,
          child: expandida
              ? Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: <Widget>[
                    if (subcarpetas.isEmpty && notasDentro.isEmpty) ...<Widget>[
                      Divider(
                        height: 1,
                        indent: sangriaDivisor,
                        color: colores.borde,
                      ),
                      Padding(
                        padding: EdgeInsets.fromLTRB(
                          sangriaDivisor,
                          10,
                          16,
                          12,
                        ),
                        child: Text(
                          'Carpeta vacía',
                          style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(color: colores.tintaTenue),
                        ),
                      ),
                    ] else ...<Widget>[
                      for (final sub in subcarpetas) ...<Widget>[
                        Divider(
                          height: 1,
                          indent: sangriaDivisor,
                          color: colores.borde,
                        ),
                        _construirNodoCarpeta(sub, nivel + 1),
                      ],
                      for (final nota in notasDentro) ...<Widget>[
                        Divider(
                          height: 1,
                          indent: sangriaDivisor,
                          color: colores.borde,
                        ),
                        NotaFila(
                          nota: nota,
                          tags: _tags,
                          nivelIndentacion: nivel + 1,
                          onTap: () => _abrirDetalle(nota),
                          puedeEditar: store.puede('notas:actualizar'),
                          puedeCrear: store.puede('notas:crear'),
                          puedeEliminar: store.puede('notas:eliminar'),
                          onAccion: (a) => _manejarAccionNota(nota, a),
                        ),
                      ],
                    ],
                  ],
                )
              : const SizedBox.shrink(),
        ),
      ],
    );
  }

  List<Widget> _construirArbolObsidian() {
    final store = widget.sesionStore;
    final colores = context.colores;
    final carpetasRaiz = ordenarCarpetas(
      _carpetas.where((c) => c.padreId == null).toList(),
      _orden,
    );
    final notasRaiz = ordenarNotas(
      _notas.where((n) => n.carpetaId == null).toList(),
      _orden,
    );
    final fijadasRaiz = notasRaiz
        .where((n) => n.isFijada)
        .toList(growable: false);
    final normalesRaiz = notasRaiz
        .where((n) => !n.isFijada)
        .toList(growable: false);

    if (carpetasRaiz.isEmpty && notasRaiz.isEmpty) {
      return const <Widget>[
        EstadoVacio(
          icono: LucideIcons.fileText,
          titulo: 'Sin notas',
          mensaje: 'Crea una nota o carpeta para organizar tus apuntes.',
        ),
      ];
    }

    return <Widget>[
      if (fijadasRaiz.isNotEmpty) ...<Widget>[
        TarjetaSeccion(
          titulo: 'Fijadas',
          contador: fijadasRaiz.length,
          colorTitulo: colores.amberAviso,
          divisorIndent: 16,
          children: <Widget>[
            for (final nota in fijadasRaiz)
              NotaFila(
                nota: nota,
                tags: _tags,
                onTap: () => _abrirDetalle(nota),
                puedeEditar: store.puede('notas:actualizar'),
                puedeCrear: store.puede('notas:crear'),
                puedeEliminar: store.puede('notas:eliminar'),
                onAccion: (a) => _manejarAccionNota(nota, a),
              ),
          ],
        ),
        const SizedBox(height: 16),
      ],
      if (carpetasRaiz.isNotEmpty) ...<Widget>[
        TarjetaSeccion(
          divisorIndent: 16,
          children: <Widget>[
            for (final carpeta in carpetasRaiz)
              _construirNodoCarpeta(carpeta, 0),
          ],
        ),
        if (normalesRaiz.isNotEmpty) const SizedBox(height: 16),
      ],
      if (normalesRaiz.isNotEmpty)
        TarjetaSeccion(
          titulo: carpetasRaiz.isNotEmpty ? 'Sin carpeta' : null,
          contador: carpetasRaiz.isNotEmpty ? normalesRaiz.length : null,
          divisorIndent: 16,
          children: <Widget>[
            for (final nota in normalesRaiz)
              NotaFila(
                nota: nota,
                tags: _tags,
                onTap: () => _abrirDetalle(nota),
                puedeEditar: store.puede('notas:actualizar'),
                puedeCrear: store.puede('notas:crear'),
                puedeEliminar: store.puede('notas:eliminar'),
                onAccion: (a) => _manejarAccionNota(nota, a),
              ),
          ],
        ),
    ];
  }

  List<Widget> _construirResultadosAgrupados() {
    final ordenadas = ordenarNotas(_notasFiltradas, _orden);
    final grupos = <int?, List<NotaDto>>{};
    for (final nota in ordenadas) {
      grupos.putIfAbsent(nota.carpetaId, () => <NotaDto>[]).add(nota);
    }
    final claves = grupos.keys.toList()
      ..sort((a, b) {
        if (a == null) return -1;
        if (b == null) return 1;
        final na = rutaDeCarpeta(a, _carpetas).map((c) => c.nombre).join(' / ');
        final nb = rutaDeCarpeta(b, _carpetas).map((c) => c.nombre).join(' / ');
        return na.toLowerCase().compareTo(nb.toLowerCase());
      });

    final store = widget.sesionStore;
    return <Widget>[
      for (final cid in claves) ...<Widget>[
        TarjetaSeccion(
          titulo: cid == null
              ? 'Sin carpeta'
              : rutaDeCarpeta(cid, _carpetas).map((c) => c.nombre).join(' / '),
          contador: grupos[cid]!.length,
          divisorIndent: 16,
          children: <Widget>[
            for (final nota in grupos[cid]!)
              NotaFila(
                nota: nota,
                tags: _tags,
                onTap: () => _abrirDetalle(nota),
                puedeEditar: store.puede('notas:actualizar'),
                puedeCrear: store.puede('notas:crear'),
                puedeEliminar: store.puede('notas:eliminar'),
                onAccion: (a) => _manejarAccionNota(nota, a),
              ),
          ],
        ),
        const SizedBox(height: 16),
      ],
    ];
  }

  String _resumenSubtitulo() {
    final partes = <String>[
      if (_carpetas.isNotEmpty)
        '${_carpetas.length} ${_carpetas.length == 1 ? 'carpeta' : 'carpetas'}',
      '${_notas.length} ${_notas.length == 1 ? 'nota' : 'notas'}',
    ];
    return partes.join(' · ');
  }

  @override
  Widget build(BuildContext context) {
    final store = widget.sesionStore;
    final colores = context.colores;
    final puedeCrear = store.puede('notas:crear');

    return Scaffold(
      appBar: widget.mostrarAppBar
          ? AppBar(
              title: const Text('Notas'),
              actions: <Widget>[
                _botonCircular(
                  icono: _mostrarBuscador ? LucideIcons.x : LucideIcons.search,
                  tooltip: _mostrarBuscador ? 'Cerrar búsqueda' : 'Buscar',
                  activo: _mostrarBuscador,
                  onTap: () {
                    setState(() {
                      _mostrarBuscador = !_mostrarBuscador;
                      if (_mostrarBuscador) {
                        _focoBusqueda.requestFocus();
                      } else {
                        _focoBusqueda.unfocus();
                        _busqueda.clear();
                      }
                    });
                  },
                ),
                if (puedeCrear)
                  _botonCircular(
                    icono: LucideIcons.folderPlus,
                    tooltip: 'Crear carpeta',
                    onTap: _crearCarpeta,
                  ),
                _botonOrden(),
              ],
              bottom: PreferredSize(
                preferredSize: const Size.fromHeight(22),
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                  child: Align(
                    alignment: Alignment.centerLeft,
                    child: Text(
                      _resumenSubtitulo(),
                      style: Theme.of(context).textTheme.bodySmall
                          ?.copyWith(color: colores.tintaTenue),
                    ),
                  ),
                ),
              ),
            )
          : null,
      floatingActionButton: puedeCrear
          ? FloatingActionButton.extended(
              heroTag: widget.proyectoId != null
                  ? 'fab-notas-proy-${widget.proyectoId}'
                  : 'fab-notas-personal',
              onPressed: () => _abrirEditor('/notas/nueva'),
              icon: const Icon(LucideIcons.squarePen, size: 19),
              label: const Text('Nueva nota'),
            )
          : null,
      body: RefreshIndicator(
        onRefresh: _cargar,
        child: ListView(
          padding: const EdgeInsets.only(top: 6, bottom: 104),
          children: <Widget>[
            if (!widget.mostrarAppBar)
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
                child: Row(
                  children: <Widget>[
                    Expanded(
                      child: SearchBar(
                        controller: _busqueda,
                        hintText: 'Buscar en notas',
                        leading: Icon(
                          LucideIcons.search,
                          size: 18,
                          color: colores.tintaTenue,
                        ),
                        trailing: _busqueda.text.isNotEmpty
                            ? <Widget>[
                                IconButton(
                                  icon: const Icon(LucideIcons.x, size: 16),
                                  onPressed: () =>
                                      setState(() => _busqueda.clear()),
                                ),
                              ]
                            : null,
                        onChanged: (_) => setState(() {}),
                      ),
                    ),
                    if (puedeCrear)
                      IconButton(
                        tooltip: 'Crear carpeta',
                        icon: const Icon(LucideIcons.folderPlus),
                        onPressed: _crearCarpeta,
                      ),
                  ],
                ),
              )
            else
              AnimatedSize(
                duration: const Duration(milliseconds: 220),
                curve: Curves.easeOutCubic,
                child: _mostrarBuscador
                    ? Padding(
                        padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                        child: SearchBar(
                          controller: _busqueda,
                          focusNode: _focoBusqueda,
                          hintText: 'Buscar en notas',
                          leading: Icon(
                            LucideIcons.search,
                            size: 18,
                            color: colores.tintaTenue,
                          ),
                          trailing: _busqueda.text.isNotEmpty
                              ? <Widget>[
                                  IconButton(
                                    tooltip: 'Limpiar',
                                    icon: const Icon(LucideIcons.x, size: 16),
                                    onPressed: () =>
                                        setState(() => _busqueda.clear()),
                                  ),
                                ]
                              : null,
                          textInputAction: TextInputAction.search,
                          onChanged: (_) => setState(() {}),
                        ),
                      )
                    : const SizedBox.shrink(),
              ),
            if (_tags.isNotEmpty) _filtroTags(),
            avisoPendientes(
              cola: widget.notasApi.cola,
              usuarioId: store.usuario?.id,
              ruta: '/notas',
              onSincronizado: _cargar,
            ),
            if (_isCargando)
              const EstadoCargando()
            else if (_mensajeError != null)
              EstadoError(mensaje: _mensajeError!, onReintentar: _cargar)
            else if (_enModoFiltro)
              if (_notasFiltradas.isEmpty)
                const EstadoVacio(
                  icono: LucideIcons.search,
                  titulo: 'Sin resultados',
                  mensaje: 'No hay notas que coincidan con tu búsqueda.',
                )
              else
                ..._construirResultadosAgrupados()
            else
              ..._construirArbolObsidian(),
          ],
        ),
      ),
    );
  }
}
