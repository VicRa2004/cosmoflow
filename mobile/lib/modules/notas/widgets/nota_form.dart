import 'package:flutter/material.dart';
import '../../../core/theme/colores_noche_indigo.dart';
import '../../tags/models/tag_model.dart';
import '../models/carpeta_model.dart';
import '../models/nota_model.dart';
import 'selector_carpeta.dart';

/// Valores del formulario de nota (crear o editar).
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

/// Campos de la nota. La página llama a [NotaFormState.validar].
class NotaForm extends StatefulWidget {
  const NotaForm({
    super.key,
    this.notaInicial,
    this.tagsDisponibles = const <TagDto>[],
    this.carpetas = const <CarpetaDto>[],
    this.carpetaInicial,
    this.onCambio,
  });

  final NotaDto? notaInicial;
  final List<TagDto> tagsDisponibles;
  final List<CarpetaDto> carpetas;

  /// Al crear: la carpeta abierta en la lista.
  final int? carpetaInicial;
  final VoidCallback? onCambio;

  @override
  State<NotaForm> createState() => NotaFormState();
}

class NotaFormState extends State<NotaForm> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _titulo;
  late final TextEditingController _contenido;
  late final Set<int> _tags;
  late int? _carpetaId;

  @override
  void initState() {
    super.initState();
    final n = widget.notaInicial;
    _titulo = TextEditingController(text: n?.titulo ?? '');
    _contenido = TextEditingController(text: n?.contenido ?? '');
    _tags = Set<int>.from(n?.tagIds ?? const <int>[]);
    _carpetaId = n != null ? n.carpetaId : widget.carpetaInicial;
  }

  @override
  void dispose() {
    _titulo.dispose();
    _contenido.dispose();
    super.dispose();
  }

  NotaFormValores? validar() {
    if (!(_formKey.currentState?.validate() ?? false)) return null;
    return NotaFormValores(
      titulo: _titulo.text.trim(),
      contenido: _contenido.text,
      tagIds: _tags.toList(growable: false),
      carpetaId: _carpetaId,
    );
  }

  @override
  Widget build(BuildContext context) {
    final seccion = Theme.of(
      context,
    ).textTheme.labelLarge?.copyWith(color: context.colores.tintaTenue);
    return Form(
      key: _formKey,
      onChanged: widget.onCambio,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
        children: <Widget>[
          TextFormField(
            controller: _titulo,
            autofocus: widget.notaInicial == null,
            textCapitalization: TextCapitalization.sentences,
            textInputAction: TextInputAction.next,
            decoration: const InputDecoration(labelText: 'Título'),
            validator: (v) => (v == null || v.trim().isEmpty)
                ? 'El título es obligatorio'
                : null,
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _contenido,
            minLines: 10,
            maxLines: null,
            keyboardType: TextInputType.multiline,
            textCapitalization: TextCapitalization.sentences,
            decoration: const InputDecoration(
              labelText: 'Contenido',
              hintText: 'Escribe tus apuntes (admite Markdown)',
              alignLabelWithHint: true,
            ),
          ),
          if (widget.carpetas.isNotEmpty) ...<Widget>[
            const SizedBox(height: 16),
            SelectorCarpeta(
              carpetas: widget.carpetas,
              valor: _carpetaId,
              textoNinguna: 'Sin carpeta',
              onChanged: (id) {
                setState(() => _carpetaId = id);
                widget.onCambio?.call();
              },
            ),
          ],
          if (widget.tagsDisponibles.isNotEmpty) ...<Widget>[
            const SizedBox(height: 24),
            Text('Tags', style: seccion),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: <Widget>[
                for (final tag in widget.tagsDisponibles)
                  FilterChip(
                    label: Text(tag.nombre),
                    selected: _tags.contains(tag.id),
                    onSelected: (sel) {
                      setState(
                        () => sel ? _tags.add(tag.id) : _tags.remove(tag.id),
                      );
                      widget.onCambio?.call();
                    },
                  ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}
