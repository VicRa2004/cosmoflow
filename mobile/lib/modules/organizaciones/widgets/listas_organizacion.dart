import 'package:flutter/material.dart';

import '../../../core/theme/colores_noche_indigo.dart';
import '../../../core/widgets/estados.dart';
import '../../tags/models/tag_model.dart';
import '../models/organizacion_models.dart';
import 'selector_color.dart';

/// Pestaña de proyectos de una organización con filtro por estado.
class ListaProyectosOrganizacion extends StatefulWidget {
  const ListaProyectosOrganizacion({
    super.key,
    required this.proyectos,
    required this.onRefresh,
    required this.onAbrirProyecto,
    this.onCrearProyecto,
  });

  final List<ProyectoDto> proyectos;
  final Future<void> Function() onRefresh;
  final ValueChanged<ProyectoDto> onAbrirProyecto;
  final VoidCallback? onCrearProyecto;

  @override
  State<ListaProyectosOrganizacion> createState() =>
      _ListaProyectosOrganizacionState();
}

class _ListaProyectosOrganizacionState
    extends State<ListaProyectosOrganizacion> {
  EstadoProyecto? _filtroEstado;

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final filtrados = _filtroEstado == null
        ? widget.proyectos
        : widget.proyectos
              .where((p) => p.estado == _filtroEstado)
              .toList(growable: false);

    return Scaffold(
      floatingActionButton: widget.onCrearProyecto == null
          ? null
          : FloatingActionButton(
              tooltip: 'Nuevo proyecto',
              onPressed: widget.onCrearProyecto,
              child: const Icon(Icons.add_rounded),
            ),
      body: RefreshIndicator(
        onRefresh: widget.onRefresh,
        child: ListView(
          padding: const EdgeInsets.only(bottom: 88),
          children: <Widget>[
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
              child: Row(
                spacing: 8,
                children: <Widget>[
                  ChoiceChip(
                    label: const Text('Todos'),
                    selected: _filtroEstado == null,
                    onSelected: (_) => setState(() => _filtroEstado = null),
                  ),
                  for (final estado in EstadoProyecto.values)
                    ChoiceChip(
                      label: Text(estado.etiqueta),
                      selected: _filtroEstado == estado,
                      onSelected: (sel) =>
                          setState(() => _filtroEstado = sel ? estado : null),
                    ),
                ],
              ),
            ),
            if (filtrados.isEmpty)
              const EstadoVacio(
                icono: Icons.folder_copy_outlined,
                titulo: 'Sin proyectos',
                mensaje: 'No hay proyectos que coincidan con el filtro.',
              )
            else
              for (final p in filtrados) ...<Widget>[
                _ProyectoFila(
                  proyecto: p,
                  colores: colores,
                  onTap: () => widget.onAbrirProyecto(p),
                ),
                const Divider(indent: 56),
              ],
          ],
        ),
      ),
    );
  }
}

class _ProyectoFila extends StatelessWidget {
  const _ProyectoFila({
    required this.proyecto,
    required this.colores,
    required this.onTap,
  });

  final ProyectoDto proyecto;
  final ColoresNocheIndigo colores;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final color = parsearColorHex(proyecto.color) ?? colores.indigoMarca;
    final progreso = proyecto.progreso;
    final porcentaje = progreso.tareas > 0
        ? progreso.completadas / progreso.tareas
        : null;

    return ListTile(
      onTap: onTap,
      leading: Icon(Icons.folder_outlined, color: color),
      title: Text(
        proyecto.nombre,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      ),
      subtitle: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text(
            <String>[
              proyecto.estado.etiqueta,
              '${progreso.completadas}/${progreso.tareas} tareas',
              if (proyecto.descripcion.trim().isNotEmpty)
                proyecto.descripcion.trim(),
            ].join(' · '),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          if (porcentaje != null) ...<Widget>[
            const SizedBox(height: 6),
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: porcentaje,
                minHeight: 4,
                backgroundColor: colores.elevada,
                color: color,
              ),
            ),
          ],
        ],
      ),
      trailing: const Icon(Icons.chevron_right_rounded),
    );
  }
}

/// Pestaña de equipos de una organización con filtro por tag.
class ListaEquiposOrganizacion extends StatefulWidget {
  const ListaEquiposOrganizacion({
    super.key,
    required this.equipos,
    required this.miembros,
    required this.tags,
    required this.onRefresh,
    required this.onAbrirEquipo,
    this.onCrearEquipo,
  });

  final List<EquipoDto> equipos;
  final List<MiembroDto> miembros;
  final List<TagDto> tags;
  final Future<void> Function() onRefresh;
  final ValueChanged<EquipoDto> onAbrirEquipo;
  final VoidCallback? onCrearEquipo;

  @override
  State<ListaEquiposOrganizacion> createState() =>
      _ListaEquiposOrganizacionState();
}

class _ListaEquiposOrganizacionState extends State<ListaEquiposOrganizacion> {
  int? _tagId;

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final filtrados = _tagId == null
        ? widget.equipos
        : widget.equipos
              .where((e) => e.tagIds.contains(_tagId))
              .toList(growable: false);

    return Scaffold(
      floatingActionButton: widget.onCrearEquipo == null
          ? null
          : FloatingActionButton(
              tooltip: 'Nuevo equipo',
              onPressed: widget.onCrearEquipo,
              child: const Icon(Icons.add_rounded),
            ),
      body: RefreshIndicator(
        onRefresh: widget.onRefresh,
        child: ListView(
          padding: const EdgeInsets.only(bottom: 88),
          children: <Widget>[
            if (widget.tags.isNotEmpty)
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                child: Row(
                  spacing: 8,
                  children: <Widget>[
                    ChoiceChip(
                      label: const Text('Todos'),
                      selected: _tagId == null,
                      onSelected: (_) => setState(() => _tagId = null),
                    ),
                    for (final tag in widget.tags)
                      ChoiceChip(
                        label: Text(tag.nombre),
                        selected: _tagId == tag.id,
                        onSelected: (sel) =>
                            setState(() => _tagId = sel ? tag.id : null),
                      ),
                  ],
                ),
              )
            else
              const SizedBox(height: 8),
            if (filtrados.isEmpty)
              const EstadoVacio(
                icono: Icons.groups_outlined,
                titulo: 'Sin equipos',
                mensaje: 'No hay equipos en esta organización.',
              )
            else
              for (final eq in filtrados) ...<Widget>[
                _EquipoFila(
                  equipo: eq,
                  miembros: widget.miembros,
                  colores: colores,
                  onTap: () => widget.onAbrirEquipo(eq),
                ),
                const Divider(indent: 72),
              ],
          ],
        ),
      ),
    );
  }
}

class _EquipoFila extends StatelessWidget {
  const _EquipoFila({
    required this.equipo,
    required this.miembros,
    required this.colores,
    required this.onTap,
  });

  final EquipoDto equipo;
  final List<MiembroDto> miembros;
  final ColoresNocheIndigo colores;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colorAvatar = parsearColorHex(equipo.color);
    final inicial = equipo.nombre.trim().isNotEmpty
        ? equipo.nombre.trim()[0].toUpperCase()
        : 'E';
    final lider = equipo.liderId == null
        ? null
        : miembros.where((m) => m.usuarioId == equipo.liderId).firstOrNull;
    final n = equipo.miembros.length;
    final subtitulo = <String>[
      '$n ${n == 1 ? 'integrante' : 'integrantes'}',
      if (lider != null) 'Líder: ${lider.nombre}',
      if (equipo.descripcion.trim().isNotEmpty) equipo.descripcion.trim(),
    ].join(' · ');

    return ListTile(
      onTap: onTap,
      leading: CircleAvatar(
        backgroundColor: colorAvatar ?? colores.elevada,
        foregroundColor: colorAvatar != null
            ? Colors.white
            : colores.tintaSuave,
        child: Text(inicial),
      ),
      title: Text(equipo.nombre, maxLines: 1, overflow: TextOverflow.ellipsis),
      subtitle: Text(subtitulo, maxLines: 1, overflow: TextOverflow.ellipsis),
      trailing: const Icon(Icons.chevron_right_rounded),
    );
  }
}
