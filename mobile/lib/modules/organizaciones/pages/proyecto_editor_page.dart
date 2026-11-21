import 'package:flutter/material.dart';

import '../../../core/widgets/avisos.dart';
import '../../../core/widgets/estados.dart';
import '../../../core/widgets/pagina_editor.dart';
import '../api/organizaciones_api.dart';
import '../models/organizacion_models.dart';
import '../widgets/proyecto_form.dart';

/// Argumentos para abrir el editor de proyecto.
class ProyectoEditorArgs {
  const ProyectoEditorArgs({
    this.proyecto,
    this.equipos = const <EquipoDto>[],
    this.miembros = const <MiembroDto>[],
  });

  final ProyectoDto? proyecto;
  final List<EquipoDto> equipos;
  final List<MiembroDto> miembros;

  static ProyectoEditorArgs fromExtra(Object? extra) {
    if (extra is ProyectoEditorArgs) return extra;
    if (extra is ProyectoDto) return ProyectoEditorArgs(proyecto: extra);
    return const ProyectoEditorArgs();
  }
}

/// Pantalla completa para crear o editar un proyecto dentro de una organización.
class ProyectoEditorPage extends StatefulWidget {
  const ProyectoEditorPage({
    super.key,
    required this.organizacionId,
    required this.organizacionesApi,
    this.args = const ProyectoEditorArgs(),
  });

  final int organizacionId;
  final OrganizacionesApi organizacionesApi;
  final ProyectoEditorArgs args;

  @override
  State<ProyectoEditorPage> createState() => _ProyectoEditorPageState();
}

class _ProyectoEditorPageState extends State<ProyectoEditorPage> {
  final GlobalKey<ProyectoFormState> _formKey = GlobalKey<ProyectoFormState>();
  late List<EquipoDto> _equipos = widget.args.equipos;
  late List<MiembroDto> _miembros = widget.args.miembros;
  bool _cargando = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    if (_miembros.isEmpty) _cargarDependencias();
  }

  Future<void> _cargarDependencias() async {
    setState(() {
      _cargando = true;
      _error = null;
    });
    try {
      final res = await Future.wait<dynamic>(<Future<dynamic>>[
        widget.organizacionesApi.obtenerEquipos(widget.organizacionId),
        widget.organizacionesApi.obtenerMiembros(widget.organizacionId),
      ]);
      if (!mounted) return;
      setState(() {
        _equipos = res[0] as List<EquipoDto>;
        _miembros = res[1] as List<MiembroDto>;
      });
    } catch (_) {
      if (mounted) {
        setState(
          () => _error = 'No se pudieron cargar los datos del proyecto.',
        );
      }
    } finally {
      if (mounted) setState(() => _cargando = false);
    }
  }

  Future<bool> _guardar() async {
    final valores = _formKey.currentState?.validar();
    if (valores == null) return false;
    final existente = widget.args.proyecto;

    return ejecutarConAviso(
      context,
      () async {
        if (existente == null) {
          await widget.organizacionesApi.crearProyecto(
            widget.organizacionId,
            nombre: valores.nombre,
            descripcion: valores.descripcion,
            estado: valores.estado,
            color: valores.color,
            fechaInicio: valores.fechaInicio,
            fechaFin: valores.fechaFin,
            equipoIds: valores.equipoIds,
            integranteIds: valores.integranteIds,
          );
        } else {
          await widget.organizacionesApi.actualizarProyecto(
            widget.organizacionId,
            existente.id,
            nombre: valores.nombre,
            descripcion: valores.descripcion,
            estado: valores.estado,
            color: valores.color,
            fechaInicio: valores.fechaInicio,
            fechaFin: valores.fechaFin,
            equipoIds: valores.equipoIds,
            integranteIds: valores.integranteIds,
          );
        }
      },
      error: existente == null
          ? 'No se pudo crear el proyecto.'
          : 'No se pudo actualizar el proyecto.',
      exito: existente == null ? 'Proyecto creado' : 'Proyecto actualizado',
    );
  }

  @override
  Widget build(BuildContext context) {
    final esEdicion = widget.args.proyecto != null;
    return PaginaEditor(
      titulo: esEdicion ? 'Editar proyecto' : 'Nuevo proyecto',
      onGuardar: _guardar,
      builder: (onCambio) {
        if (_cargando) return const EstadoCargando();
        if (_error != null) {
          return EstadoError(
            mensaje: _error!,
            onReintentar: _cargarDependencias,
          );
        }
        return ProyectoForm(
          key: _formKey,
          inicial: widget.args.proyecto,
          equipos: _equipos,
          miembros: _miembros,
          onCambio: onCambio,
        );
      },
    );
  }
}
