import 'package:flutter/material.dart';

import '../../../core/theme/tema_app.dart';
import '../../organizaciones/widgets/selector_color.dart';
import '../models/carpeta_model.dart';

/// Valores devueltos por [mostrarCarpetaFormSheet].
typedef DatosCarpetaForm = ({String nombre, String? color});

/// Abre un bottom sheet para crear o editar una carpeta (nombre y color).
Future<DatosCarpetaForm?> mostrarCarpetaFormSheet(
  BuildContext context, {
  CarpetaDto? carpeta,
}) {
  return showModalBottomSheet<DatosCarpetaForm>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    useSafeArea: true,
    builder: (ctx) => _CarpetaFormSheet(carpeta: carpeta),
  );
}

class _CarpetaFormSheet extends StatefulWidget {
  const _CarpetaFormSheet({this.carpeta});

  final CarpetaDto? carpeta;

  @override
  State<_CarpetaFormSheet> createState() => _CarpetaFormSheetState();
}

class _CarpetaFormSheetState extends State<_CarpetaFormSheet> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nombre = TextEditingController(
    text: widget.carpeta?.nombre ?? '',
  );
  late String? _color = widget.carpeta?.color;

  @override
  void dispose() {
    _nombre.dispose();
    super.dispose();
  }

  void _guardar() {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    Navigator.of(context).pop((nombre: _nombre.text.trim(), color: _color));
  }

  @override
  Widget build(BuildContext context) {
    final esEdicion = widget.carpeta != null;
    final bottom = MediaQuery.viewInsetsOf(context).bottom;

    return Padding(
      padding: EdgeInsets.fromLTRB(
        TemaApp.margenPantalla,
        4,
        TemaApp.margenPantalla,
        bottom + 24,
      ),
      child: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            Text(
              esEdicion ? 'Editar carpeta' : 'Nueva carpeta',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: TemaApp.espacioCampo),
            TextFormField(
              controller: _nombre,
              autofocus: !esEdicion,
              maxLength: 120,
              textCapitalization: TextCapitalization.sentences,
              textInputAction: TextInputAction.done,
              onFieldSubmitted: (_) => _guardar(),
              decoration: const InputDecoration(
                labelText: 'Nombre',
                hintText: 'Ej. Proyecto, Viajes…',
                counterText: '',
              ),
              validator: (valor) {
                if (valor == null || valor.trim().isEmpty) {
                  return 'Escribe un nombre para la carpeta.';
                }
                return null;
              },
            ),
            const SizedBox(height: TemaApp.espacioCampo),
            SelectorColor(
              valor: _color,
              opcional: true,
              onChanged: (c) => setState(() => _color = c),
            ),
            const SizedBox(height: TemaApp.espacioSeccion),
            FilledButton(
              onPressed: _guardar,
              child: Text(esEdicion ? 'Guardar cambios' : 'Crear carpeta'),
            ),
          ],
        ),
      ),
    );
  }
}
