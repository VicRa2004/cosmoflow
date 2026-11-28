import 'dart:async';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../../core/offline/aviso_pendientes.dart';
import '../../../core/theme/colores_noche_indigo.dart';
import '../../../core/theme/tema_app.dart';
import '../../../core/widgets/avisos.dart';
import '../../../core/widgets/confirmar.dart';
import '../../../core/widgets/contenido_markdown.dart';
import '../../tags/models/tag_model.dart';
import '../api/notas_api.dart';
import '../models/carpeta_model.dart';
import '../models/nota_model.dart';
import '../widgets/mover_a_carpeta_sheet.dart';

enum _MenuNotaEditor { vistaPrevia, mover, tags, fijar, duplicar, eliminar }

/// Datos que la lista pasa al editor (`extra` de GoRouter).
class NotaEditorArgs {
  const NotaEditorArgs({
    this.nota,
    this.tags = const <TagDto>[],
    this.carpetas = const <CarpetaDto>[],
    this.carpetaInicial,
    this.proyectoId,
  });

  final NotaDto? nota;
  final List<TagDto> tags;
  final List<CarpetaDto> carpetas;
  final int? carpetaInicial;
  final int? proyectoId;
}

/// `/notas/nueva` y `/notas/:id/editar`: lienzo limpio estilo Apple Notes / Obsidian
/// con autoguardado automático al escribir y opciones en el menú `···`.
class NotaEditorPage extends StatefulWidget {
  const NotaEditorPage({super.key, required this.notasApi, required this.args});

  final NotasApi notasApi;
  final NotaEditorArgs args;

  @override
  State<NotaEditorPage> createState() => _NotaEditorPageState();
}

class _NotaEditorPageState extends State<NotaEditorPage> {
  late final TextEditingController _titulo = TextEditingController(
    text: widget.args.nota?.titulo ?? '',
  );
  late final TextEditingController _contenido = TextEditingController(
    text: widget.args.nota?.contenido ?? '',
  );

  late int? _notaId = widget.args.nota?.id;
  late final String? _color = widget.args.nota?.color;
  late bool _isFijada = widget.args.nota?.isFijada ?? false;
  late int? _carpetaId = widget.args.nota != null
      ? widget.args.nota!.carpetaId
      : widget.args.carpetaInicial;
  late final Set<int> _tagIds = Set<int>.from(
    widget.args.nota?.tagIds ?? const <int>[],
  );

  Timer? _debounce;
  bool _pendienteGuardar = false;
  bool _guardando = false;
  bool _volverAGuardar = false;
  bool _huboGuardado = false;
  bool _saliendo = false;
  bool _vistaPrevia = false;

  @override
  void dispose() {
    _debounce?.cancel();
    _titulo.dispose();
    _contenido.dispose();
    super.dispose();
  }

  void _marcarCambio({bool inmediato = false}) {
    _pendienteGuardar = true;
    _debounce?.cancel();
    if (inmediato) {
      unawaited(_guardarSilencioso());
    } else {
      _debounce = Timer(
        const Duration(milliseconds: 900),
        () => unawaited(_guardarSilencioso()),
      );
    }
  }

  String? _resolverTituloParaGuardar() {
    final t = _titulo.text.trim();
    if (t.isNotEmpty) return t;
    final primeraLinea = _contenido.text
        .split('\n')
        .map((l) => l.replaceAll(RegExp(r'^[#>\-\*\s]+'), '').trim())
        .firstWhere((l) => l.isNotEmpty, orElse: () => '');
    if (primeraLinea.isEmpty) return null;
    return primeraLinea.length > 80
        ? primeraLinea.substring(0, 80)
        : primeraLinea;
  }

  Future<void> _guardarSilencioso() async {
    if (!_pendienteGuardar) return;
    if (_guardando) {
      _volverAGuardar = true;
      return;
    }

    final titulo = _resolverTituloParaGuardar();
    if (titulo == null) {
      _pendienteGuardar = false;
      return;
    }

    _pendienteGuardar = false;
    _volverAGuardar = false;
    _guardando = true;

    try {
      if (_notaId == null) {
        final creada = await widget.notasApi.crear(
          titulo: titulo,
          contenido: _contenido.text,
          color: _color,
          isFijada: _isFijada,
          tagIds: _tagIds.toList(growable: false),
          carpetaId: _carpetaId,
          proyectoId: widget.args.proyectoId,
        );
        if (creada != null) {
          _notaId = creada.id;
          _huboGuardado = true;
        } else if (mounted) {
          avisarSiEncolada(context, creada);
          _huboGuardado = true;
        }
      } else {
        await widget.notasApi.actualizar(
          _notaId!,
          titulo: titulo,
          contenido: _contenido.text,
          color: _color,
          isFijada: _isFijada,
          tagIds: _tagIds.toList(growable: false),
          carpetaId: _carpetaId,
        );
        _huboGuardado = true;
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('No se pudo guardar la nota.')),
        );
      }
    } finally {
      _guardando = false;
      if (_volverAGuardar) {
        _volverAGuardar = false;
        _pendienteGuardar = true;
        unawaited(_guardarSilencioso());
      }
    }
  }

  Future<void> _salir() async {
    if (_saliendo) return;
    _saliendo = true;
    _debounce?.cancel();
    if (_pendienteGuardar || _guardando) {
      await _guardarSilencioso();
    }
    if (mounted) Navigator.of(context).pop(_huboGuardado);
  }

  Future<void> _moverACarpeta() async {
    final destino = await mostrarMoverACarpetaSheet(
      context,
      titulo: 'Mover nota a…',
      carpetas: widget.args.carpetas,
      carpetaActualId: _carpetaId,
    );
    if (destino == null || !mounted || destino.carpetaId == _carpetaId) return;
    setState(() => _carpetaId = destino.carpetaId);
    _marcarCambio(inmediato: true);
  }

  Future<void> _editarTags() async {
    await showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      useSafeArea: true,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Padding(
          padding: const EdgeInsets.fromLTRB(
            TemaApp.margenPantalla,
            4,
            TemaApp.margenPantalla,
            28,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: <Widget>[
              Text('Etiquetas', style: Theme.of(ctx).textTheme.titleLarge),
              const SizedBox(height: 14),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: <Widget>[
                  for (final tag in widget.args.tags)
                    FilterChip(
                      label: Text('#${tag.nombre}'),
                      selected: _tagIds.contains(tag.id),
                      onSelected: (sel) {
                        setModalState(() {
                          if (sel) {
                            _tagIds.add(tag.id);
                          } else {
                            _tagIds.remove(tag.id);
                          }
                        });
                        _marcarCambio(inmediato: true);
                      },
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _alternarFijada() {
    setState(() => _isFijada = !_isFijada);
    _marcarCambio(inmediato: true);
  }

  Future<void> _duplicar() async {
    final id = _notaId;
    if (id == null) return;
    await _guardarSilencioso();
    if (!mounted) return;
    NotaDto? copia;
    final ok = await ejecutarConAviso(
      context,
      () async => copia = await widget.notasApi.duplicar(id),
      error: 'No se pudo duplicar la nota.',
      exito: 'Nota duplicada.',
    );
    if (ok && copia != null && mounted) {
      _huboGuardado = true;
      await context.push<bool>(
        '/notas/${copia!.id}/editar',
        extra: NotaEditorArgs(
          nota: copia,
          tags: widget.args.tags,
          carpetas: widget.args.carpetas,
          proyectoId: widget.args.proyectoId,
        ),
      );
    }
  }

  Future<void> _eliminar() async {
    final id = _notaId;
    if (id == null) return;
    final ok = await confirmar(
      context,
      titulo: '¿Eliminar nota?',
      mensaje: 'Esta nota se enviará a la papelera.',
      accion: 'Eliminar',
    );
    if (!ok || !mounted) return;
    _debounce?.cancel();
    _pendienteGuardar = false;
    final hecho = await ejecutarConAviso(
      context,
      () => widget.notasApi.eliminar(id),
      error: 'No se pudo eliminar la nota.',
      exito: 'Nota eliminada.',
    );
    if (hecho && mounted) Navigator.of(context).pop(true);
  }

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final textTheme = Theme.of(context).textTheme;

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) unawaited(_salir());
      },
      child: Scaffold(
        appBar: AppBar(
          leadingWidth: 60,
          leading: Padding(
            padding: const EdgeInsets.only(left: 12),
            child: Center(
              child: Material(
                color: colores.superficie,
                shape: CircleBorder(
                  side: BorderSide(color: colores.borde, width: 1),
                ),
                clipBehavior: Clip.antiAlias,
                child: IconButton(
                  tooltip: 'Volver',
                  visualDensity: VisualDensity.compact,
                  onPressed: _salir,
                  icon: Icon(
                    LucideIcons.chevronLeft,
                    size: 20,
                    color: colores.tinta,
                  ),
                ),
              ),
            ),
          ),
          actions: <Widget>[
            Padding(
              padding: const EdgeInsets.only(right: 12),
              child: Material(
                color: colores.superficie,
                shape: CircleBorder(
                  side: BorderSide(color: colores.borde, width: 1),
                ),
                clipBehavior: Clip.antiAlias,
                child: PopupMenuButton<_MenuNotaEditor>(
                  tooltip: 'Opciones',
                  icon: Icon(
                    LucideIcons.ellipsis,
                    size: 19,
                    color: colores.tinta,
                  ),
                  onSelected: (accion) => switch (accion) {
                    _MenuNotaEditor.vistaPrevia => setState(
                      () => _vistaPrevia = !_vistaPrevia,
                    ),
                    _MenuNotaEditor.mover => _moverACarpeta(),
                    _MenuNotaEditor.tags => _editarTags(),
                    _MenuNotaEditor.fijar => _alternarFijada(),
                    _MenuNotaEditor.duplicar => _duplicar(),
                    _MenuNotaEditor.eliminar => _eliminar(),
                  },
                  itemBuilder: (_) => <PopupMenuEntry<_MenuNotaEditor>>[
                    PopupMenuItem<_MenuNotaEditor>(
                      value: _MenuNotaEditor.vistaPrevia,
                      child: Text(
                        _vistaPrevia ? 'Seguir editando' : 'Vista previa',
                      ),
                    ),
                    if (widget.args.carpetas.isNotEmpty)
                      const PopupMenuItem<_MenuNotaEditor>(
                        value: _MenuNotaEditor.mover,
                        child: Text('Mover a carpeta…'),
                      ),
                    if (widget.args.tags.isNotEmpty)
                      const PopupMenuItem<_MenuNotaEditor>(
                        value: _MenuNotaEditor.tags,
                        child: Text('Etiquetas…'),
                      ),
                    PopupMenuItem<_MenuNotaEditor>(
                      value: _MenuNotaEditor.fijar,
                      child: Text(_isFijada ? 'Desfijar' : 'Fijar'),
                    ),
                    if (_notaId != null)
                      const PopupMenuItem<_MenuNotaEditor>(
                        value: _MenuNotaEditor.duplicar,
                        child: Text('Duplicar'),
                      ),
                    if (_notaId != null)
                      PopupMenuItem<_MenuNotaEditor>(
                        value: _MenuNotaEditor.eliminar,
                        child: Text(
                          'Eliminar',
                          style: TextStyle(color: colores.rosePeligro),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ],
        ),
        body: SafeArea(
          top: false,
          child: ListView(
            padding: const EdgeInsets.fromLTRB(20, 4, 20, 48),
            children: <Widget>[
              TextField(
                controller: _titulo,
                readOnly: _vistaPrevia,
                autofocus: widget.args.nota == null,
                textCapitalization: TextCapitalization.sentences,
                textInputAction: TextInputAction.next,
                maxLines: null,
                style: textTheme.headlineMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
                decoration: InputDecoration(
                  hintText: 'Título',
                  hintStyle: textTheme.headlineMedium?.copyWith(
                    color: colores.tintaTenue.withValues(alpha: 0.55),
                    fontWeight: FontWeight.w700,
                  ),
                  filled: false,
                  isDense: true,
                  border: InputBorder.none,
                  enabledBorder: InputBorder.none,
                  focusedBorder: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(vertical: 6),
                ),
                onChanged: (_) => _marcarCambio(),
              ),
              const SizedBox(height: 8),
              if (_vistaPrevia)
                ContenidoMarkdown(texto: _contenido.text)
              else
                TextField(
                  controller: _contenido,
                  keyboardType: TextInputType.multiline,
                  textCapitalization: TextCapitalization.sentences,
                  maxLines: null,
                  minLines: 16,
                  style: textTheme.bodyLarge?.copyWith(height: 1.55),
                  decoration: InputDecoration(
                    hintText: 'Empieza a escribir…',
                    hintStyle: textTheme.bodyLarge?.copyWith(
                      color: colores.tintaTenue.withValues(alpha: 0.65),
                    ),
                    filled: false,
                    isDense: true,
                    border: InputBorder.none,
                    enabledBorder: InputBorder.none,
                    focusedBorder: InputBorder.none,
                    contentPadding: EdgeInsets.zero,
                  ),
                  onChanged: (_) => _marcarCambio(),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
