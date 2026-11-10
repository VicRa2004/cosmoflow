import 'package:flutter/material.dart';
import '../../../core/auth/sesion_store.dart';
import '../../../core/theme/colores_noche_indigo.dart';
import '../api/tags_api.dart';
import '../models/tag_model.dart';
import '../../../core/widgets/avisos.dart';
import '../../../core/widgets/confirmar.dart';
import '../../../core/widgets/estados.dart';
import '../widgets/tag_form_sheet.dart';

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

  Future<TagFormValores?> _abrirForm([TagDto? tag]) =>
      showModalBottomSheet<TagFormValores>(
        context: context,
        isScrollControlled: true,
        useSafeArea: true,
        builder: (_) => TagFormSheet(tagInicial: tag),
      );

  Future<void> _guardar(Future<void> Function() accion) async {
    if (await ejecutarConAviso(
      context,
      accion,
      error: 'No se pudo guardar el tag.',
    )) {
      await _cargarTags();
    }
  }

  Future<void> _crearTag() async {
    final v = await _abrirForm();
    if (v == null || !mounted) return;
    await _guardar(
      () => widget.tagsApi.crear(nombre: v.nombre, color: v.color),
    );
  }

  Future<void> _editarTag(TagDto tag) async {
    final v = await _abrirForm(tag);
    if (v == null || !mounted) return;
    await _guardar(
      () => widget.tagsApi.actualizar(tag.id, nombre: v.nombre, color: v.color),
    );
  }

  Future<void> _eliminarTag(TagDto tag) async {
    final ok = await confirmar(
      context,
      titulo: '¿Eliminar tag?',
      mensaje: '«${tag.nombre}» se quitará de todas sus tareas y notas.',
      accion: 'Eliminar',
    );
    if (!ok || !mounted) return;
    await _guardar(() => widget.tagsApi.eliminar(tag.id));
  }

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final puedeActualizar = widget.sesionStore.puede('tags:actualizar');
    final puedeEliminar = widget.sesionStore.puede('tags:eliminar');

    return Scaffold(
      appBar: AppBar(title: const Text('Tags')),
      floatingActionButton: widget.sesionStore.puede('tags:crear')
          ? FloatingActionButton(
              tooltip: 'Nuevo tag',
              onPressed: _crearTag,
              child: const Icon(Icons.add_rounded),
            )
          : null,
      body: RefreshIndicator(
        onRefresh: _cargarTags,
        child: ListView(
          padding: const EdgeInsets.only(bottom: 96),
          children: <Widget>[
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
              child: SearchBar(
                controller: _busquedaController,
                hintText: 'Filtrar por nombre',
                leading: const Icon(Icons.search_rounded),
                elevation: const WidgetStatePropertyAll<double>(0),
                textInputAction: TextInputAction.search,
                onSubmitted: (_) => _cargarTags(),
              ),
            ),
            if (_isCargando)
              const EstadoCargando()
            else if (_mensajeError != null)
              EstadoError(mensaje: _mensajeError!, onReintentar: _cargarTags)
            else if (_tags.isEmpty)
              const EstadoVacio(
                icono: Icons.sell_outlined,
                titulo: 'Sin etiquetas',
                mensaje: 'Crea etiquetas para organizar tus tareas y notas.',
              )
            else
              for (final tag in _tags) ...<Widget>[
                ListTile(
                  onTap: puedeActualizar ? () => _editarTag(tag) : null,
                  leading: Icon(
                    Icons.sell_rounded,
                    color: _parsearColorHex(tag.color) ?? colores.tintaTenue,
                  ),
                  title: Text(tag.nombre),
                  trailing: puedeEliminar
                      ? IconButton(
                          tooltip: 'Eliminar tag',
                          onPressed: () => _eliminarTag(tag),
                          icon: const Icon(Icons.delete_outline_rounded),
                        )
                      : null,
                ),
                const Divider(indent: 56),
              ],
          ],
        ),
      ),
    );
  }
}
