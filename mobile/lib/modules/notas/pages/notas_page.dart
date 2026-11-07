import 'package:flutter/material.dart';
import '../../../core/auth/sesion_store.dart';
import '../../../core/theme/colores_noche_indigo.dart';
import '../../tags/api/tags_api.dart';
import '../../tags/models/tag_model.dart';
import '../api/notas_api.dart';
import '../models/nota_model.dart';
import '../widgets/nota_detalle_sheet.dart';
import '../widgets/nota_form_dialog.dart';

/// Vista `/notas` con buscador, filtro por tag, lectura y edición.
class NotasPage extends StatefulWidget {
  const NotasPage({
    super.key,
    required this.sesionStore,
    required this.notasApi,
    required this.tagsApi,
    this.cargarAlIniciar = true,
  });

  final SesionStore sesionStore;
  final NotasApi notasApi;
  final TagsApi tagsApi;
  final bool cargarAlIniciar;

  @override
  State<NotasPage> createState() => _NotasPageState();
}

class _NotasPageState extends State<NotasPage> {
  final TextEditingController _busquedaController = TextEditingController();

  List<NotaDto> _notas = const <NotaDto>[];
  List<TagDto> _tagsDisponibles = const <TagDto>[];
  int? _tagIdSeleccionado;
  bool _isCargando = false;
  String? _mensajeError;

  @override
  void initState() {
    super.initState();
    if (widget.cargarAlIniciar) {
      _cargarDatos();
    }
  }

  @override
  void dispose() {
    _busquedaController.dispose();
    super.dispose();
  }

  Future<void> _cargarDatos() async {
    setState(() {
      _isCargando = true;
      _mensajeError = null;
    });

    try {
      final futuros = await Future.wait<dynamic>(<Future<dynamic>>[
        widget.notasApi.obtenerTodos(
          busqueda: _busquedaController.text,
          tagId: _tagIdSeleccionado,
        ),
        widget.tagsApi.obtenerTodos(),
      ]);

      final paginaNotas = futuros[0] as PaginaNotas;
      final paginaTags = futuros[1] as PaginaTags;

      if (mounted) {
        setState(() {
          _notas = paginaNotas.datos;
          _tagsDisponibles = paginaTags.datos;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _mensajeError = 'No se pudieron cargar las notas.';
        });
      }
    } finally {
      if (mounted) {
        setState(() {
          _isCargando = false;
        });
      }
    }
  }

  Future<void> _crearNota() async {
    final valores = await showDialog<NotaFormValores>(
      context: context,
      builder: (_) => NotaFormDialog(tagsDisponibles: _tagsDisponibles),
    );
    if (valores == null) return;

    await widget.notasApi.crear(
      titulo: valores.titulo,
      contenido: valores.contenido,
      tagIds: valores.tagIds,
    );
    await _cargarDatos();
  }

  Future<void> _abrirDetalle(NotaDto nota) async {
    final colores = context.colores;
    await showModalBottomSheet<void>(
      context: context,
      backgroundColor: colores.superficie,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(8)),
      ),
      builder: (sheetContext) => NotaDetalleSheet(
        nota: nota,
        tagsDisponibles: _tagsDisponibles,
        puedeActualizar: widget.sesionStore.puede('notas:actualizar'),
        puedeEliminar: widget.sesionStore.puede('notas:eliminar'),
        onEditar: () async {
          Navigator.of(sheetContext).pop();
          final valores = await showDialog<NotaFormValores>(
            context: context,
            builder: (_) => NotaFormDialog(
              notaInicial: nota,
              tagsDisponibles: _tagsDisponibles,
            ),
          );
          if (valores == null) return;
          await widget.notasApi.actualizar(
            nota.id,
            titulo: valores.titulo,
            contenido: valores.contenido,
            color: nota.color,
            tagIds: valores.tagIds,
          );
          await _cargarDatos();
        },
        onEliminar: () async {
          Navigator.of(sheetContext).pop();
          await widget.notasApi.eliminar(nota.id);
          await _cargarDatos();
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final textTheme = Theme.of(context).textTheme;
    final puedeCrear = widget.sesionStore.puede('notas:crear');

    return RefreshIndicator(
      onRefresh: _cargarDatos,
      child: ListView(
        padding: const EdgeInsets.all(24),
        children: <Widget>[
          Wrap(
            alignment: WrapAlignment.spaceBetween,
            crossAxisAlignment: WrapCrossAlignment.center,
            spacing: 12,
            runSpacing: 12,
            children: <Widget>[
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Text('Notas', style: textTheme.headlineSmall),
                  const SizedBox(height: 4),
                  Text(
                    'Tus apuntes y documentos en Markdown.',
                    style: textTheme.bodyMedium?.copyWith(
                      color: colores.tintaTenue,
                    ),
                  ),
                ],
              ),
              if (puedeCrear)
                FilledButton.icon(
                  onPressed: _crearNota,
                  icon: const Icon(Icons.add_rounded, size: 18),
                  label: const Text('Nueva nota'),
                ),
            ],
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _busquedaController,
            textInputAction: TextInputAction.search,
            onSubmitted: (_) => _cargarDatos(),
            decoration: InputDecoration(
              hintText: 'Buscar en título o contenido...',
              prefixIcon: Icon(
                Icons.search_rounded,
                size: 18,
                color: colores.tintaTenue,
              ),
            ),
          ),
          if (_tagsDisponibles.isNotEmpty) ...<Widget>[
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: <Widget>[
                ChoiceChip(
                  label: const Text('Todos'),
                  selected: _tagIdSeleccionado == null,
                  onSelected: (_) {
                    setState(() => _tagIdSeleccionado = null);
                    _cargarDatos();
                  },
                ),
                for (final tag in _tagsDisponibles)
                  ChoiceChip(
                    label: Text(tag.nombre),
                    selected: _tagIdSeleccionado == tag.id,
                    onSelected: (seleccionado) {
                      setState(() {
                        _tagIdSeleccionado = seleccionado ? tag.id : null;
                      });
                      _cargarDatos();
                    },
                  ),
              ],
            ),
          ],
          const SizedBox(height: 20),
          if (_isCargando)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 40),
              child: Center(child: CircularProgressIndicator()),
            )
          else if (_mensajeError != null)
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: <Widget>[
                    Text(
                      _mensajeError!,
                      style: textTheme.bodyMedium?.copyWith(
                        color: colores.rosePeligro,
                      ),
                    ),
                    const SizedBox(height: 12),
                    OutlinedButton(
                      onPressed: _cargarDatos,
                      child: const Text('Reintentar'),
                    ),
                  ],
                ),
              ),
            )
          else if (_notas.isEmpty)
            Card(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  children: <Widget>[
                    Icon(
                      Icons.sticky_note_2_outlined,
                      size: 32,
                      color: colores.tintaTenue,
                    ),
                    const SizedBox(height: 12),
                    Text('Sin notas', style: textTheme.titleMedium),
                    const SizedBox(height: 4),
                    Text(
                      'Crea una nota para guardar apuntes e ideas.',
                      textAlign: TextAlign.center,
                      style: textTheme.bodyMedium?.copyWith(
                        color: colores.tintaTenue,
                      ),
                    ),
                  ],
                ),
              ),
            )
          else
            for (final nota in _notas) ...<Widget>[
              Card(
                child: InkWell(
                  borderRadius: BorderRadius.circular(8),
                  onTap: () => _abrirDetalle(nota),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: <Widget>[
                        Text(
                          nota.titulo,
                          style: textTheme.bodyMedium?.copyWith(
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        if (nota.contenido.trim().isNotEmpty) ...<Widget>[
                          const SizedBox(height: 6),
                          Text(
                            nota.contenido.trim(),
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
                ),
              ),
              const SizedBox(height: 10),
            ],
        ],
      ),
    );
  }
}
