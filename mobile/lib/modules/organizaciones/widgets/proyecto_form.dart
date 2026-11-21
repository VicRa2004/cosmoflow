import 'package:flutter/material.dart';

import '../../../core/theme/colores_noche_indigo.dart';
import '../../../core/widgets/campo_fecha.dart';
import '../models/organizacion_models.dart';
import 'selector_color.dart';

/// Valores validados del formulario de proyecto.
class ProyectoFormValores {
  const ProyectoFormValores({
    required this.nombre,
    required this.descripcion,
    required this.estado,
    required this.color,
    required this.fechaInicio,
    required this.fechaFin,
    required this.equipoIds,
    required this.integranteIds,
  });

  final String nombre;
  final String descripcion;
  final EstadoProyecto estado;
  final String? color;
  final String? fechaInicio;
  final String? fechaFin;
  final List<int> equipoIds;
  final List<int> integranteIds;
}

/// Formulario de crear/editar proyecto (RN-31, 32).
class ProyectoForm extends StatefulWidget {
  const ProyectoForm({
    super.key,
    this.inicial,
    required this.equipos,
    required this.miembros,
    this.onCambio,
  });

  final ProyectoDto? inicial;
  final List<EquipoDto> equipos;
  final List<MiembroDto> miembros;
  final VoidCallback? onCambio;

  @override
  State<ProyectoForm> createState() => ProyectoFormState();
}

class ProyectoFormState extends State<ProyectoForm> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  late final TextEditingController _nombreController;
  late final TextEditingController _descripcionController;
  late final TextEditingController _inicioController;
  late final TextEditingController _finController;
  late EstadoProyecto _estado;
  String? _color;
  late final Set<int> _equipoIds;
  late final Set<int> _integranteIds;
  String? _errorIntegrantes;

  @override
  void initState() {
    super.initState();
    _nombreController = TextEditingController(
      text: widget.inicial?.nombre ?? '',
    );
    _descripcionController = TextEditingController(
      text: widget.inicial?.descripcion ?? '',
    );
    _inicioController = TextEditingController(
      text: widget.inicial?.fechaInicio ?? '',
    );
    _finController = TextEditingController(
      text: widget.inicial?.fechaFin ?? '',
    );
    _inicioController.addListener(() => widget.onCambio?.call());
    _finController.addListener(() => widget.onCambio?.call());
    _estado = widget.inicial?.estado ?? EstadoProyecto.activo;
    _color = (widget.inicial?.color?.isNotEmpty ?? false)
        ? widget.inicial!.color
        : null;
    _equipoIds = widget.inicial?.equipoIds.toSet() ?? <int>{};
    _integranteIds = widget.inicial?.integranteIds.toSet() ?? <int>{};
  }

  @override
  void dispose() {
    _nombreController.dispose();
    _descripcionController.dispose();
    _inicioController.dispose();
    _finController.dispose();
    super.dispose();
  }

  /// Valida el formulario y devuelve los valores o `null` si hay errores.
  ProyectoFormValores? validar() {
    final formValido = _formKey.currentState?.validate() ?? false;
    final hayIntegrantes = _equipoIds.isNotEmpty || _integranteIds.isNotEmpty;
    setState(() {
      _errorIntegrantes = hayIntegrantes
          ? null
          : 'Elige al menos un equipo o una persona';
    });
    if (!formValido || !hayIntegrantes) return null;

    final inicio = _inicioController.text.trim();
    final fin = _finController.text.trim();
    return ProyectoFormValores(
      nombre: _nombreController.text.trim(),
      descripcion: _descripcionController.text.trim(),
      estado: _estado,
      color: _color,
      fechaInicio: inicio.isEmpty ? null : inicio,
      fechaFin: fin.isEmpty ? null : fin,
      equipoIds: _equipoIds.toList(growable: false),
      integranteIds: _integranteIds.toList(growable: false),
    );
  }

  @override
  Widget build(BuildContext context) {
    final esEdicion = widget.inicial != null;
    final textTheme = Theme.of(context).textTheme;
    final colores = context.colores;

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
              hintText: 'Ej. Lanzamiento de la web',
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
              hintText: '¿De qué trata el proyecto?',
            ),
            validator: (valor) {
              if ((valor?.trim().length ?? 0) > 500) {
                return 'Máximo 500 caracteres';
              }
              return null;
            },
          ),
          const SizedBox(height: 16),
          Text(
            'Estado',
            style: textTheme.labelLarge?.copyWith(color: colores.tintaTenue),
          ),
          const SizedBox(height: 8),
          SegmentedButton<EstadoProyecto>(
            showSelectedIcon: false,
            segments: <ButtonSegment<EstadoProyecto>>[
              for (final e in EstadoProyecto.values)
                ButtonSegment<EstadoProyecto>(
                  value: e,
                  label: Text(e.etiqueta),
                ),
            ],
            selected: <EstadoProyecto>{_estado},
            onSelectionChanged: (sel) {
              setState(() => _estado = sel.first);
              widget.onCambio?.call();
            },
          ),
          const SizedBox(height: 16),
          CampoFecha(
            etiqueta: 'Inicio (opcional)',
            controller: _inicioController,
          ),
          const SizedBox(height: 16),
          CampoFecha(
            etiqueta: 'Fin (opcional)',
            controller: _finController,
            validator: (valor) {
              final inicio = _inicioController.text.trim();
              final fin = valor?.trim() ?? '';
              if (inicio.isNotEmpty &&
                  fin.isNotEmpty &&
                  fin.compareTo(inicio) < 0) {
                return 'Debe ser igual o posterior al inicio';
              }
              return null;
            },
          ),
          const SizedBox(height: 16),
          SelectorColor(
            valor: _color,
            opcional: true,
            onChanged: (hex) {
              setState(() => _color = hex);
              widget.onCambio?.call();
            },
          ),
          const SizedBox(height: 24),
          Text(
            'Equipos',
            style: textTheme.labelLarge?.copyWith(color: colores.tintaTenue),
          ),
          if (widget.equipos.isEmpty) ...<Widget>[
            const SizedBox(height: 4),
            Text(
              'La organización aún no tiene equipos.',
              style: textTheme.bodySmall?.copyWith(color: colores.tintaTenue),
            ),
          ] else
            for (final eq in widget.equipos)
              CheckboxListTile(
                contentPadding: EdgeInsets.zero,
                value: _equipoIds.contains(eq.id),
                title: Text(eq.nombre),
                onChanged: (v) {
                  setState(() {
                    if (v ?? false) {
                      _equipoIds.add(eq.id);
                    } else {
                      _equipoIds.remove(eq.id);
                    }
                    if (_equipoIds.isNotEmpty || _integranteIds.isNotEmpty) {
                      _errorIntegrantes = null;
                    }
                  });
                  widget.onCambio?.call();
                },
              ),
          const SizedBox(height: 16),
          Text(
            'Personas sueltas',
            style: textTheme.labelLarge?.copyWith(color: colores.tintaTenue),
          ),
          if (_errorIntegrantes != null) ...<Widget>[
            const SizedBox(height: 4),
            Text(
              _errorIntegrantes!,
              style: textTheme.bodySmall?.copyWith(color: colores.rosePeligro),
            ),
          ],
          for (final m in widget.miembros)
            CheckboxListTile(
              contentPadding: EdgeInsets.zero,
              value: _integranteIds.contains(m.usuarioId),
              title: Text(m.nombre),
              subtitle: Text(m.email),
              onChanged: (v) {
                setState(() {
                  if (v ?? false) {
                    _integranteIds.add(m.usuarioId);
                  } else {
                    _integranteIds.remove(m.usuarioId);
                  }
                  if (_equipoIds.isNotEmpty || _integranteIds.isNotEmpty) {
                    _errorIntegrantes = null;
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
