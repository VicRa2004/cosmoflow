import 'package:flutter/material.dart';

import '../../../core/widgets/avisos.dart';
import '../../../core/widgets/estados.dart';
import '../../../core/widgets/pagina_editor.dart';
import '../api/organizaciones_api.dart';
import '../models/organizacion_models.dart';
import '../widgets/rol_organizacion_form.dart';

/// Pantalla completa para crear o editar un rol de organización.
class RolOrganizacionEditorPage extends StatefulWidget {
  const RolOrganizacionEditorPage({
    super.key,
    required this.organizacionId,
    required this.organizacionesApi,
    this.rol,
  });

  final int organizacionId;
  final OrganizacionesApi organizacionesApi;
  final RolOrganizacionDto? rol;

  @override
  State<RolOrganizacionEditorPage> createState() =>
      _RolOrganizacionEditorPageState();
}

class _RolOrganizacionEditorPageState extends State<RolOrganizacionEditorPage> {
  final GlobalKey<RolOrganizacionFormState> _formKey =
      GlobalKey<RolOrganizacionFormState>();
  CatalogoPermisosOrganizacionDto? _catalogo;
  bool _cargando = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _cargarCatalogo();
  }

  Future<void> _cargarCatalogo() async {
    setState(() {
      _cargando = true;
      _error = null;
    });
    try {
      final catalogo = await widget.organizacionesApi.obtenerCatalogoPermisos(
        widget.organizacionId,
      );
      if (mounted) setState(() => _catalogo = catalogo);
    } catch (_) {
      if (mounted) {
        setState(() => _error = 'No se pudo cargar el catálogo de permisos.');
      }
    } finally {
      if (mounted) setState(() => _cargando = false);
    }
  }

  Future<bool> _guardar() async {
    final valores = _formKey.currentState?.validar();
    if (valores == null) return false;
    final existente = widget.rol;

    return ejecutarConAviso(
      context,
      () async {
        if (existente == null) {
          await widget.organizacionesApi.crearRol(
            widget.organizacionId,
            nombre: valores.nombre,
            permisos: valores.permisos,
          );
        } else {
          await widget.organizacionesApi.actualizarRol(
            widget.organizacionId,
            existente.id,
            nombre: valores.nombre,
            permisos: valores.permisos,
          );
        }
      },
      error: existente == null
          ? 'No se pudo crear el rol.'
          : 'No se pudo actualizar el rol.',
      exito: existente == null ? 'Rol creado' : 'Rol actualizado',
    );
  }

  @override
  Widget build(BuildContext context) {
    final esEdicion = widget.rol != null;
    return PaginaEditor(
      titulo: esEdicion ? 'Editar rol' : 'Nuevo rol',
      onGuardar: _guardar,
      builder: (onCambio) {
        if (_cargando) return const EstadoCargando();
        if (_error != null || _catalogo == null) {
          return EstadoError(
            mensaje: _error ?? 'No se pudo cargar el catálogo de permisos.',
            onReintentar: _cargarCatalogo,
          );
        }
        return RolOrganizacionForm(
          key: _formKey,
          inicial: widget.rol,
          catalogo: _catalogo!,
          onCambio: onCambio,
        );
      },
    );
  }
}
