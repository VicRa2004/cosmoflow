import 'package:flutter/material.dart';

import '../../../core/theme/colores_noche_indigo.dart';
import '../../tags/models/tag_model.dart';
import '../models/organizacion_models.dart';
import 'selector_color.dart';

/// Valores validados del formulario de equipo.
class EquipoFormValores {
  const EquipoFormValores({
    required this.nombre,
    required this.descripcion,
    required this.color,
    required this.miembroIds,
    required this.liderId,
    required this.tagIds,
  });

  final String nombre;
  final String descripcion;
  final String color;
  final List<int> miembroIds;
  final int? liderId;
  final List<int> tagIds;
}

/// Formulario de crear/editar equipo (RN-20, 21, 24).
class EquipoForm extends StatefulWidget {
  const EquipoForm({
    super.key,
    this.inicial,
    required this.miembros,
    this.tags = const <TagDto>[],
    this.onCambio,
  });

  final EquipoDto? inicial;
  final List<MiembroDto> miembros;
  final List<TagDto> tags;
  final VoidCallback? onCambio;

  @override
  State<EquipoForm> createState() => EquipoFormState();
}

class EquipoFormState extends State<EquipoForm> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  late final TextEditingController _nombreController;
  late final TextEditingController _descripcionController;
  late String _color;
  late final Set<int> _miembroIds;
  int? _liderId;
  late final Set<int> _tagIds;
  String? _errorMiembros;

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
    _miembroIds =
        widget.inicial?.miembros.map((m) => m.usuarioId).toSet() ?? <int>{};
    _liderId = widget.inicial?.liderId;
    _tagIds = widget.inicial?.tagIds.toSet() ?? <int>{};
  }

  @override
  void dispose() {
    _nombreController.dispose();
    _descripcionController.dispose();
    super.dispose();
  }

  /// Valida el formulario y devuelve los valores o `null` si hay errores.
  EquipoFormValores? validar() {
    final formValido = _formKey.currentState?.validate() ?? false;
    final miembrosValidos = _miembroIds.length >= 2;
    setState(() {
      _errorMiembros = miembrosValidos
          ? null
          : 'Elige al menos 2 miembros para el equipo';
    });
    if (!formValido || !miembrosValidos) return null;

    final liderFinal = _liderId != null && _miembroIds.contains(_liderId)
        ? _liderId
        : null;
    return EquipoFormValores(
      nombre: _nombreController.text.trim(),
      descripcion: _descripcionController.text.trim(),
      color: _color,
      miembroIds: _miembroIds.toList(growable: false),
      liderId: liderFinal,
      tagIds: _tagIds.toList(growable: false),
    );
  }

  void _alternarMiembro(int usuarioId, bool seleccionado) {
    setState(() {
      if (seleccionado) {
        _miembroIds.add(usuarioId);
      } else {
        _miembroIds.remove(usuarioId);
        if (_liderId == usuarioId) _liderId = null;
      }
      if (_miembroIds.length >= 2) _errorMiembros = null;
    });
    widget.onCambio?.call();
  }

  @override
  Widget build(BuildContext context) {
    final esEdicion = widget.inicial != null;
    final textTheme = Theme.of(context).textTheme;
    final colores = context.colores;
    final miembrosElegidos = widget.miembros
        .where((m) => _miembroIds.contains(m.usuarioId))
        .toList(growable: false);

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
              hintText: 'Ej. Diseño, Backend, Ventas',
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
              hintText: '¿De qué se encarga el equipo?',
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
          const SizedBox(height: 24),
          Text(
            'Miembros (al menos 2)',
            style: textTheme.labelLarge?.copyWith(color: colores.tintaTenue),
          ),
          if (_errorMiembros != null) ...<Widget>[
            const SizedBox(height: 4),
            Text(
              _errorMiembros!,
              style: textTheme.bodySmall?.copyWith(color: colores.rosePeligro),
            ),
          ],
          const SizedBox(height: 4),
          if (widget.miembros.isEmpty)
            Text(
              'No hay miembros disponibles en la organización.',
              style: textTheme.bodySmall?.copyWith(color: colores.tintaTenue),
            )
          else
            for (final m in widget.miembros)
              CheckboxListTile(
                contentPadding: EdgeInsets.zero,
                value: _miembroIds.contains(m.usuarioId),
                title: Text(m.nombre),
                subtitle: Text(m.email),
                onChanged: (v) => _alternarMiembro(m.usuarioId, v ?? false),
              ),
          const SizedBox(height: 16),
          DropdownButtonFormField<int?>(
            key: ValueKey<String>('lider-${_miembroIds.length}-$_liderId'),
            initialValue: _miembroIds.contains(_liderId) ? _liderId : null,
            decoration: const InputDecoration(labelText: 'Líder (opcional)'),
            items: <DropdownMenuItem<int?>>[
              const DropdownMenuItem<int?>(
                value: null,
                child: Text('Sin líder: cualquiera crea tareas'),
              ),
              for (final m in miembrosElegidos)
                DropdownMenuItem<int?>(
                  value: m.usuarioId,
                  child: Text(m.nombre),
                ),
            ],
            onChanged: (valor) {
              setState(() => _liderId = valor);
              widget.onCambio?.call();
            },
          ),
          if (widget.tags.isNotEmpty) ...<Widget>[
            const SizedBox(height: 24),
            Text(
              'Tags',
              style: textTheme.labelLarge?.copyWith(color: colores.tintaTenue),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: <Widget>[
                for (final tag in widget.tags)
                  FilterChip(
                    label: Text(tag.nombre),
                    selected: _tagIds.contains(tag.id),
                    onSelected: (sel) {
                      setState(() {
                        if (sel) {
                          _tagIds.add(tag.id);
                        } else {
                          _tagIds.remove(tag.id);
                        }
                      });
                      widget.onCambio?.call();
                    },
                  ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}
