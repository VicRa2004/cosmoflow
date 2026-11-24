import 'package:flutter/material.dart';

import '../../../core/offline/aviso_pendientes.dart';
import '../../../core/widgets/avisos.dart';
import '../../../core/widgets/pagina_editor.dart';
import '../../plantillas/api/plantillas_api.dart';
import '../../plantillas/models/plantilla_model.dart';
import '../../plantillas/widgets/selector_plantilla.dart';
import '../../tags/models/tag_model.dart';
import '../api/tareas_api.dart';
import '../models/tarea_model.dart';
import '../widgets/tarea_form.dart';

/// Argumentos que recibe el editor o detalle de tarea por `extra` de GoRouter.
class TareaEditorArgs {
  const TareaEditorArgs({
    this.tarea,
    this.plantillaInicial,
    this.organizacionId,
    this.equipoId,
    this.proyectoId,
    this.tags = const <TagDto>[],
    this.responsables = const <ResponsableCandidato>[],
  });

  final TareaDto? tarea;
  final PlantillaTareaDto? plantillaInicial;
  final int? organizacionId;
  final int? equipoId;
  final int? proyectoId;
  final List<TagDto> tags;
  final List<ResponsableCandidato> responsables;

  static TareaEditorArgs fromExtra(Object? extra) {
    if (extra is TareaEditorArgs) return extra;
    if (extra is TareaDto) return TareaEditorArgs(tarea: extra);
    return const TareaEditorArgs();
  }
}

/// `/tareas/nueva` y `/tareas/:id/editar`. Devuelve `true` al guardar.
class TareaEditorPage extends StatefulWidget {
  const TareaEditorPage({
    super.key,
    required this.tareasApi,
    this.plantillasApi,
    this.tarea,
    this.args = const TareaEditorArgs(),
    this.cargarPlantillas = true,
  });

  final TareasApi tareasApi;
  final PlantillasApi? plantillasApi;

  /// `null` = crear (también puede venir en `args.tarea`).
  final TareaDto? tarea;
  final TareaEditorArgs args;
  final bool cargarPlantillas;

  @override
  State<TareaEditorPage> createState() => _TareaEditorPageState();
}

class _TareaEditorPageState extends State<TareaEditorPage> {
  GlobalKey<TareaFormState> _form = GlobalKey<TareaFormState>();
  late PlantillaTareaDto? _plantillaSeleccionada = widget.args.plantillaInicial;
  List<PlantillaTareaDto> _personales = const <PlantillaTareaDto>[];
  List<PlantillaTareaDto> _deOrganizacion = const <PlantillaTareaDto>[];

  TareaDto? get _tareaActual => widget.tarea ?? widget.args.tarea;

  @override
  void initState() {
    super.initState();
    if (_tareaActual == null && widget.cargarPlantillas) {
      _cargarPlantillasDisponibles();
    }
  }

  Future<void> _cargarPlantillasDisponibles() async {
    final api =
        widget.plantillasApi ??
        PlantillasApi(apiClient: widget.tareasApi.apiClient);
    final orgId = widget.args.organizacionId;
    try {
      final res = await Future.wait<List<PlantillaTareaDto>>(
        <Future<List<PlantillaTareaDto>>>[
          api.obtenerTodas(),
          if (orgId != null)
            api.obtenerTodas(organizacionId: orgId)
          else
            Future<List<PlantillaTareaDto>>.value(const <PlantillaTareaDto>[]),
        ],
      );
      if (!mounted) return;
      setState(() {
        _personales = res[0];
        _deOrganizacion = res[1];
      });
    } catch (_) {
      // Sin conexión o sin acceso: se puede seguir creando tareas manualmente.
    }
  }

  void _elegirPlantilla(PlantillaTareaDto? nueva) {
    setState(() {
      _plantillaSeleccionada = nueva;
      _form = GlobalKey<TareaFormState>();
    });
  }

  static bool _mismosIds(List<int> a, List<int> b) {
    if (a.length != b.length) return false;
    final setA = a.toSet();
    final setB = b.toSet();
    return setA.length == setB.length && setA.containsAll(setB);
  }

  Future<bool> _guardar() async {
    final v = _form.currentState?.validar();
    if (v == null) return false;
    final tarea = _tareaActual;
    final a = widget.args;
    return ejecutarConAviso(context, () async {
      if (tarea == null) {
        final creada = await widget.tareasApi.crear(
          titulo: v.titulo,
          contenido: v.contenido,
          estado: v.estado,
          prioridad: v.prioridad,
          fechaInicio: v.fechaInicio,
          fechaVencimiento: v.fechaVencimiento,
          color: v.color,
          tagIds: v.tagIds,
          responsableIds: v.responsableIds,
          subtareas: v.subtareas,
          organizacionId: a.organizacionId,
          equipoId: a.equipoId,
          proyectoId: a.proyectoId,
        );
        if (mounted) avisarSiEncolada(context, creada);
      } else {
        final cambioResponsables = !_mismosIds(
          tarea.responsableIds,
          v.responsableIds,
        );
        await widget.tareasApi.actualizar(tarea.id, <String, dynamic>{
          'titulo': v.titulo,
          'contenido': v.contenido,
          'estado': v.estado.valorApi,
          'prioridad': v.prioridad.valorApi,
          'fechaInicio': v.fechaInicio,
          'fechaVencimiento': v.fechaVencimiento,
          'color': v.color,
          'tagIds': v.tagIds,
          'subtareas': v.subtareas
              .map((s) => s.toJson())
              .toList(growable: false),
          if (cambioResponsables) 'responsableIds': v.responsableIds,
        });
      }
    }, error: 'No se pudo guardar la tarea.');
  }

  @override
  Widget build(BuildContext context) {
    final tarea = _tareaActual;
    return PaginaEditor(
      titulo: tarea == null ? 'Nueva tarea' : 'Editar tarea',
      onGuardar: _guardar,
      builder: (onCambio) => TareaForm(
        key: _form,
        tareaInicial: tarea,
        plantillaInicial: _plantillaSeleccionada,
        encabezado: tarea == null
            ? SelectorPlantilla(
                personales: _personales,
                deOrganizacion: _deOrganizacion,
                seleccionadaId: _plantillaSeleccionada?.id,
                onElegir: _elegirPlantilla,
              )
            : null,
        tagsDisponibles: widget.args.tags,
        responsablesDisponibles: widget.args.responsables,
        onCambio: onCambio,
      ),
    );
  }
}
