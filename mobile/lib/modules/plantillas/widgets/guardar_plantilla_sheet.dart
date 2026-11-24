import 'package:flutter/material.dart';

import '../../../core/theme/colores_noche_indigo.dart';
import '../../../core/widgets/avisos.dart';
import '../../organizaciones/api/organizaciones_api.dart';
import '../../organizaciones/models/organizacion_models.dart';
import '../../tareas/models/tarea_model.dart';
import '../api/plantillas_api.dart';
import '../models/plantilla_model.dart';

/// Bottom sheet «Guardar como plantilla» desde el detalle de una tarea.
class GuardarPlantillaSheet extends StatefulWidget {
  const GuardarPlantillaSheet({
    super.key,
    required this.tarea,
    required this.plantillasApi,
    required this.organizacionesApi,
  });

  final TareaDto tarea;
  final PlantillasApi plantillasApi;
  final OrganizacionesApi organizacionesApi;

  @override
  State<GuardarPlantillaSheet> createState() => _GuardarPlantillaSheetState();
}

class _GuardarPlantillaSheetState extends State<GuardarPlantillaSheet> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nombre;
  OrganizacionDto? _organizacionPermitida;
  String _destino = 'personal';
  bool _guardando = false;

  @override
  void initState() {
    super.initState();
    final titulo = widget.tarea.titulo.trim();
    _nombre = TextEditingController(
      text: titulo.length > 100 ? titulo.substring(0, 100) : titulo,
    );
    final orgId = widget.tarea.organizacionId;
    if (orgId != null) {
      _cargarPermisosOrg(orgId);
    }
  }

  @override
  void dispose() {
    _nombre.dispose();
    super.dispose();
  }

  Future<void> _cargarPermisosOrg(int orgId) async {
    try {
      final org = await widget.organizacionesApi.obtenerUna(orgId);
      if (!mounted) return;
      if (org.puede('plantillas:gestionar')) {
        setState(() => _organizacionPermitida = org);
      }
    } catch (_) {
      // Si falla la consulta de permisos, se mantiene solo el destino personal.
    }
  }

  Future<void> _guardar() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    setState(() => _guardando = true);
    final payload = construirPayloadPlantillaDesdeTarea(
      widget.tarea,
      nombre: _nombre.text,
    );
    final orgId = _destino == 'organizacion'
        ? _organizacionPermitida?.id
        : null;
    final ok = await ejecutarConAviso(
      context,
      () => widget.plantillasApi.crear(
        nombre: payload['nombre'] as String,
        titulo: payload['titulo'] as String,
        contenido: payload['contenido'] as String,
        prioridad: PrioridadTarea.fromValorApi(payload['prioridad'] as String?),
        color: payload['color'] as String?,
        subtareas: (payload['subtareas'] as List<String>),
        organizacionId: orgId,
      ),
      error: 'No se pudo guardar la plantilla.',
      exito: 'Plantilla guardada',
    );
    if (!mounted) return;
    setState(() => _guardando = false);
    if (ok) Navigator.of(context).pop(true);
  }

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final textTheme = Theme.of(context).textTheme;
    final org = _organizacionPermitida;

    return SingleChildScrollView(
      padding: EdgeInsets.fromLTRB(
        16,
        8,
        16,
        24 + MediaQuery.viewInsetsOf(context).bottom,
      ),
      child: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            Text('Guardar como plantilla', style: textTheme.titleMedium),
            const SizedBox(height: 6),
            Text(
              'Guarda el título, el contenido, la prioridad, el color y la checklist. Las fechas, los tags y los responsables se eligen al usarla.',
              style: textTheme.bodySmall?.copyWith(color: colores.tintaTenue),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _nombre,
              autofocus: true,
              maxLength: 100,
              textCapitalization: TextCapitalization.sentences,
              textInputAction: TextInputAction.done,
              onFieldSubmitted: (_) => _guardando ? null : _guardar(),
              decoration: const InputDecoration(
                labelText: 'Nombre',
                hintText: 'Ej.: Release',
              ),
              validator: (v) {
                final limpio = v?.trim() ?? '';
                if (limpio.isEmpty) return 'El nombre es obligatorio';
                if (limpio.length > 100) return 'Máximo 100 caracteres';
                return null;
              },
            ),
            if (org != null) ...<Widget>[
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                initialValue: _destino,
                decoration: const InputDecoration(labelText: 'Guardar en'),
                items: <DropdownMenuItem<String>>[
                  const DropdownMenuItem<String>(
                    value: 'personal',
                    child: Text('Mis plantillas'),
                  ),
                  DropdownMenuItem<String>(
                    value: 'organizacion',
                    child: Text('${org.nombre} (para todos sus miembros)'),
                  ),
                ],
                onChanged: (v) {
                  if (v != null) setState(() => _destino = v);
                },
              ),
            ],
            const SizedBox(height: 20),
            FilledButton(
              onPressed: _guardando ? null : _guardar,
              child: _guardando
                  ? const SizedBox.square(
                      dimension: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Guardar plantilla'),
            ),
          ],
        ),
      ),
    );
  }
}
