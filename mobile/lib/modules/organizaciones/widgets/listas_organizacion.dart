import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../../core/theme/colores_noche_indigo.dart';
import '../../../core/theme/tema_app.dart';
import '../../../core/widgets/avatar_usuario.dart';
import '../../../core/widgets/estados.dart';
import '../../../core/widgets/tarjeta_seccion.dart';
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
              child: const Icon(LucideIcons.plus),
            ),
      body: RefreshIndicator(
        onRefresh: widget.onRefresh,
        child: ListView(
          padding: const EdgeInsets.only(bottom: 104),
          children: <Widget>[
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
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
                icono: LucideIcons.folderKanban,
                titulo: 'Sin proyectos',
                mensaje: 'No hay proyectos que coincidan con el filtro.',
              )
            else
              TarjetaSeccion(
                divisorIndent: 64,
                children: <Widget>[
                  for (final p in filtrados)
                    _ProyectoFila(
                      proyecto: p,
                      colores: colores,
                      onTap: () => widget.onAbrirProyecto(p),
                    ),
                ],
              ),
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
      leading: IconoCaja(
        icono: LucideIcons.folder,
        color: color,
        fondo: color.withValues(alpha: 0.12),
        dimension: 38,
        tamanoIcono: 18,
      ),
      title: Text(
        proyecto.nombre,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      ),
      subtitle: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          const SizedBox(height: 2),
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
              borderRadius: BorderRadius.circular(TemaApp.radioCompleto),
              child: LinearProgressIndicator(
                value: porcentaje,
                minHeight: 5,
                backgroundColor: colores.elevada,
                color: color,
              ),
            ),
          ],
        ],
      ),
      trailing: Icon(
        LucideIcons.chevronRight,
        size: 16,
        color: colores.tintaTenue,
      ),
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
              child: const Icon(LucideIcons.plus),
            ),
      body: RefreshIndicator(
        onRefresh: widget.onRefresh,
        child: ListView(
          padding: const EdgeInsets.only(bottom: 104),
          children: <Widget>[
            if (widget.tags.isNotEmpty)
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
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
              const SizedBox(height: 12),
            if (filtrados.isEmpty)
              const EstadoVacio(
                icono: LucideIcons.users,
                titulo: 'Sin equipos',
                mensaje: 'No hay equipos en esta organización.',
              )
            else
              TarjetaSeccion(
                divisorIndent: 68,
                children: <Widget>[
                  for (final eq in filtrados)
                    _EquipoFila(
                      equipo: eq,
                      miembros: widget.miembros,
                      colores: colores,
                      onTap: () => widget.onAbrirEquipo(eq),
                    ),
                ],
              ),
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
      leading: AvatarUsuario(
        nombre: equipo.nombre,
        avatarUrl: equipo.avatarUrl,
        tamano: 38,
        radio: TemaApp.radioChip,
        colorFondo: colorAvatar ?? colores.indigoSuave,
        colorTexto: colorAvatar != null
            ? colores.sobreAcento
            : colores.indigoMarca,
      ),
      title: Text(equipo.nombre, maxLines: 1, overflow: TextOverflow.ellipsis),
      subtitle: Text(subtitulo, maxLines: 1, overflow: TextOverflow.ellipsis),
      trailing: Icon(
        LucideIcons.chevronRight,
        size: 16,
        color: colores.tintaTenue,
      ),
    );
  }
}
