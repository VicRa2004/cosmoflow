import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../../core/theme/colores_noche_indigo.dart';
import '../../../core/theme/tema_app.dart';
import '../../../core/widgets/estados.dart';
import '../../../core/widgets/tarjeta_seccion.dart';
import '../../tags/models/tag_model.dart';
import '../models/organizacion_models.dart';
import 'organizacion_card.dart';
import 'selector_color.dart';

/// Pestaña de proyectos de una organización en tarjetas modernas con barra de avance.
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
          : FloatingActionButton.extended(
              heroTag: 'fab-proyectos-org',
              onPressed: widget.onCrearProyecto,
              icon: const Icon(LucideIcons.plus, size: 20),
              label: const Text('Nuevo proyecto'),
            ),
      body: RefreshIndicator(
        onRefresh: widget.onRefresh,
        child: ListView(
          padding: const EdgeInsets.only(bottom: 104),
          children: <Widget>[
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 14),
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
              for (final p in filtrados) ...<Widget>[
                _ProyectoCard(
                  proyecto: p,
                  colores: colores,
                  onTap: () => widget.onAbrirProyecto(p),
                ),
                const SizedBox(height: 12),
              ],
          ],
        ),
      ),
    );
  }
}

class _ProyectoCard extends StatelessWidget {
  const _ProyectoCard({
    required this.proyecto,
    required this.colores,
    required this.onTap,
  });

  final ProyectoDto proyecto;
  final ColoresNocheIndigo colores;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final esOscuro = Theme.of(context).brightness == Brightness.dark;
    final color = parsearColorHex(proyecto.color) ?? colores.indigoMarca;
    final progreso = proyecto.progreso;
    final porcentaje = progreso.tareas > 0
        ? progreso.completadas / progreso.tareas
        : null;
    final desc = proyecto.descripcion.trim();
    final (colorEstado, fondoEstado) = switch (proyecto.estado) {
      EstadoProyecto.activo => (colores.emeraldExito, colores.emeraldSuave),
      EstadoProyecto.enPausa => (colores.amberAviso, colores.amberSuave),
      EstadoProyecto.terminado => (colores.indigoMarca, colores.indigoSuave),
    };

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: TemaApp.margenPantalla),
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: colores.superficie,
          borderRadius: BorderRadius.circular(TemaApp.radioDialogo),
          border: Border.all(color: colores.borde, width: 1),
          boxShadow: esOscuro
              ? null
              : <BoxShadow>[
                  BoxShadow(
                    color: colores.indigoMarca.withValues(alpha: 0.05),
                    blurRadius: 16,
                    offset: const Offset(0, 6),
                  ),
                ],
        ),
        child: Material(
          color: Colors.transparent,
          borderRadius: BorderRadius.circular(TemaApp.radioDialogo),
          clipBehavior: Clip.antiAlias,
          child: InkWell(
            onTap: onTap,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Row(
                    children: <Widget>[
                      AvatarDegradadoCirculo(
                        nombre: proyecto.nombre,
                        colorBase: color,
                        tamano: 44,
                        icono: LucideIcons.folderKanban,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: <Widget>[
                            Text(
                              proyecto.nombre,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            if (desc.isNotEmpty) ...<Widget>[
                              const SizedBox(height: 2),
                              Text(
                                desc,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: textTheme.bodySmall,
                              ),
                            ],
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      InsigniaPill(
                        texto: proyecto.estado.etiqueta,
                        colorTexto: colorEstado,
                        colorFondo: fondoEstado,
                      ),
                    ],
                  ),
                  if (porcentaje != null) ...<Widget>[
                    const SizedBox(height: 14),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: <Widget>[
                        Text(
                          '${progreso.completadas} de ${progreso.tareas} tareas',
                          style: textTheme.bodySmall?.copyWith(
                            color: colores.tintaTenue,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        Text(
                          '${(porcentaje * 100).round()} %',
                          style: textTheme.labelMedium?.copyWith(
                            color: color,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(
                        TemaApp.radioCompleto,
                      ),
                      child: LinearProgressIndicator(
                        value: porcentaje,
                        minHeight: 6,
                        backgroundColor: colores.elevada,
                        color: color,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Pestaña de equipos de una organización en tarjetas modernas con avatares apilados.
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
          : FloatingActionButton.extended(
              heroTag: 'fab-equipos-org',
              onPressed: widget.onCrearEquipo,
              icon: const Icon(LucideIcons.plus, size: 20),
              label: const Text('Nuevo equipo'),
            ),
      body: RefreshIndicator(
        onRefresh: widget.onRefresh,
        child: ListView(
          padding: const EdgeInsets.only(bottom: 104),
          children: <Widget>[
            if (widget.tags.isNotEmpty)
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 14),
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
                        label: Text('#${tag.nombre}'),
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
              for (final eq in filtrados) ...<Widget>[
                _EquipoCard(
                  equipo: eq,
                  miembrosOrg: widget.miembros,
                  colores: colores,
                  onTap: () => widget.onAbrirEquipo(eq),
                ),
                const SizedBox(height: 12),
              ],
          ],
        ),
      ),
    );
  }
}

class _EquipoCard extends StatelessWidget {
  const _EquipoCard({
    required this.equipo,
    required this.miembrosOrg,
    required this.colores,
    required this.onTap,
  });

  final EquipoDto equipo;
  final List<MiembroDto> miembrosOrg;
  final ColoresNocheIndigo colores;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final esOscuro = Theme.of(context).brightness == Brightness.dark;
    final colorBase = parsearColorHex(equipo.color) ?? colores.indigoMarca;
    final desc = equipo.descripcion.trim();
    final idsEquipo = equipo.miembros.map((m) => m.usuarioId).toSet();
    final miembrosEquipo = miembrosOrg
        .where((m) => idsEquipo.contains(m.usuarioId))
        .toList(growable: false);
    final lider = equipo.liderId == null
        ? null
        : miembrosOrg.where((m) => m.usuarioId == equipo.liderId).firstOrNull;
    final total = equipo.miembros.length;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: TemaApp.margenPantalla),
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: colores.superficie,
          borderRadius: BorderRadius.circular(TemaApp.radioDialogo),
          border: Border.all(color: colores.borde, width: 1),
          boxShadow: esOscuro
              ? null
              : <BoxShadow>[
                  BoxShadow(
                    color: colores.indigoMarca.withValues(alpha: 0.05),
                    blurRadius: 16,
                    offset: const Offset(0, 6),
                  ),
                ],
        ),
        child: Material(
          color: Colors.transparent,
          borderRadius: BorderRadius.circular(TemaApp.radioDialogo),
          clipBehavior: Clip.antiAlias,
          child: InkWell(
            onTap: onTap,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Row(
                    children: <Widget>[
                      AvatarDegradadoCirculo(
                        nombre: equipo.nombre,
                        avatarUrl: equipo.avatarUrl,
                        colorBase: colorBase,
                        tamano: 44,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: <Widget>[
                            Text(
                              equipo.nombre,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            if (desc.isNotEmpty) ...<Widget>[
                              const SizedBox(height: 2),
                              Text(
                                desc,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: textTheme.bodySmall,
                              ),
                            ],
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      Icon(
                        LucideIcons.chevronRight,
                        size: 18,
                        color: colores.tintaTenue,
                      ),
                    ],
                  ),
                  if (total > 0 || lider != null) ...<Widget>[
                    const SizedBox(height: 14),
                    Row(
                      children: <Widget>[
                        if (miembrosEquipo.isNotEmpty) ...<Widget>[
                          AvataresApiladosMiembros(miembros: miembrosEquipo),
                          const SizedBox(width: 10),
                        ],
                        Expanded(
                          child: Text(
                            '$total ${total == 1 ? 'integrante' : 'integrantes'}',
                            style: textTheme.bodySmall?.copyWith(
                              color: colores.tintaTenue,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                        if (lider != null)
                          InsigniaPill(
                            texto: lider.nombre,
                            icono: LucideIcons.crown,
                            colorTexto: colores.indigoMarca,
                            colorFondo: colores.indigoSuave,
                          ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
