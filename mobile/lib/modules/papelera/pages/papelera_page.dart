import 'package:flutter/material.dart';

import '../../../core/auth/sesion_store.dart';
import '../../../core/theme/colores_noche_indigo.dart';
import '../../../core/widgets/avisos.dart';
import '../../../core/widgets/confirmar.dart';
import '../../../core/widgets/estados.dart';
import '../api/papelera_api.dart';

/// `/papelera`: tareas y notas borradas con restaurar o borrado definitivo.
class PapeleraPage extends StatelessWidget {
  const PapeleraPage({
    super.key,
    required this.sesionStore,
    required this.papeleraApi,
    this.cargarAlIniciar = true,
  });

  final SesionStore sesionStore;
  final PapeleraApi papeleraApi;
  final bool cargarAlIniciar;

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Papelera'),
          bottom: const TabBar(
            tabs: <Tab>[
              Tab(text: 'Tareas'),
              Tab(text: 'Notas'),
            ],
          ),
        ),
        body: SafeArea(
          child: TabBarView(
            children: <Widget>[
              _ListaPapelera(
                tipo: TipoPapelera.tareas,
                papeleraApi: papeleraApi,
                puedeGestionar: sesionStore.puede('tareas:eliminar'),
                cargarAlIniciar: cargarAlIniciar,
              ),
              _ListaPapelera(
                tipo: TipoPapelera.notas,
                papeleraApi: papeleraApi,
                puedeGestionar: sesionStore.puede('notas:eliminar'),
                cargarAlIniciar: cargarAlIniciar,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ListaPapelera extends StatefulWidget {
  const _ListaPapelera({
    required this.tipo,
    required this.papeleraApi,
    required this.puedeGestionar,
    required this.cargarAlIniciar,
  });

  final TipoPapelera tipo;
  final PapeleraApi papeleraApi;
  final bool puedeGestionar;
  final bool cargarAlIniciar;

  @override
  State<_ListaPapelera> createState() => _ListaPapeleraState();
}

class _ListaPapeleraState extends State<_ListaPapelera>
    with AutomaticKeepAliveClientMixin {
  List<ElementoPapeleraDto> _datos = const <ElementoPapeleraDto>[];
  int _pagina = 1;
  int _totalPaginas = 1;
  bool _cargando = false;
  bool _cargandoMas = false;
  String? _error;

  @override
  bool get wantKeepAlive => true;

  @override
  void initState() {
    super.initState();
    if (widget.cargarAlIniciar) _cargar();
  }

  Future<void> _cargar({int pagina = 1, bool anexar = false}) async {
    setState(() {
      if (anexar) {
        _cargandoMas = true;
      } else {
        _cargando = _datos.isEmpty;
        _error = null;
      }
    });
    try {
      final res = await widget.papeleraApi.obtener(widget.tipo, pagina: pagina);
      if (!mounted) return;
      setState(() {
        _datos = anexar
            ? <ElementoPapeleraDto>[..._datos, ...res.datos]
            : res.datos;
        _pagina = res.pagina;
        _totalPaginas = res.totalPaginas;
      });
    } catch (_) {
      if (mounted && !anexar) {
        setState(
          () => _error =
              'No se pudo cargar la papelera de ${widget.tipo.segmento}.',
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _cargando = false;
          _cargandoMas = false;
        });
      }
    }
  }

  Future<void> _restaurar(ElementoPapeleraDto elemento) async {
    final ok = await ejecutarConAviso(
      context,
      () => widget.papeleraApi.restaurar(widget.tipo, elemento.id),
      error: 'No se pudo restaurar la ${widget.tipo.singular}.',
      exito: '«${elemento.titulo}» restaurada.',
    );
    if (ok && mounted) {
      setState(
        () => _datos = _datos.where((e) => e.id != elemento.id).toList(),
      );
    }
  }

  Future<void> _eliminarDefinitivo(ElementoPapeleraDto elemento) async {
    final confirmado = await confirmar(
      context,
      titulo: '¿Borrar la ${widget.tipo.singular} definitivamente?',
      mensaje:
          '«${elemento.titulo}» se borrará para siempre y no se podrá recuperar.',
      accion: 'Borrar definitivamente',
    );
    if (!confirmado || !mounted) return;
    final ok = await ejecutarConAviso(
      context,
      () => widget.papeleraApi.eliminarDefinitivo(widget.tipo, elemento.id),
      error: 'No se pudo eliminar definitivamente.',
      exito: 'Eliminada definitivamente.',
    );
    if (ok && mounted) {
      setState(
        () => _datos = _datos.where((e) => e.id != elemento.id).toList(),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    final colores = context.colores;
    final textTheme = Theme.of(context).textTheme;

    if (_cargando) return const EstadoCargando();
    if (_error != null) {
      return EstadoError(mensaje: _error!, onReintentar: _cargar);
    }
    if (_datos.isEmpty) {
      return RefreshIndicator(
        onRefresh: _cargar,
        child: ListView(
          children: <Widget>[
            const SizedBox(height: 64),
            EstadoVacio(
              icono: widget.tipo == TipoPapelera.tareas
                  ? Icons.task_alt_rounded
                  : Icons.sticky_note_2_outlined,
              titulo: 'No hay ${widget.tipo.segmento} en la papelera',
              mensaje: 'Lo que elimines queda aquí 30 días antes de borrarse para siempre.',
            ),
          ],
        ),
      );
    }

    final tieneMas = _pagina < _totalPaginas;
    return RefreshIndicator(
      onRefresh: _cargar,
      child: ListView.separated(
        padding: const EdgeInsets.only(bottom: 32),
        itemCount: _datos.length + 1 + (tieneMas ? 1 : 0),
        separatorBuilder: (_, index) => index == 0
            ? const Divider(height: 1)
            : const Divider(height: 1, indent: 56),
        itemBuilder: (context, index) {
          if (index == 0) {
            return Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
              child: Text(
                'Se borran definitivamente a los 30 días.',
                style: textTheme.bodySmall?.copyWith(color: colores.tintaTenue),
              ),
            );
          }
          final itemIndex = index - 1;
          if (itemIndex >= _datos.length) {
            return Padding(
              padding: const EdgeInsets.all(16),
              child: Center(
                child: OutlinedButton(
                  onPressed: _cargandoMas
                      ? null
                      : () => _cargar(pagina: _pagina + 1, anexar: true),
                  child: Text(_cargandoMas ? 'Cargando…' : 'Cargar más'),
                ),
              ),
            );
          }
          final elemento = _datos[itemIndex];
          return ListTile(
            leading: Icon(
              widget.tipo == TipoPapelera.tareas
                  ? Icons.task_alt_rounded
                  : Icons.sticky_note_2_outlined,
              color: colores.tintaTenue,
            ),
            title: Text(
              elemento.titulo,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            trailing: widget.puedeGestionar
                ? Row(
                    mainAxisSize: MainAxisSize.min,
                    children: <Widget>[
                      IconButton(
                        tooltip: 'Restaurar',
                        onPressed: () => _restaurar(elemento),
                        icon: const Icon(Icons.restore_rounded),
                      ),
                      IconButton(
                        tooltip: 'Borrar definitivamente',
                        color: colores.rosePeligro,
                        onPressed: () => _eliminarDefinitivo(elemento),
                        icon: const Icon(Icons.delete_forever_outlined),
                      ),
                    ],
                  )
                : null,
          );
        },
      ),
    );
  }
}
