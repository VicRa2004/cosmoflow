import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../../core/theme/colores_noche_indigo.dart';
import '../../../core/widgets/tarjeta_seccion.dart';
import '../../organizaciones/api/organizaciones_api.dart';
import '../../organizaciones/models/organizacion_models.dart';
import '../../organizaciones/services/contexto_organizacion_cache.dart';

/// Destino elegido al crear una tarea desde Pendientes o Tareas.
/// Si [organizacionId] es `null`, la tarea es personal.
class DestinoNuevaTarea {
  const DestinoNuevaTarea({
    this.organizacionId,
    this.equipoId,
    this.proyectoId,
    this.ubicacion,
  });

  final int? organizacionId;
  final int? equipoId;
  final int? proyectoId;
  final UbicacionTarea? ubicacion;

  bool get esPersonal => organizacionId == null;
}

class _GrupoOrganizacion {
  const _GrupoOrganizacion({
    required this.organizacion,
    required this.equipos,
    required this.proyectos,
  });

  final OrganizacionDto organizacion;
  final List<EquipoDto> equipos;
  final List<ProyectoDto> proyectos;
}

/// Abre un bottom sheet para elegir dónde crear la nueva tarea:
/// personal, organización, equipo (RN-22) o proyecto (RN-23), en paridad con
/// `MenuNuevo` de la web.
Future<DestinoNuevaTarea?> mostrarSelectorDestinoTarea(
  BuildContext context, {
  required OrganizacionesApi organizacionesApi,
  required int? usuarioId,
  int limiteOrganizaciones = 10,
}) {
  return showModalBottomSheet<DestinoNuevaTarea>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    useSafeArea: true,
    builder: (_) => SelectorDestinoTareaSheet(
      organizacionesApi: organizacionesApi,
      usuarioId: usuarioId,
      limiteOrganizaciones: limiteOrganizaciones,
    ),
  );
}

/// Selector de destino al crear una tarea (paridad con `MenuNuevo.tsx` en web).
class SelectorDestinoTareaSheet extends StatefulWidget {
  const SelectorDestinoTareaSheet({
    super.key,
    required this.organizacionesApi,
    required this.usuarioId,
    this.limiteOrganizaciones = 10,
  });

  final OrganizacionesApi organizacionesApi;
  final int? usuarioId;
  final int limiteOrganizaciones;

  @override
  State<SelectorDestinoTareaSheet> createState() =>
      _SelectorDestinoTareaSheetState();
}

class _SelectorDestinoTareaSheetState extends State<SelectorDestinoTareaSheet> {
  List<_GrupoOrganizacion> _grupos = const <_GrupoOrganizacion>[];
  bool _cargando = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _cargar();
  }

  Future<void> _cargar() async {
    setState(() {
      _cargando = true;
      _error = null;
    });
    try {
      final pagina = await widget.organizacionesApi.obtenerTodas(
        pagina: 1,
        limite: widget.limiteOrganizaciones,
        orden: 'recientes',
      );
      final yo = widget.usuarioId;
      final grupos = await Future.wait(
        pagina.datos.map((org) async {
          final res = await Future.wait<dynamic>(<Future<dynamic>>[
            widget.organizacionesApi
                .obtenerEquipos(org.id)
                .catchError((_) => const <EquipoDto>[]),
            widget.organizacionesApi
                .obtenerProyectos(org.id)
                .catchError((_) => const <ProyectoDto>[]),
          ]);
          final todosEquipos = res[0] as List<EquipoDto>;
          final todosProyectos = res[1] as List<ProyectoDto>;

          // RN-23: equipos donde soy miembro.
          final misEquipos = todosEquipos
              .where((e) => e.miembros.any((m) => m.usuarioId == yo))
              .toList(growable: false);
          final miembroDe = misEquipos.map((e) => e.id).toSet();

          // RN-22: equipos donde puedo crear tareas.
          final equiposCreables = misEquipos
              .where((e) => e.puedeCrearTareas(yo))
              .toList(growable: false);

          // RN-23: proyectos donde soy integrante directo o de uno de sus equipos.
          final misProyectos = todosProyectos
              .where(
                (p) =>
                    (yo != null && p.integranteIds.contains(yo)) ||
                    p.equipoIds.any(miembroDe.contains),
              )
              .toList(growable: false);

          return _GrupoOrganizacion(
            organizacion: org,
            equipos: equiposCreables,
            proyectos: misProyectos,
          );
        }),
      );
      if (mounted) {
        setState(() {
          _grupos = grupos;
          _cargando = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _cargando = false;
          _error = 'No se pudieron cargar tus organizaciones.';
        });
      }
    }
  }

  void _elegir(DestinoNuevaTarea destino) {
    Navigator.of(context).pop(destino);
  }

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final textTheme = Theme.of(context).textTheme;
    final maxAltura = MediaQuery.sizeOf(context).height * 0.72;

    return ConstrainedBox(
      constraints: BoxConstraints(maxHeight: maxAltura),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: <Widget>[
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
            child: Text('¿Dónde crear la tarea?', style: textTheme.titleMedium),
          ),
          Flexible(
            child: ListView(
              shrinkWrap: true,
              padding: const EdgeInsets.fromLTRB(0, 0, 0, 24),
              children: <Widget>[
                _CabeceraSeccion(titulo: 'Personal'),
                _OpcionDestino(
                  icono: LucideIcons.listTodo,
                  titulo: 'Tarea personal',
                  colorIcono: colores.indigoMarca,
                  fondoIcono: colores.indigoSuave,
                  onTap: () => _elegir(const DestinoNuevaTarea()),
                ),
                if (_cargando)
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 20),
                    child: Center(
                      child: SizedBox.square(
                        dimension: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      ),
                    ),
                  )
                else if (_error != null)
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                    child: Row(
                      children: <Widget>[
                        Expanded(
                          child: Text(
                            _error!,
                            style: textTheme.bodySmall?.copyWith(
                              color: colores.tintaTenue,
                            ),
                          ),
                        ),
                        TextButton(
                          onPressed: _cargar,
                          child: const Text('Reintentar'),
                        ),
                      ],
                    ),
                  )
                else
                  for (final grupo in _grupos) ...<Widget>[
                    const Divider(height: 16),
                    _CabeceraSeccion(titulo: grupo.organizacion.nombre),
                    _OpcionDestino(
                      icono: LucideIcons.building2,
                      titulo: 'Tarea de la organización',
                      onTap: () => _elegir(
                        DestinoNuevaTarea(
                          organizacionId: grupo.organizacion.id,
                          ubicacion: UbicacionTarea(
                            organizacionId: grupo.organizacion.id,
                            organizacionNombre: grupo.organizacion.nombre,
                          ),
                        ),
                      ),
                    ),
                    for (final equipo in grupo.equipos)
                      _OpcionDestino(
                        icono: LucideIcons.users,
                        titulo: 'Tarea en ${equipo.nombre}',
                        subtitulo: 'Equipo',
                        onTap: () => _elegir(
                          DestinoNuevaTarea(
                            organizacionId: grupo.organizacion.id,
                            equipoId: equipo.id,
                            ubicacion: UbicacionTarea(
                              organizacionId: grupo.organizacion.id,
                              organizacionNombre: grupo.organizacion.nombre,
                              equipoId: equipo.id,
                              equipoNombre: equipo.nombre,
                            ),
                          ),
                        ),
                      ),
                    for (final proyecto in grupo.proyectos)
                      _OpcionDestino(
                        icono: LucideIcons.folderKanban,
                        titulo: 'Tarea en ${proyecto.nombre}',
                        subtitulo: 'Proyecto',
                        onTap: () => _elegir(
                          DestinoNuevaTarea(
                            organizacionId: grupo.organizacion.id,
                            proyectoId: proyecto.id,
                            ubicacion: UbicacionTarea(
                              organizacionId: grupo.organizacion.id,
                              organizacionNombre: grupo.organizacion.nombre,
                              proyectoId: proyecto.id,
                              proyectoNombre: proyecto.nombre,
                            ),
                          ),
                        ),
                      ),
                  ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _CabeceraSeccion extends StatelessWidget {
  const _CabeceraSeccion({required this.titulo});

  final String titulo;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 4),
      child: Text(
        titulo,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: Theme.of(context).textTheme.labelMedium?.copyWith(
          color: context.colores.tintaTenue,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

class _OpcionDestino extends StatelessWidget {
  const _OpcionDestino({
    required this.icono,
    required this.titulo,
    required this.onTap,
    this.subtitulo,
    this.colorIcono,
    this.fondoIcono,
  });

  final IconData icono;
  final String titulo;
  final String? subtitulo;
  final Color? colorIcono;
  final Color? fondoIcono;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      dense: true,
      leading: IconoCaja(
        icono: icono,
        color: colorIcono,
        fondo: fondoIcono,
        dimension: 34,
        tamanoIcono: 17,
      ),
      title: Text(titulo, maxLines: 1, overflow: TextOverflow.ellipsis),
      subtitle: subtitulo != null ? Text(subtitulo!) : null,
      onTap: onTap,
    );
  }
}
