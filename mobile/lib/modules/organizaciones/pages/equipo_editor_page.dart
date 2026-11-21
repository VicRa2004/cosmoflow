import 'package:flutter/material.dart';

import '../../../core/widgets/avisos.dart';
import '../../../core/widgets/estados.dart';
import '../../../core/widgets/pagina_editor.dart';
import '../../tags/api/tags_api.dart';
import '../../tags/models/tag_model.dart';
import '../api/organizaciones_api.dart';
import '../models/organizacion_models.dart';
import '../widgets/equipo_form.dart';

/// Argumentos para abrir el editor de equipo.
class EquipoEditorArgs {
  const EquipoEditorArgs({
    this.equipo,
    this.miembros = const <MiembroDto>[],
    this.tags = const <TagDto>[],
  });

  final EquipoDto? equipo;
  final List<MiembroDto> miembros;
  final List<TagDto> tags;

  static EquipoEditorArgs fromExtra(Object? extra) {
    if (extra is EquipoEditorArgs) return extra;
    if (extra is EquipoDto) return EquipoEditorArgs(equipo: extra);
    return const EquipoEditorArgs();
  }
}

/// Pantalla completa para crear o editar un equipo dentro de una organización.
class EquipoEditorPage extends StatefulWidget {
  const EquipoEditorPage({
    super.key,
    required this.organizacionId,
    required this.organizacionesApi,
    required this.tagsApi,
    this.args = const EquipoEditorArgs(),
  });

  final int organizacionId;
  final OrganizacionesApi organizacionesApi;
  final TagsApi tagsApi;
  final EquipoEditorArgs args;

  @override
  State<EquipoEditorPage> createState() => _EquipoEditorPageState();
}

class _EquipoEditorPageState extends State<EquipoEditorPage> {
  final GlobalKey<EquipoFormState> _formKey = GlobalKey<EquipoFormState>();
  late List<MiembroDto> _miembros = widget.args.miembros;
  late List<TagDto> _tags = widget.args.tags;
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
        widget.organizacionesApi.obtenerMiembros(widget.organizacionId),
        widget.tagsApi.obtenerTodos(organizacionId: widget.organizacionId),
      ]);
      if (!mounted) return;
      setState(() {
        _miembros = res[0] as List<MiembroDto>;
        _tags = (res[1] as PaginaTags).datos;
      });
    } catch (_) {
      if (mounted) {
        setState(() => _error = 'No se pudieron cargar los miembros.');
      }
    } finally {
      if (mounted) setState(() => _cargando = false);
    }
  }

  Future<bool> _guardar() async {
    final valores = _formKey.currentState?.validar();
    if (valores == null) return false;
    final existente = widget.args.equipo;

    return ejecutarConAviso(
      context,
      () async {
        if (existente == null) {
          await widget.organizacionesApi.crearEquipo(
            widget.organizacionId,
            nombre: valores.nombre,
            descripcion: valores.descripcion,
            color: valores.color,
            miembroIds: valores.miembroIds,
            liderId: valores.liderId,
            tagIds: valores.tagIds,
          );
        } else {
          await widget.organizacionesApi.actualizarEquipo(
            widget.organizacionId,
            existente.id,
            nombre: valores.nombre,
            descripcion: valores.descripcion,
            color: valores.color,
            miembroIds: valores.miembroIds,
            liderId: valores.liderId,
            tagIds: valores.tagIds,
          );
        }
      },
      error: existente == null
          ? 'No se pudo crear el equipo.'
          : 'No se pudo actualizar el equipo.',
      exito: existente == null ? 'Equipo creado' : 'Equipo actualizado',
    );
  }

  @override
  Widget build(BuildContext context) {
    final esEdicion = widget.args.equipo != null;
    return PaginaEditor(
      titulo: esEdicion ? 'Editar equipo' : 'Nuevo equipo',
      onGuardar: _guardar,
      builder: (onCambio) {
        if (_cargando) return const EstadoCargando();
        if (_error != null) {
          return EstadoError(
            mensaje: _error!,
            onReintentar: _cargarDependencias,
          );
        }
        return EquipoForm(
          key: _formKey,
          inicial: widget.args.equipo,
          miembros: _miembros,
          tags: _tags,
          onCambio: onCambio,
        );
      },
    );
  }
}
