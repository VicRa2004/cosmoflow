import 'package:flutter/material.dart';

import '../models/plantilla_model.dart';

/// Selector «Desde plantilla» al crear una tarea nueva.
class SelectorPlantilla extends StatelessWidget {
  const SelectorPlantilla({
    super.key,
    required this.personales,
    required this.deOrganizacion,
    this.seleccionadaId,
    required this.onElegir,
  });

  final List<PlantillaTareaDto> personales;
  final List<PlantillaTareaDto> deOrganizacion;
  final int? seleccionadaId;
  final ValueChanged<PlantillaTareaDto?> onElegir;

  @override
  Widget build(BuildContext context) {
    if (personales.isEmpty && deOrganizacion.isEmpty) {
      return const SizedBox.shrink();
    }
    final mostrarAmbito = personales.isNotEmpty && deOrganizacion.isNotEmpty;
    final todas = <PlantillaTareaDto>[...deOrganizacion, ...personales];

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: DropdownButtonFormField<int?>(
        initialValue: seleccionadaId,
        isExpanded: true,
        decoration: const InputDecoration(labelText: 'Desde plantilla'),
        items: <DropdownMenuItem<int?>>[
          const DropdownMenuItem<int?>(value: null, child: Text('En blanco')),
          for (final p in deOrganizacion)
            DropdownMenuItem<int?>(
              value: p.id,
              child: Text(
                mostrarAmbito ? '${p.nombre} · Organización' : p.nombre,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          for (final p in personales)
            DropdownMenuItem<int?>(
              value: p.id,
              child: Text(
                mostrarAmbito ? '${p.nombre} · Mía' : p.nombre,
                overflow: TextOverflow.ellipsis,
              ),
            ),
        ],
        onChanged: (id) {
          if (id == null) {
            onElegir(null);
            return;
          }
          final elegida = todas.where((p) => p.id == id).firstOrNull;
          onElegir(elegida);
        },
      ),
    );
  }
}
