import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/auth/sesion_store.dart';
import '../../../core/offline/aviso_pendientes.dart';
import '../../../core/widgets/estados.dart';
import '../../tags/api/tags_api.dart';
import '../../tags/models/tag_model.dart';
import '../api/notas_api.dart';
import '../models/carpeta_model.dart';
import '../models/nota_model.dart';
import '../widgets/nota_fila.dart';
import '../widgets/selector_carpeta.dart';
import 'nota_editor_page.dart';

/// Vista `/notas` (o pestaña de notas de un proyecto) con buscador, filtro por carpeta y tag, lectura y edición.
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
  List<NotaDto> _notas = const <NotaDto>[];
  List<TagDto> _tags = const <TagDto>[];
  List<CarpetaDto> _carpetas = const <CarpetaDto>[];
  int? _tagId;
  int? _carpetaId;
  bool _isCargando = false;
  String? _mensajeError;

  @override
  void initState() {
    super.initState();
    if (widget.cargarAlIniciar) _cargar();
  }

  @override
  void dispose() {
    _busqueda.dispose();
    super.dispose();
  }

  Future<void> _cargar() async {
    setState(() {
      _isCargando = true;
      _mensajeError = null;
    });
    try {
      final r = await Future.wait<dynamic>(<Future<dynamic>>[
        widget.notasApi.obtenerTodos(
          busqueda: _busqueda.text,
          tagId: _tagId,
          carpetaId: _carpetaId,
          proyectoId: widget.proyectoId,
        ),
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

  Future<void> _abrirEditor(String ruta) async {
    final guardada = await context.push<bool>(
      ruta,
      extra: NotaEditorArgs(
        tags: _tags,
        carpetas: _carpetas,
        carpetaInicial: _carpetaId,
        proyectoId: widget.proyectoId,
      ),
    );
    if (guardada ?? false) await _cargar();
  }

  Future<void> _abrirDetalle(NotaDto nota) async {
    await context.push<void>(
      '/notas/${nota.id}',
      extra: NotaEditorArgs(
        nota: nota,
        tags: _tags,
        carpetas: _carpetas,
        proyectoId: widget.proyectoId,
      ),
    );
    // Pudo editarse o eliminarse dentro.
    if (mounted) await _cargar();
  }

  Widget _filtroTags() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        spacing: 8,
        children: <Widget>[
          ChoiceChip(
            label: const Text('Todos'),
            selected: _tagId == null,
            onSelected: (_) {
              setState(() => _tagId = null);
              _cargar();
            },
          ),
          for (final tag in _tags)
            ChoiceChip(
              label: Text(tag.nombre),
              selected: _tagId == tag.id,
              onSelected: (sel) {
                setState(() => _tagId = sel ? tag.id : null);
                _cargar();
              },
            ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: widget.mostrarAppBar ? AppBar(title: const Text('Notas')) : null,
      floatingActionButton: widget.sesionStore.puede('notas:crear')
          ? FloatingActionButton(
              heroTag: widget.proyectoId != null
                  ? 'fab-notas-proy-${widget.proyectoId}'
                  : 'fab-notas-personal',
              tooltip: 'Nueva nota',
              onPressed: () => _abrirEditor('/notas/nueva'),
              child: const Icon(Icons.add_rounded),
            )
          : null,
      body: RefreshIndicator(
        onRefresh: _cargar,
        child: ListView(
          padding: const EdgeInsets.only(bottom: 96),
          children: <Widget>[
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
              child: SearchBar(
                controller: _busqueda,
                hintText: 'Buscar en notas',
                leading: const Icon(Icons.search_rounded),
                elevation: const WidgetStatePropertyAll<double>(0),
                textInputAction: TextInputAction.search,
                onSubmitted: (_) => _cargar(),
              ),
            ),
            if (_carpetas.isNotEmpty)
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                child: SelectorCarpeta(
                  carpetas: _carpetas,
                  valor: _carpetaId,
                  textoNinguna: 'Todas las carpetas',
                  onChanged: (id) {
                    setState(() => _carpetaId = id);
                    _cargar();
                  },
                ),
              ),
            if (_tags.isNotEmpty) _filtroTags(),
            const SizedBox(height: 8),
            avisoPendientes(
              cola: widget.notasApi.cola,
              usuarioId: widget.sesionStore.usuario?.id,
              ruta: '/notas',
              onSincronizado: _cargar,
            ),
            if (_isCargando)
              const EstadoCargando()
            else if (_mensajeError != null)
              EstadoError(mensaje: _mensajeError!, onReintentar: _cargar)
            else if (_notas.isEmpty)
              const EstadoVacio(
                icono: Icons.sticky_note_2_outlined,
                titulo: 'Sin notas',
                mensaje: 'Crea una nota para guardar apuntes e ideas.',
              )
            else
              for (final nota in _notas) ...<Widget>[
                NotaFila(
                  nota: nota,
                  carpeta: _carpetaId == null
                      ? _carpetas
                            .where((c) => c.id == nota.carpetaId)
                            .firstOrNull
                      : null,
                  onTap: () => _abrirDetalle(nota),
                ),
                const Divider(indent: 56),
              ],
          ],
        ),
      ),
    );
  }
}
