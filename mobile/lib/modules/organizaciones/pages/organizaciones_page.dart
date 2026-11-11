import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/colores_noche_indigo.dart';
import '../../../core/widgets/estados.dart';
import '../api/organizaciones_api.dart';
import '../models/organizacion_models.dart';

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

  static Color? _parsearColorHex(String? hex) {
    if (hex == null || hex.isEmpty) return null;
    final limpio = hex.replaceFirst('#', '');
    if (limpio.length != 6) return null;
    final valor = int.tryParse('FF$limpio', radix: 16);
    return valor != null ? Color(valor) : null;
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
      body: RefreshIndicator(
        onRefresh: _cargar,
        child: ListView(
          padding: const EdgeInsets.only(bottom: 48),
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
                mensaje:
                    'Aquí aparecerán las organizaciones a las que pertenezcas.',
              )
            else
              for (final org in _organizaciones) ...<Widget>[
                _OrganizacionFila(
                  organizacion: org,
                  colorAvatar: _parsearColorHex(org.color),
                  colores: colores,
                  onTap: () =>
                      context.push('/organizaciones/${org.id}', extra: org),
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
