import 'package:flutter/material.dart';
import '../../../core/auth/sesion_store.dart';
import '../../../core/theme/colores_noche_indigo.dart';
import '../api/tags_api.dart';
import '../models/tag_model.dart';
import '../widgets/tag_form_dialog.dart';

/// Vista `/tags` para buscar, crear, editar y eliminar etiquetas personales.
class TagsPage extends StatefulWidget {
  const TagsPage({
    super.key,
    required this.sesionStore,
    required this.tagsApi,
    this.cargarAlIniciar = true,
  });

  final SesionStore sesionStore;
  final TagsApi tagsApi;
  final bool cargarAlIniciar;

  @override
  State<TagsPage> createState() => _TagsPageState();
}

class _TagsPageState extends State<TagsPage> {
  final TextEditingController _busquedaController = TextEditingController();

  List<TagDto> _tags = const <TagDto>[];
  bool _isCargando = false;
  String? _mensajeError;

  @override
  void initState() {
    super.initState();
    if (widget.cargarAlIniciar) {
      _cargarTags();
    }
  }

  @override
  void dispose() {
    _busquedaController.dispose();
    super.dispose();
  }

  static Color? _parsearColorHex(String? hex) {
    if (hex == null || hex.isEmpty) return null;
    final limpio = hex.replaceFirst('#', '');
    if (limpio.length != 6) return null;
    final valor = int.tryParse('FF$limpio', radix: 16);
    return valor != null ? Color(valor) : null;
  }

  Future<void> _cargarTags() async {
    setState(() {
      _isCargando = true;
      _mensajeError = null;
    });

    try {
      final pagina = await widget.tagsApi.obtenerTodos(
        nombre: _busquedaController.text,
      );
      if (mounted) {
        setState(() {
          _tags = pagina.datos;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _mensajeError = 'No se pudieron cargar los tags.';
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

  Future<void> _crearTag() async {
    final valores = await showDialog<TagFormValores>(
      context: context,
      builder: (_) => const TagFormDialog(),
    );
    if (valores == null) return;

    await widget.tagsApi.crear(nombre: valores.nombre, color: valores.color);
    await _cargarTags();
  }

  Future<void> _editarTag(TagDto tag) async {
    final valores = await showDialog<TagFormValores>(
      context: context,
      builder: (_) => TagFormDialog(tagInicial: tag),
    );
    if (valores == null) return;

    await widget.tagsApi.actualizar(
      tag.id,
      nombre: valores.nombre,
      color: valores.color,
    );
    await _cargarTags();
  }

  Future<void> _eliminarTag(TagDto tag) async {
    await widget.tagsApi.eliminar(tag.id);
    await _cargarTags();
  }

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final textTheme = Theme.of(context).textTheme;
    final puedeCrear = widget.sesionStore.puede('tags:crear');
    final puedeActualizar = widget.sesionStore.puede('tags:actualizar');
    final puedeEliminar = widget.sesionStore.puede('tags:eliminar');

    return RefreshIndicator(
      onRefresh: _cargarTags,
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
                  Text('Tags', style: textTheme.headlineSmall),
                  const SizedBox(height: 4),
                  Text(
                    'Etiquetas personales para clasificar tareas y notas.',
                    style: textTheme.bodyMedium?.copyWith(
                      color: colores.tintaTenue,
                    ),
                  ),
                ],
              ),
              if (puedeCrear)
                FilledButton.icon(
                  onPressed: _crearTag,
                  icon: const Icon(Icons.add_rounded, size: 18),
                  label: const Text('Nuevo tag'),
                ),
            ],
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _busquedaController,
            textInputAction: TextInputAction.search,
            onSubmitted: (_) => _cargarTags(),
            decoration: InputDecoration(
              hintText: 'Filtrar por nombre...',
              prefixIcon: Icon(
                Icons.search_rounded,
                size: 18,
                color: colores.tintaTenue,
              ),
            ),
          ),
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
                      onPressed: _cargarTags,
                      child: const Text('Reintentar'),
                    ),
                  ],
                ),
              ),
            )
          else if (_tags.isEmpty)
            Card(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  children: <Widget>[
                    Icon(
                      Icons.sell_outlined,
                      size: 32,
                      color: colores.tintaTenue,
                    ),
                    const SizedBox(height: 12),
                    Text('Sin etiquetas', style: textTheme.titleMedium),
                    const SizedBox(height: 4),
                    Text(
                      'Crea etiquetas personales para organizar tus tareas y notas.',
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
            for (final tag in _tags) ...<Widget>[
              Card(
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 12,
                  ),
                  child: Row(
                    children: <Widget>[
                      Container(
                        width: 10,
                        height: 10,
                        decoration: BoxDecoration(
                          color: _parsearColorHex(tag.color) ??
                              colores.tintaTenue,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          tag.nombre,
                          style: textTheme.bodyMedium?.copyWith(
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                      if (puedeActualizar)
                        IconButton(
                          tooltip: 'Editar tag',
                          onPressed: () => _editarTag(tag),
                          icon: Icon(
                            Icons.edit_outlined,
                            size: 18,
                            color: colores.tintaSuave,
                          ),
                        ),
                      if (puedeEliminar)
                        IconButton(
                          tooltip: 'Eliminar tag',
                          onPressed: () => _eliminarTag(tag),
                          icon: Icon(
                            Icons.delete_outline_rounded,
                            size: 18,
                            color: colores.rosePeligro,
                          ),
                        ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 8),
            ],
        ],
      ),
    );
  }
}
