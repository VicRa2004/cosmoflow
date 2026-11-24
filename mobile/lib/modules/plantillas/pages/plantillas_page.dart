import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/auth/sesion_store.dart';
import '../../../core/theme/colores_noche_indigo.dart';
import '../../../core/widgets/avisos.dart';
import '../../../core/widgets/confirmar.dart';
import '../../../core/widgets/estados.dart';
import '../../organizaciones/widgets/selector_color.dart';
import '../../tags/models/tag_model.dart';
import '../../tareas/pages/tarea_editor_page.dart';
import '../../tareas/widgets/tarea_form.dart';
import '../api/plantillas_api.dart';
import '../models/plantilla_model.dart';
import 'plantilla_editor_page.dart';

/// Vista `/plantillas` (o pestaña de organización) para usar, editar y eliminar plantillas.
class PlantillasPage extends StatefulWidget {
  const PlantillasPage({
    super.key,
    required this.sesionStore,
    required this.plantillasApi,
    this.organizacionId,
    this.puedeGestionar,
    this.tags = const <TagDto>[],
    this.responsables = const <ResponsableCandidato>[],
    this.mostrarAppBar = true,
    this.cargarAlIniciar = true,
  });

  final SesionStore sesionStore;
  final PlantillasApi plantillasApi;
  final int? organizacionId;
  final bool? puedeGestionar;
  final List<TagDto> tags;
  final List<ResponsableCandidato> responsables;
  final bool mostrarAppBar;
  final bool cargarAlIniciar;

  @override
  State<PlantillasPage> createState() => _PlantillasPageState();
}

class _PlantillasPageState extends State<PlantillasPage> {
  List<PlantillaTareaDto> _plantillas = const <PlantillaTareaDto>[];
  bool _isCargando = false;
  String? _mensajeError;

  @override
  void initState() {
    super.initState();
    if (widget.cargarAlIniciar) {
      _cargar();
    }
  }

  Future<void> _cargar() async {
    setState(() {
      _isCargando = true;
      _mensajeError = null;
    });
    try {
      final lista = await widget.plantillasApi.obtenerTodas(
        organizacionId: widget.organizacionId,
      );
      if (mounted) setState(() => _plantillas = lista);
    } catch (_) {
      if (mounted) {
        setState(() => _mensajeError = 'No se pudieron cargar las plantillas.');
      }
    } finally {
      if (mounted) setState(() => _isCargando = false);
    }
  }

  void _usar(PlantillaTareaDto plantilla) {
    context.push<bool>(
      '/tareas/nueva',
      extra: TareaEditorArgs(
        plantillaInicial: plantilla,
        organizacionId: widget.organizacionId,
        tags: widget.tags,
        responsables: widget.responsables,
      ),
    );
  }

  Future<void> _editar(PlantillaTareaDto plantilla) async {
    final guardado = await context.push<bool>(
      '/plantillas/${plantilla.id}/editar',
      extra: PlantillaEditorArgs(
        plantilla: plantilla,
        organizacionId: widget.organizacionId,
      ),
    );
    if (guardado == true && mounted) {
      await _cargar();
    }
  }

  Future<void> _eliminar(PlantillaTareaDto plantilla) async {
    final ok = await confirmar(
      context,
      titulo: '¿Eliminar la plantilla «${plantilla.nombre}»?',
      mensaje: 'Las tareas creadas con ella no cambian. Esta acción no se puede deshacer.',
      accion: 'Eliminar',
    );
    if (!ok || !mounted) return;
    final eliminado = await ejecutarConAviso(
      context,
      () => widget.plantillasApi.eliminar(
        plantilla.id,
        organizacionId: widget.organizacionId,
      ),
      error: 'No se pudo eliminar la plantilla.',
      exito: 'Plantilla eliminada',
    );
    if (eliminado && mounted) {
      await _cargar();
    }
  }

  String _subtitulo(PlantillaTareaDto p) {
    final partes = <String>[
      p.titulo,
      'Prioridad ${p.prioridad.etiqueta.toLowerCase()}',
      if (p.subtareas.isNotEmpty)
        '${p.subtareas.length} subtarea${p.subtareas.length == 1 ? '' : 's'}',
    ];
    return partes.join(' · ');
  }

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final puedeUsar = widget.sesionStore.puede('tareas:crear');
    final puedeEditarOBorrar =
        (widget.puedeGestionar ?? true) &&
        widget.sesionStore.puede('tareas:crear');

    return Scaffold(
      appBar: widget.mostrarAppBar
          ? AppBar(title: const Text('Plantillas'))
          : null,
      body: RefreshIndicator(
        onRefresh: _cargar,
        child: _isCargando
            ? ListView(
                children: const <Widget>[
                  SizedBox(height: 120),
                  EstadoCargando(),
                ],
              )
            : _mensajeError != null
            ? ListView(
                children: <Widget>[
                  const SizedBox(height: 80),
                  EstadoError(mensaje: _mensajeError!, onReintentar: _cargar),
                ],
              )
            : _plantillas.isEmpty
            ? ListView(
                children: <Widget>[
                  const SizedBox(height: 80),
                  EstadoVacio(
                    icono: Icons.description_outlined,
                    titulo: 'Sin plantillas',
                    mensaje: widget.organizacionId != null
                        ? 'Para crear una, abre una tarea y pulsa «Guardar como plantilla». Las de la organización las pueden usar todos sus miembros.'
                        : 'Para crear una, abre una tarea y pulsa «Guardar como plantilla».',
                  ),
                ],
              )
            : ListView.separated(
                padding: const EdgeInsets.only(bottom: 32),
                itemCount: _plantillas.length,
                separatorBuilder: (_, _) => const Divider(indent: 56),
                itemBuilder: (context, index) {
                  final p = _plantillas[index];
                  return ListTile(
                    onTap: puedeUsar ? () => _usar(p) : null,
                    leading: Icon(
                      Icons.description_outlined,
                      color: parsearColorHex(p.color) ?? colores.tintaTenue,
                    ),
                    title: Text(
                      p.nombre,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    subtitle: Text(
                      _subtitulo(p),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    trailing: puedeEditarOBorrar
                        ? PopupMenuButton<String>(
                            tooltip: 'Opciones',
                            onSelected: (accion) {
                              if (accion == 'usar') _usar(p);
                              if (accion == 'editar') _editar(p);
                              if (accion == 'eliminar') _eliminar(p);
                            },
                            itemBuilder: (_) => <PopupMenuEntry<String>>[
                              if (puedeUsar)
                                const PopupMenuItem<String>(
                                  value: 'usar',
                                  child: Text('Usar'),
                                ),
                              const PopupMenuItem<String>(
                                value: 'editar',
                                child: Text('Editar'),
                              ),
                              PopupMenuItem<String>(
                                value: 'eliminar',
                                child: Text(
                                  'Eliminar',
                                  style: TextStyle(color: colores.rosePeligro),
                                ),
                              ),
                            ],
                          )
                        : (puedeUsar
                              ? IconButton(
                                  tooltip: 'Usar plantilla',
                                  onPressed: () => _usar(p),
                                  icon: const Icon(Icons.add_task_rounded),
                                )
                              : null),
                  );
                },
              ),
      ),
    );
  }
}
