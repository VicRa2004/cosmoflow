import 'package:flutter/material.dart';
import '../../tags/models/tag_model.dart';
import '../models/carpeta_model.dart';
import '../models/nota_model.dart';
import 'selector_carpeta.dart';

/// Valores devueltos por el formulario de crear o editar nota.
class NotaFormValores {
  const NotaFormValores({
    required this.titulo,
    required this.contenido,
    this.tagIds = const <int>[],
    this.carpetaId,
  });

  final String titulo;
  final String contenido;
  final List<int> tagIds;
  final int? carpetaId;
}

/// Diálogo modal para crear o editar una nota personal.
class NotaFormDialog extends StatefulWidget {
  const NotaFormDialog({
    super.key,
    this.notaInicial,
    this.tagsDisponibles = const <TagDto>[],
    this.carpetas = const <CarpetaDto>[],
    this.carpetaInicial,
  });

  final NotaDto? notaInicial;
  final List<TagDto> tagsDisponibles;
  final List<CarpetaDto> carpetas;

  /// Al crear: la carpeta abierta en la lista.
  final int? carpetaInicial;

  @override
  State<NotaFormDialog> createState() => _NotaFormDialogState();
}

class _NotaFormDialogState extends State<NotaFormDialog> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  late final TextEditingController _tituloController;
  late final TextEditingController _contenidoController;
  late final Set<int> _tagsSeleccionados;
  late int? _carpetaId;

  @override
  void initState() {
    super.initState();
    final inicial = widget.notaInicial;
    _tituloController = TextEditingController(text: inicial?.titulo ?? '');
    _contenidoController = TextEditingController(
      text: inicial?.contenido ?? '',
    );
    _tagsSeleccionados = Set<int>.from(inicial?.tagIds ?? const <int>[]);
    _carpetaId = inicial != null ? inicial.carpetaId : widget.carpetaInicial;
  }

  @override
  void dispose() {
    _tituloController.dispose();
    _contenidoController.dispose();
    super.dispose();
  }

  void _guardar() {
    final form = _formKey.currentState;
    if (form == null || !form.validate()) return;

    Navigator.of(context).pop(
      NotaFormValores(
        titulo: _tituloController.text.trim(),
        contenido: _contenidoController.text,
        tagIds: _tagsSeleccionados.toList(growable: false),
        carpetaId: _carpetaId,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final esEdicion = widget.notaInicial != null;

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 440),
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: <Widget>[
                Text(
                  esEdicion ? 'Editar nota' : 'Nueva nota',
                  style: textTheme.titleMedium,
                ),
                const SizedBox(height: 16),
                Text('Título', style: textTheme.labelMedium),
                const SizedBox(height: 6),
                TextFormField(
                  controller: _tituloController,
                  decoration: const InputDecoration(
                    hintText: 'Ej. Minuta de reunión',
                  ),
                  validator: (valor) {
                    if (valor == null || valor.trim().isEmpty) {
                      return 'El título es obligatorio';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 12),
                Text('Contenido (Markdown)', style: textTheme.labelMedium),
                const SizedBox(height: 6),
                TextFormField(
                  controller: _contenidoController,
                  maxLines: 5,
                  decoration: const InputDecoration(
                    hintText: 'Escribe tus apuntes aquí...',
                  ),
                ),
                if (widget.carpetas.isNotEmpty) ...<Widget>[
                  const SizedBox(height: 12),
                  Text('Carpeta', style: textTheme.labelMedium),
                  const SizedBox(height: 6),
                  SelectorCarpeta(
                    carpetas: widget.carpetas,
                    valor: _carpetaId,
                    textoNinguna: 'Sin carpeta',
                    onChanged: (id) => setState(() => _carpetaId = id),
                  ),
                ],
                if (widget.tagsDisponibles.isNotEmpty) ...<Widget>[
                  const SizedBox(height: 12),
                  Text('Tags', style: textTheme.labelMedium),
                  const SizedBox(height: 6),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: <Widget>[
                      for (final tag in widget.tagsDisponibles)
                        FilterChip(
                          label: Text(tag.nombre),
                          selected: _tagsSeleccionados.contains(tag.id),
                          onSelected: (seleccionado) {
                            setState(() {
                              if (seleccionado) {
                                _tagsSeleccionados.add(tag.id);
                              } else {
                                _tagsSeleccionados.remove(tag.id);
                              }
                            });
                          },
                        ),
                    ],
                  ),
                ],
                const SizedBox(height: 20),
                Wrap(
                  alignment: WrapAlignment.end,
                  spacing: 8,
                  children: <Widget>[
                    OutlinedButton(
                      onPressed: () => Navigator.of(context).pop(),
                      child: const Text('Cancelar'),
                    ),
                    FilledButton(
                      onPressed: _guardar,
                      child: const Text('Guardar'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
