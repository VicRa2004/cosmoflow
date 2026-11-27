import 'package:flutter/material.dart';

import '../../../core/theme/colores_noche_indigo.dart';
import '../../../core/widgets/avatar_usuario.dart';
import '../models/organizacion_models.dart';

/// Bottom sheet para elegir qué integrantes de un equipo con líder
/// pueden crear tareas (delegados).
class DelegadosSheet extends StatefulWidget {
  const DelegadosSheet({
    super.key,
    required this.equipo,
    required this.miembros,
  });

  final EquipoDto equipo;
  final List<MiembroDto> miembros;

  @override
  State<DelegadosSheet> createState() => _DelegadosSheetState();
}

class _DelegadosSheetState extends State<DelegadosSheet> {
  late final Set<int> _seleccionados;

  @override
  void initState() {
    super.initState();
    _seleccionados = widget.equipo.miembros
        .where(
          (m) => m.usuarioId != widget.equipo.liderId && m.puedeCrearTareas,
        )
        .map((m) => m.usuarioId)
        .toSet();
  }

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final colores = context.colores;
    final candidatos = widget.equipo.miembros
        .where((m) => m.usuarioId != widget.equipo.liderId)
        .toList(growable: false);

    return Padding(
      padding: EdgeInsets.fromLTRB(
        16,
        0,
        16,
        16 + MediaQuery.viewInsetsOf(context).bottom,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: <Widget>[
          Text('Delegados', style: textTheme.titleMedium),
          const SizedBox(height: 4),
          Text(
            'Elige qué miembros pueden crear tareas además del líder.',
            style: textTheme.bodySmall?.copyWith(color: colores.tintaTenue),
          ),
          const SizedBox(height: 12),
          if (candidatos.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 16),
              child: Text(
                'No hay otros integrantes en este equipo.',
                style: textTheme.bodyMedium?.copyWith(
                  color: colores.tintaSuave,
                ),
              ),
            )
          else
            Flexible(
              child: ListView.builder(
                shrinkWrap: true,
                itemCount: candidatos.length,
                itemBuilder: (context, index) {
                  final me = candidatos[index];
                  final miembro = widget.miembros
                      .where((x) => x.usuarioId == me.usuarioId)
                      .firstOrNull;
                  final nombre = miembro?.nombre ?? 'Usuario #${me.usuarioId}';
                  final activo = _seleccionados.contains(me.usuarioId);
                  return CheckboxListTile(
                    contentPadding: EdgeInsets.zero,
                    value: activo,
                    secondary: AvatarUsuario(
                      nombre: nombre,
                      avatarUrl: miembro?.avatarUrl,
                      tamano: 34,
                    ),
                    title: Text(nombre),
                    subtitle: miembro != null ? Text(miembro.email) : null,
                    onChanged: (v) {
                      setState(() {
                        if (v ?? false) {
                          _seleccionados.add(me.usuarioId);
                        } else {
                          _seleccionados.remove(me.usuarioId);
                        }
                      });
                    },
                  );
                },
              ),
            ),
          const SizedBox(height: 12),
          FilledButton(
            onPressed: () =>
                Navigator.of(context)
                    .pop(_seleccionados.toList(growable: false)),
            child: const Text('Guardar'),
          ),
        ],
      ),
    );
  }
}
