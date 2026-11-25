import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../../core/auth/sesion_store.dart';
import '../../../core/theme/colores_noche_indigo.dart';
import '../../../core/widgets/avisos.dart';
import '../../../core/widgets/confirmar.dart';
import '../../../core/widgets/contenido_markdown.dart';
import '../../../core/widgets/estados.dart';
import '../../../core/widgets/tarjeta_seccion.dart';
import '../api/notas_api.dart';
import '../models/nota_model.dart';
import 'nota_editor_page.dart';

/// `/notas/:id`: lectura a pantalla completa agrupada en tarjeta limpia.
class NotaDetallePage extends StatefulWidget {
  const NotaDetallePage({
    super.key,
    required this.id,
    required this.sesionStore,
    required this.notasApi,
    this.args = const NotaEditorArgs(),
  });

  final int id;
  final SesionStore sesionStore;
  final NotasApi notasApi;
  final NotaEditorArgs args;

  @override
  State<NotaDetallePage> createState() => _NotaDetallePageState();
}

class _NotaDetallePageState extends State<NotaDetallePage> {
  late NotaDto? _nota = widget.args.nota;
  String? _mensajeError;

  @override
  void initState() {
    super.initState();
    _cargar();
  }

  Future<void> _cargar() async {
    try {
      final nota = await widget.notasApi.obtenerUno(widget.id);
      if (mounted) setState(() => _nota = nota);
    } catch (_) {
      if (mounted && _nota == null) {
        setState(() => _mensajeError = 'No se pudo cargar la nota.');
      }
    }
  }

  Future<void> _editar(NotaDto nota) async {
    final a = widget.args;
    final guardada = await context.push<bool>(
      '/notas/${nota.id}/editar',
      extra: NotaEditorArgs(
        nota: nota,
        tags: a.tags,
        carpetas: a.carpetas,
        proyectoId: a.proyectoId ?? nota.proyectoId,
      ),
    );
    if (guardada ?? false) await _cargar();
  }

  Future<void> _eliminar(NotaDto nota) async {
    final ok = await confirmar(
      context,
      titulo: '¿Eliminar nota?',
      mensaje: '«${nota.titulo}» se eliminará definitivamente.',
      accion: 'Eliminar',
    );
    if (!ok || !mounted) return;
    final hecho = await ejecutarConAviso(
      context,
      () => widget.notasApi.eliminar(nota.id),
      error: 'No se pudo eliminar la nota.',
      exito: 'Nota eliminada.',
    );
    if (hecho && mounted) context.pop();
  }

  @override
  Widget build(BuildContext context) {
    final nota = _nota;
    final store = widget.sesionStore;
    final colores = context.colores;
    return Scaffold(
      appBar: AppBar(
        actions: <Widget>[
          if (nota != null && store.puede('notas:actualizar'))
            IconButton(
              tooltip: 'Editar',
              icon: const Icon(LucideIcons.pencil),
              onPressed: () => _editar(nota),
            ),
          if (nota != null && store.puede('notas:eliminar'))
            PopupMenuButton<void>(
              icon: const Icon(LucideIcons.ellipsisVertical),
              itemBuilder: (_) => <PopupMenuEntry<void>>[
                PopupMenuItem<void>(
                  onTap: () => _eliminar(nota),
                  child: Text(
                    'Eliminar',
                    style: TextStyle(color: colores.rosePeligro),
                  ),
                ),
              ],
            ),
        ],
      ),
      body: nota == null
          ? (_mensajeError == null
                ? const EstadoCargando()
                : EstadoError(mensaje: _mensajeError!, onReintentar: _cargar))
          : RefreshIndicator(onRefresh: _cargar, child: _contenido(nota)),
    );
  }

  Widget _contenido(NotaDto nota) {
    final textTheme = Theme.of(context).textTheme;
    final colores = context.colores;
    final carpeta = widget.args.carpetas
        .where((c) => c.id == nota.carpetaId)
        .firstOrNull;
    final tags = widget.args.tags
        .where((t) => nota.tagIds.contains(t.id))
        .toList(growable: false);

    return ListView(
      padding: const EdgeInsets.only(top: 4, bottom: 48),
      children: <Widget>[
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
          child: Text(nota.titulo, style: textTheme.headlineMedium),
        ),
        if (carpeta != null || tags.isNotEmpty)
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            child: Wrap(
              spacing: 6,
              runSpacing: 6,
              children: <Widget>[
                if (carpeta != null)
                  InsigniaPill(
                    texto: carpeta.nombre,
                    icono: LucideIcons.folder,
                    colorTexto: colores.indigoMarca,
                    colorFondo: colores.indigoSuave,
                  ),
                for (final tag in tags)
                  InsigniaPill(texto: tag.nombre, icono: LucideIcons.tag),
              ],
            ),
          ),
        TarjetaSeccion(
          mostrarDivisores: false,
          paddingInterno: const EdgeInsets.all(18),
          children: <Widget>[ContenidoMarkdown(texto: nota.contenido)],
        ),
      ],
    );
  }
}
