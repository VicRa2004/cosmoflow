import 'package:flutter/material.dart';

import '../models/organizacion_models.dart';
import 'selector_color.dart';

/// Valores validados del formulario de organización.
class OrganizacionFormValores {
  const OrganizacionFormValores({
    required this.nombre,
    required this.descripcion,
    required this.color,
  });

  final String nombre;
  final String descripcion;
  final String color;
}

/// Formulario de crear/editar organización (nombre, descripción y color).
class OrganizacionForm extends StatefulWidget {
  const OrganizacionForm({super.key, this.inicial, this.onCambio});

  final OrganizacionDto? inicial;
  final VoidCallback? onCambio;

  @override
  State<OrganizacionForm> createState() => OrganizacionFormState();
}

class OrganizacionFormState extends State<OrganizacionForm> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  late final TextEditingController _nombreController;
  late final TextEditingController _descripcionController;
  late String _color;

  @override
  void initState() {
    super.initState();
    _nombreController = TextEditingController(
      text: widget.inicial?.nombre ?? '',
    );
    _descripcionController = TextEditingController(
      text: widget.inicial?.descripcion ?? '',
    );
    _color = (widget.inicial?.color?.isNotEmpty ?? false)
        ? widget.inicial!.color!
        : coloresAcentoOrganizacion.first;
  }

  @override
  void dispose() {
    _nombreController.dispose();
    _descripcionController.dispose();
    super.dispose();
  }

  /// Valida el formulario y devuelve los valores o `null` si hay errores.
  OrganizacionFormValores? validar() {
    final form = _formKey.currentState;
    if (form == null || !form.validate()) return null;
    return OrganizacionFormValores(
      nombre: _nombreController.text.trim(),
      descripcion: _descripcionController.text.trim(),
      color: _color,
    );
  }

  @override
  Widget build(BuildContext context) {
    final esEdicion = widget.inicial != null;

    return Form(
      key: _formKey,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
        children: <Widget>[
          TextFormField(
            controller: _nombreController,
            autofocus: !esEdicion,
            textCapitalization: TextCapitalization.sentences,
            textInputAction: TextInputAction.next,
            maxLength: 100,
            onChanged: (_) => widget.onCambio?.call(),
            decoration: const InputDecoration(
              labelText: 'Nombre',
              hintText: 'Ej. Acme S.L.',
            ),
            validator: (valor) {
              final texto = valor?.trim() ?? '';
              if (texto.isEmpty) return 'El nombre es obligatorio';
              if (texto.length > 100) return 'Máximo 100 caracteres';
              return null;
            },
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _descripcionController,
            textCapitalization: TextCapitalization.sentences,
            keyboardType: TextInputType.multiline,
            minLines: 2,
            maxLines: 4,
            maxLength: 500,
            onChanged: (_) => widget.onCambio?.call(),
            decoration: const InputDecoration(
              labelText: 'Descripción (opcional)',
              hintText: '¿A qué se dedica la organización?',
            ),
            validator: (valor) {
              if ((valor?.trim().length ?? 0) > 500) {
                return 'Máximo 500 caracteres';
              }
              return null;
            },
          ),
          const SizedBox(height: 16),
          SelectorColor(
            valor: _color,
            opcional: false,
            onChanged: (hex) {
              if (hex == null) return;
              setState(() => _color = hex);
              widget.onCambio?.call();
            },
          ),
        ],
      ),
    );
  }
}
