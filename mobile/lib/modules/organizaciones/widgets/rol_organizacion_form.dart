import 'package:flutter/material.dart';

import '../../../core/theme/colores_noche_indigo.dart';
import '../models/organizacion_models.dart';

/// Valores validados del formulario de rol de organización.
class RolOrganizacionFormValores {
  const RolOrganizacionFormValores({
    required this.nombre,
    required this.permisos,
  });

  final String nombre;
  final List<String> permisos;
}

/// Formulario de crear/editar rol de organización con plantillas opcionales (RN-17).
class RolOrganizacionForm extends StatefulWidget {
  const RolOrganizacionForm({
    super.key,
    this.inicial,
    required this.catalogo,
    this.onCambio,
  });

  final RolOrganizacionDto? inicial;
  final CatalogoPermisosOrganizacionDto catalogo;
  final VoidCallback? onCambio;

  @override
  State<RolOrganizacionForm> createState() => RolOrganizacionFormState();
}

class RolOrganizacionFormState extends State<RolOrganizacionForm> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  late final TextEditingController _nombreController;
  late final Set<String> _permisos;
  String? _plantillaSeleccionada;

  @override
  void initState() {
    super.initState();
    _nombreController = TextEditingController(
      text: widget.inicial?.nombre ?? '',
    );
    _permisos = widget.inicial?.permisos.toSet() ?? <String>{};
  }

  @override
  void dispose() {
    _nombreController.dispose();
    super.dispose();
  }

  /// Valida el formulario y devuelve los valores o `null` si hay errores.
  RolOrganizacionFormValores? validar() {
    final form = _formKey.currentState;
    if (form == null || !form.validate()) return null;
    return RolOrganizacionFormValores(
      nombre: _nombreController.text.trim(),
      permisos: _permisos.toList(growable: false),
    );
  }

  void _aplicarPlantilla(String? nombrePlantilla) {
    setState(() {
      _plantillaSeleccionada = nombrePlantilla;
      if (nombrePlantilla == null) return;
      final plantilla = widget.catalogo.plantillas
          .where((p) => p.nombre == nombrePlantilla)
          .firstOrNull;
      if (plantilla == null) return;
      _nombreController.text = plantilla.nombre;
      _permisos
        ..clear()
        ..addAll(plantilla.permisos);
    });
    widget.onCambio?.call();
  }

  @override
  Widget build(BuildContext context) {
    final esEdicion = widget.inicial != null;
    final textTheme = Theme.of(context).textTheme;
    final colores = context.colores;
    final listaPermisos = widget.catalogo.permisos.isNotEmpty
        ? widget.catalogo.permisos
        : etiquetasPermisoOrganizacion.keys.toList(growable: false);

    return Form(
      key: _formKey,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
        children: <Widget>[
          if (!esEdicion && widget.catalogo.plantillas.isNotEmpty) ...<Widget>[
            DropdownButtonFormField<String?>(
              initialValue: _plantillaSeleccionada,
              decoration: const InputDecoration(
                labelText: 'Partir de una plantilla (opcional)',
              ),
              items: <DropdownMenuItem<String?>>[
                const DropdownMenuItem<String?>(
                  value: null,
                  child: Text('Desde cero'),
                ),
                for (final p in widget.catalogo.plantillas)
                  DropdownMenuItem<String?>(
                    value: p.nombre,
                    child: Text(p.nombre),
                  ),
              ],
              onChanged: _aplicarPlantilla,
            ),
            const SizedBox(height: 16),
          ],
          TextFormField(
            controller: _nombreController,
            autofocus: !esEdicion,
            textCapitalization: TextCapitalization.sentences,
            textInputAction: TextInputAction.done,
            maxLength: 64,
            onChanged: (_) => widget.onCambio?.call(),
            decoration: const InputDecoration(
              labelText: 'Nombre',
              hintText: 'Ej. Coordinación',
            ),
            validator: (valor) {
              final texto = valor?.trim() ?? '';
              if (texto.isEmpty) return 'El nombre es obligatorio';
              if (texto.length > 64) return 'Máximo 64 caracteres';
              return null;
            },
          ),
          const SizedBox(height: 16),
          Text(
            'Permisos',
            style: textTheme.labelLarge?.copyWith(color: colores.tintaTenue),
          ),
          const SizedBox(height: 4),
          Text(
            'Ver la organización no necesita permiso: basta con ser miembro.',
            style: textTheme.bodySmall?.copyWith(color: colores.tintaTenue),
          ),
          const SizedBox(height: 8),
          for (final permiso in listaPermisos)
            CheckboxListTile(
              contentPadding: EdgeInsets.zero,
              value: _permisos.contains(permiso),
              title: Text(etiquetasPermisoOrganizacion[permiso] ?? permiso),
              onChanged: (v) {
                setState(() {
                  if (v ?? false) {
                    _permisos.add(permiso);
                  } else {
                    _permisos.remove(permiso);
                  }
                });
                widget.onCambio?.call();
              },
            ),
        ],
      ),
    );
  }
}
