import 'dart:async';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../../core/theme/colores_noche_indigo.dart';
import '../../../core/widgets/estados.dart';
import '../api/organizaciones_api.dart';
import '../models/organizacion_models.dart';
import '../widgets/organizacion_card.dart';

/// Vista `/organizaciones`: cabecera limpia con búsqueda desplegable, tarjetas
/// con avatares y conteo de miembros, y FAB único «Nueva Org».
class OrganizacionesPage extends StatefulWidget {
  const OrganizacionesPage({
    super.key,
    required this.organizacionesApi,
    this.cargarAlIniciar = true,
  });

  final OrganizacionesApi organizacionesApi;
  final bool cargarAlIniciar;

  @override
  State<OrganizacionesPage> createState() => _OrganizacionesPageState();
}

class _OrganizacionesPageState extends State<OrganizacionesPage> {
  final TextEditingController _busqueda = TextEditingController();
  final FocusNode _focoBusqueda = FocusNode();
  List<OrganizacionDto> _organizaciones = const <OrganizacionDto>[];
  Map<int, List<MiembroDto>> _miembrosPorOrg = const <int, List<MiembroDto>>{};
  bool _mostrarBuscador = false;
  bool _isCargando = false;
  String? _mensajeError;

  List<OrganizacionDto> get _filtradas {
    final q = _busqueda.text.trim().toLowerCase();
    if (q.isEmpty) return _organizaciones;
    return _organizaciones
        .where(
          (o) =>
              o.nombre.toLowerCase().contains(q) ||
              o.descripcion.toLowerCase().contains(q),
        )
        .toList(growable: false);
  }

  @override
  void initState() {
    super.initState();
    if (widget.cargarAlIniciar) _cargar();
  }

  @override
  void dispose() {
    _busqueda.dispose();
    _focoBusqueda.dispose();
    super.dispose();
  }

  Future<void> _crear() async {
    final creado = await context.push<bool>('/organizaciones/nueva');
    if (creado == true && mounted) await _cargar();
  }

  Future<void> _abrir(OrganizacionDto org) async {
    await context.push<bool>('/organizaciones/${org.id}', extra: org);
    if (mounted) await _cargar();
  }

  Future<void> _abrirAjustes(OrganizacionDto org) async {
    final editado = await context.push<bool>(
      '/organizaciones/${org.id}/editar',
      extra: org,
    );
    if (editado == true && mounted) await _cargar();
  }

  Future<void> _cargar() async {
    setState(() {
      _isCargando = _organizaciones.isEmpty;
      _mensajeError = null;
    });
    try {
      final pagina = await widget.organizacionesApi.obtenerTodas();
      if (!mounted) return;
      setState(() => _organizaciones = pagina.datos);
      unawaited(_cargarMiembros(pagina.datos));
    } catch (_) {
      if (mounted) {
        setState(
          () => _mensajeError = 'No se pudieron cargar las organizaciones.',
        );
      }
    } finally {
      if (mounted) setState(() => _isCargando = false);
    }
  }

  Future<void> _cargarMiembros(List<OrganizacionDto> orgs) async {
    if (orgs.isEmpty) return;
    final entradas = await Future.wait(
      orgs.map((org) async {
        final lista = await widget.organizacionesApi
            .obtenerMiembros(org.id)
            .catchError((_) => const <MiembroDto>[]);
        return MapEntry<int, List<MiembroDto>>(org.id, lista);
      }),
    );
    if (!mounted) return;
    setState(() {
      _miembrosPorOrg = <int, List<MiembroDto>>{
        ..._miembrosPorOrg,
        for (final e in entradas) e.key: e.value,
      };
    });
  }

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Organizaciones'),
        actions: <Widget>[
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: Material(
              color: _mostrarBuscador
                  ? colores.indigoSuave
                  : colores.superficie,
              shape: CircleBorder(
                side: BorderSide(
                  color: _mostrarBuscador
                      ? colores.indigoMarca.withValues(alpha: 0.35)
                      : colores.borde,
                  width: 1,
                ),
              ),
              clipBehavior: Clip.antiAlias,
              child: IconButton(
                tooltip: _mostrarBuscador ? 'Cerrar búsqueda' : 'Buscar',
                visualDensity: VisualDensity.compact,
                onPressed: () {
                  setState(() {
                    _mostrarBuscador = !_mostrarBuscador;
                    if (_mostrarBuscador) {
                      _focoBusqueda.requestFocus();
                    } else {
                      _focoBusqueda.unfocus();
                      _busqueda.clear();
                    }
                  });
                },
                icon: Icon(
                  _mostrarBuscador ? LucideIcons.x : LucideIcons.search,
                  size: 19,
                  color: _mostrarBuscador
                      ? colores.indigoMarca
                      : colores.tintaSuave,
                ),
              ),
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        heroTag: 'fab-organizaciones',
        onPressed: _crear,
        icon: const Icon(LucideIcons.plus, size: 20),
        label: const Text('Nueva Org'),
      ),
      body: RefreshIndicator(
        onRefresh: _cargar,
        child: ListView(
          padding: const EdgeInsets.only(top: 8, bottom: 104),
          children: <Widget>[
            AnimatedSize(
              duration: const Duration(milliseconds: 220),
              curve: Curves.easeOutCubic,
              child: _mostrarBuscador
                  ? Padding(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 14),
                      child: SearchBar(
                        controller: _busqueda,
                        focusNode: _focoBusqueda,
                        hintText: 'Filtrar por nombre',
                        leading: Icon(
                          LucideIcons.search,
                          size: 18,
                          color: colores.tintaTenue,
                        ),
                        trailing: _busqueda.text.isNotEmpty
                            ? <Widget>[
                                IconButton(
                                  tooltip: 'Limpiar',
                                  icon: const Icon(LucideIcons.x, size: 16),
                                  onPressed: () =>
                                      setState(() => _busqueda.clear()),
                                ),
                              ]
                            : null,
                        textInputAction: TextInputAction.search,
                        onChanged: (_) => setState(() {}),
                      ),
                    )
                  : const SizedBox.shrink(),
            ),
            if (_isCargando)
              const EstadoCargando()
            else if (_mensajeError != null)
              EstadoError(mensaje: _mensajeError!, onReintentar: _cargar)
            else if (_organizaciones.isEmpty)
              const EstadoVacio(
                icono: LucideIcons.building2,
                titulo: 'Sin organizaciones',
                mensaje: 'Crea una organización o espera una invitación para colaborar.',
              )
            else if (_filtradas.isEmpty)
              const EstadoVacio(
                icono: LucideIcons.search,
                titulo: 'Sin resultados',
                mensaje: 'Ninguna organización coincide con tu búsqueda.',
              )
            else
              for (final org in _filtradas) ...<Widget>[
                OrganizacionCard(
                  organizacion: org,
                  miembros: _miembrosPorOrg[org.id] ?? const <MiembroDto>[],
                  onTap: () => _abrir(org),
                  onAjustes: org.isAdmin ? () => _abrirAjustes(org) : null,
                ),
                const SizedBox(height: 14),
              ],
          ],
        ),
      ),
    );
  }
}
