import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/colores_noche_indigo.dart';
import '../../../core/widgets/estados.dart';
import '../api/organizaciones_api.dart';
import '../models/organizacion_models.dart';
import '../widgets/selector_color.dart';

/// Vista `/organizaciones`: lista de organizaciones del usuario para entrar a una.
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
        child: const Icon(Icons.add_rounded),
      ),
      body: RefreshIndicator(
        onRefresh: _cargar,
        child: ListView(
          padding: const EdgeInsets.only(bottom: 88),
          children: <Widget>[
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
              child: SearchBar(
                controller: _busqueda,
                hintText: 'Filtrar por nombre',
                leading: const Icon(Icons.search_rounded),
                elevation: const WidgetStatePropertyAll<double>(0),
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
                icono: Icons.workspaces_outlined,
                titulo: 'Sin organizaciones',
                mensaje: 'Crea una organización o espera una invitación para colaborar.',
              )
            else
              for (final org in _organizaciones) ...<Widget>[
                _OrganizacionFila(
                  organizacion: org,
                  colorAvatar: parsearColorHex(org.color),
                  colores: colores,
                  onTap: () => _abrir(org),
                ),
                const Divider(indent: 72),
              ],
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
    final inicial = organizacion.nombre.trim().isNotEmpty
        ? organizacion.nombre.trim()[0].toUpperCase()
        : 'O';
    final rol = organizacion.isAdmin ? 'Admin' : 'Miembro';
    final desc = organizacion.descripcion.trim();
    final subtitulo = desc.isEmpty ? rol : '$rol · $desc';

    return ListTile(
      onTap: onTap,
      leading: CircleAvatar(
        backgroundColor: colorAvatar ?? colores.elevada,
        foregroundColor: colorAvatar != null
            ? Colors.white
            : colores.tintaSuave,
        child: Text(inicial),
      ),
      title: Text(
        organizacion.nombre,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      ),
      subtitle: Text(subtitulo, maxLines: 1, overflow: TextOverflow.ellipsis),
      trailing: const Icon(Icons.chevron_right_rounded),
    );
  }
}
