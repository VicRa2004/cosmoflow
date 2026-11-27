import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../../core/theme/colores_noche_indigo.dart';
import '../../../core/theme/tema_app.dart';
import '../../../core/widgets/avatar_usuario.dart';
import '../../../core/widgets/estados.dart';
import '../../../core/widgets/tarjeta_seccion.dart';
import '../api/organizaciones_api.dart';
import '../models/organizacion_models.dart';
import '../widgets/selector_color.dart';

/// Vista `/organizaciones`: lista de organizaciones del usuario en tarjeta agrupada.
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
  List<OrganizacionDto> _organizaciones = const <OrganizacionDto>[];
  bool _isCargando = false;
  String? _mensajeError;

  @override
  void initState() {
    super.initState();
    if (widget.cargarAlIniciar) _cargar();
  }

  @override
  void dispose() {
    _busqueda.dispose();
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

  Future<void> _cargar() async {
    setState(() {
      _isCargando = true;
      _mensajeError = null;
    });
    try {
      final pagina = await widget.organizacionesApi.obtenerTodas(
        nombre: _busqueda.text,
      );
      if (mounted) {
        setState(() => _organizaciones = pagina.datos);
      }
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

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    return Scaffold(
      appBar: AppBar(title: const Text('Organizaciones')),
      floatingActionButton: FloatingActionButton(
        tooltip: 'Nueva organización',
        onPressed: _crear,
        child: const Icon(LucideIcons.plus),
      ),
      body: RefreshIndicator(
        onRefresh: _cargar,
        child: ListView(
          padding: const EdgeInsets.only(bottom: 104),
          children: <Widget>[
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
              child: SearchBar(
                controller: _busqueda,
                hintText: 'Filtrar por nombre',
                leading: Icon(
                  LucideIcons.search,
                  size: 18,
                  color: colores.tintaTenue,
                ),
                textInputAction: TextInputAction.search,
                onSubmitted: (_) => _cargar(),
              ),
            ),
            if (_isCargando)
              const EstadoCargando()
            else if (_mensajeError != null)
              EstadoError(mensaje: _mensajeError!, onReintentar: _cargar)
            else if (_organizaciones.isEmpty)
              const EstadoVacio(
                icono: LucideIcons.building2,
                titulo: 'Sin organizaciones',
                mensaje:
                    'Crea una organización o espera una invitación para colaborar.',
              )
            else
              TarjetaSeccion(
                divisorIndent: 68,
                children: <Widget>[
                  for (final org in _organizaciones)
                    _OrganizacionFila(
                      organizacion: org,
                      colorAvatar: parsearColorHex(org.color),
                      colores: colores,
                      onTap: () => _abrir(org),
                    ),
                ],
              ),
          ],
        ),
      ),
    );
  }
}

class _OrganizacionFila extends StatelessWidget {
  const _OrganizacionFila({
    required this.organizacion,
    required this.colorAvatar,
    required this.colores,
    required this.onTap,
  });

  final OrganizacionDto organizacion;
  final Color? colorAvatar;
  final ColoresNocheIndigo colores;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final rol = organizacion.isAdmin ? 'Admin' : 'Miembro';
    final desc = organizacion.descripcion.trim();

    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        child: Row(
          children: <Widget>[
            AvatarUsuario(
              nombre: organizacion.nombre,
              avatarUrl: organizacion.avatarUrl,
              tamano: 40,
              radio: TemaApp.radioControl,
              colorFondo: colorAvatar ?? colores.indigoSuave,
              colorTexto: colorAvatar != null
                  ? colores.sobreAcento
                  : colores.indigoMarca,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Row(
                    children: <Widget>[
                      Flexible(
                        child: Text(
                          organizacion.nombre,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: textTheme.bodyLarge?.copyWith(
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      InsigniaPill(
                        texto: rol,
                        colorTexto: organizacion.isAdmin
                            ? colores.indigoMarca
                            : colores.tintaSuave,
                        colorFondo: organizacion.isAdmin
                            ? colores.indigoSuave
                            : colores.elevada,
                      ),
                    ],
                  ),
                  if (desc.isNotEmpty) ...<Widget>[
                    const SizedBox(height: 3),
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
              size: 16,
              color: colores.tintaTenue,
            ),
          ],
        ),
      ),
    );
  }
}
