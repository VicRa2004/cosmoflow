import 'package:flutter/material.dart';

import '../../../core/widgets/avisos.dart';
import '../../../core/widgets/pagina_editor.dart';
import '../api/organizaciones_api.dart';
import '../models/organizacion_models.dart';
import '../widgets/organizacion_form.dart';

/// Pantalla completa para crear (`/organizaciones/nueva`) o editar
/// (`/organizaciones/:id/editar`) una organización.
class OrganizacionEditorPage extends StatefulWidget {
  const OrganizacionEditorPage({
    super.key,
    required this.organizacionesApi,
    this.organizacion,
  });

  final OrganizacionesApi organizacionesApi;
  final OrganizacionDto? organizacion;

  @override
  State<OrganizacionEditorPage> createState() => _OrganizacionEditorPageState();
}

class _OrganizacionEditorPageState extends State<OrganizacionEditorPage> {
  final GlobalKey<OrganizacionFormState> _formKey =
      GlobalKey<OrganizacionFormState>();

  Future<bool> _guardar() async {
    final valores = _formKey.currentState?.validar();
    if (valores == null) return false;
    final existente = widget.organizacion;

    return ejecutarConAviso(
      context,
      () async {
        if (existente == null) {
          await widget.organizacionesApi.crear(
            nombre: valores.nombre,
            descripcion: valores.descripcion,
            color: valores.color,
          );
        } else {
          await widget.organizacionesApi.actualizar(
            existente.id,
            nombre: valores.nombre,
            descripcion: valores.descripcion,
            color: valores.color,
          );
        }
      },
      error: existente == null
          ? 'No se pudo crear la organización.'
          : 'No se pudo actualizar la organización.',
      exito: existente == null
          ? 'Organización creada'
          : 'Organización actualizada',
    );
  }

  @override
  Widget build(BuildContext context) {
    final esEdicion = widget.organizacion != null;
    return PaginaEditor(
      titulo: esEdicion ? 'Editar organización' : 'Nueva organización',
      onGuardar: _guardar,
      builder: (onCambio) => OrganizacionForm(
        key: _formKey,
        inicial: widget.organizacion,
        onCambio: onCambio,
      ),
    );
  }
}
