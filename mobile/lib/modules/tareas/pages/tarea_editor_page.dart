import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../../core/api/adjuntos_api.dart';
import '../../../core/offline/aviso_pendientes.dart';
import '../../../core/theme/colores_noche_indigo.dart';
import '../../../core/widgets/avisos.dart';
import '../../../core/widgets/pagina_editor.dart';
import '../../../core/widgets/tarjeta_seccion.dart';
import '../../organizaciones/api/organizaciones_api.dart';
import '../../organizaciones/models/organizacion_models.dart';
import '../../organizaciones/services/contexto_organizacion_cache.dart';
import '../../plantillas/api/plantillas_api.dart';
import '../../plantillas/models/plantilla_model.dart';
import '../../plantillas/widgets/selector_plantilla.dart';
import '../../tags/api/tags_api.dart';
import '../../tags/models/tag_model.dart';
import '../api/tareas_api.dart';
import '../models/tarea_model.dart';
import '../widgets/adjuntos_tarea_section.dart';
import '../widgets/tarea_form.dart';

/// Argumentos que recibe el editor o detalle de tarea por `extra` de GoRouter.
class TareaEditorArgs {
  const TareaEditorArgs({
    this.tarea,
    this.plantillaInicial,
    this.organizacionId,
    this.equipoId,
    this.proyectoId,
    this.ubicacion,
    this.tags = const <TagDto>[],
    this.responsables = const <ResponsableCandidato>[],
  });

  final TareaDto? tarea;
  final PlantillaTareaDto? plantillaInicial;
  final int? organizacionId;
  final int? equipoId;
  final int? proyectoId;
  final UbicacionTarea? ubicacion;
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
    this.organizacionesApi,
    this.tagsApi,
    this.adjuntosApi,
    this.tarea,
    this.args = const TareaEditorArgs(),
    this.cargarPlantillas = true,
    this.selectorArchivo,
  });

  final TareasApi tareasApi;
  final PlantillasApi? plantillasApi;
  final OrganizacionesApi? organizacionesApi;
  final TagsApi? tagsApi;
  final AdjuntosApi? adjuntosApi;

  /// `null` = crear (también puede venir en `args.tarea`).
  final TareaDto? tarea;
  final TareaEditorArgs args;
  final bool cargarPlantillas;
  final SelectorArchivoAdjunto? selectorArchivo;

  @override
  State<TareaEditorPage> createState() => _TareaEditorPageState();
}

class _TareaEditorPageState extends State<TareaEditorPage> {
  GlobalKey<TareaFormState> _form = GlobalKey<TareaFormState>();
  late final AdjuntosApi _adjuntosApi =
      widget.adjuntosApi ?? AdjuntosApi(apiClient: widget.tareasApi.apiClient);
  late PlantillaTareaDto? _plantillaSeleccionada = widget.args.plantillaInicial;
  late List<TagDto> _tags = widget.args.tags;
  late List<ResponsableCandidato> _responsables = widget.args.responsables;
  late UbicacionTarea? _ubicacion = widget.args.ubicacion;
  List<PlantillaTareaDto> _personales = const <PlantillaTareaDto>[];
  List<PlantillaTareaDto> _deOrganizacion = const <PlantillaTareaDto>[];
  List<TareaDto> _candidatas = const <TareaDto>[];

  TareaDto? get _tareaActual => widget.tarea ?? widget.args.tarea;
  int? get _orgId => widget.args.organizacionId ?? _tareaActual?.organizacionId;
  int? get _equipoId => widget.args.equipoId ?? _tareaActual?.equipoId;
  int? get _proyectoId => widget.args.proyectoId ?? _tareaActual?.proyectoId;

  @override
  void initState() {
    super.initState();
    if (_tareaActual == null && widget.cargarPlantillas) {
      _cargarPlantillasDisponibles();
    }
    _cargarCandidatas();
    _cargarContextoDestino();
  }

  Future<void> _cargarContextoDestino() async {
    final orgId = _orgId;
    final tagsApi =
        widget.tagsApi ?? TagsApi(apiClient: widget.tareasApi.apiClient);
    final orgApi =
        widget.organizacionesApi ??
        OrganizacionesApi(apiClient: widget.tareasApi.apiClient);

    if (_tags.isEmpty) {
      try {
        final pagina = await tagsApi.obtenerTodos(organizacionId: orgId);
        if (mounted) setState(() => _tags = pagina.datos);
      } catch (_) {}
    }

    if (orgId == null) return;

    if (_responsables.isEmpty || _ubicacion == null) {
      try {
        final res = await Future.wait<dynamic>(<Future<dynamic>>[
          orgApi.obtenerUna(orgId),
          orgApi.obtenerMiembros(orgId),
          orgApi.obtenerEquipos(orgId),
          orgApi.obtenerProyectos(orgId),
        ]);
        if (!mounted) return;
        final org = res[0] as OrganizacionDto;
        final miembros = res[1] as List<MiembroDto>;
        final equipos = res[2] as List<EquipoDto>;
        final proyectos = res[3] as List<ProyectoDto>;
        final equipo = _equipoId == null
            ? null
            : equipos.where((e) => e.id == _equipoId).firstOrNull;
        final proyecto = _proyectoId == null
            ? null
            : proyectos.where((p) => p.id == _proyectoId).firstOrNull;
        setState(() {
          _ubicacion ??= UbicacionTarea(
            organizacionId: orgId,
            organizacionNombre: org.nombre,
            equipoId: _equipoId,
            equipoNombre: equipo?.nombre,
            proyectoId: _proyectoId,
            proyectoNombre: proyecto?.nombre,
          );
          if (_responsables.isEmpty) {
            _responsables = filtrarMiembrosDestino(
              miembros: miembros,
              equipos: equipos,
              proyectos: proyectos,
              equipoId: _equipoId,
              proyectoId: _proyectoId,
            );
          }
        });
      } catch (_) {}
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

  Future<void> _cargarCandidatas() async {
    final tarea = _tareaActual;
    final a = widget.args;
    try {
      final pagina = await widget.tareasApi.obtenerTodos(
        limite: 100,
        organizacionId: a.organizacionId ?? tarea?.organizacionId,
        equipoId: a.equipoId ?? tarea?.equipoId,
        proyectoId: a.proyectoId ?? tarea?.proyectoId,
      );
      if (mounted) {
        setState(() {
          _candidatas = pagina.datos
              .where((t) => t.id != tarea?.id)
              .toList(growable: false);
        });
      }
    } catch (_) {
      // Sin red o sin permisos, el selector de dependencia queda vacío sin bloquear.
    }
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
          isFijada: v.isFijada,
          dependeDeId: v.dependeDeId,
          recurrencia: v.recurrencia,
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
          'isFijada': v.isFijada,
          'dependeDeId': v.dependeDeId,
          'recurrencia': v.recurrencia?.valorApi,
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
    final colores = context.colores;
    final ubicacion = _ubicacion;
    final encabezado = Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: <Widget>[
        if (_orgId != null) ...<Widget>[
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: <Widget>[
              InsigniaPill(
                texto: ubicacion?.organizacionNombre ?? 'Organización',
                icono: LucideIcons.building2,
                colorTexto: colores.indigoMarca,
                colorFondo: colores.indigoSuave,
              ),
              if (_equipoId != null)
                InsigniaPill(
                  texto: ubicacion?.equipoNombre != null
                      ? 'Equipo · ${ubicacion!.equipoNombre}'
                      : 'Equipo',
                  icono: LucideIcons.users,
                  colorTexto: colores.indigoMarca,
                  colorFondo: colores.indigoSuave,
                ),
              if (_proyectoId != null)
                InsigniaPill(
                  texto: ubicacion?.proyectoNombre != null
                      ? 'Proyecto · ${ubicacion!.proyectoNombre}'
                      : 'Proyecto',
                  icono: LucideIcons.folderKanban,
                  colorTexto: colores.indigoMarca,
                  colorFondo: colores.indigoSuave,
                ),
            ],
          ),
          const SizedBox(height: 14),
        ],
        if (tarea == null)
          SelectorPlantilla(
            personales: _personales,
            deOrganizacion: _deOrganizacion,
            seleccionadaId: _plantillaSeleccionada?.id,
            onElegir: _elegirPlantilla,
          ),
      ],
    );
    return PaginaEditor(
      titulo: tarea == null ? 'Nueva tarea' : 'Editar tarea',
      onGuardar: _guardar,
      builder: (onCambio) => TareaForm(
        key: _form,
        tareaInicial: tarea,
        plantillaInicial: _plantillaSeleccionada,
        encabezado: encabezado,
        tagsDisponibles: _tags,
        responsablesDisponibles: _responsables,
        tareasCandidatas: _candidatas,
        adjuntosApi: _adjuntosApi,
        organizacionId: _orgId,
        equipoId: _equipoId,
        proyectoId: _proyectoId,
        selectorArchivo: widget.selectorArchivo,
        onCambio: onCambio,
      ),
    );
  }
}
