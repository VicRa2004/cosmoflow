import 'package:flutter/material.dart';
import '../theme/colores_noche_indigo.dart';
import 'contenido_markdown.dart';

/// Editor por bloques al estilo Notion: cada párrafo se ve renderizado y,
/// al tocarlo, se edita su Markdown en el sitio. [controller] guarda el texto completo.
///
/// shortcut: el cursor va al final del bloque tocado, no donde se tocó; sin
/// barra de formato ni comandos «/». Ampliar si se echa en falta.
class EditorMarkdown extends StatefulWidget {
  const EditorMarkdown({
    super.key,
    required this.controller,
    required this.hint,
    this.onCambio,
  });

  final TextEditingController controller;
  final String hint;
  final VoidCallback? onCambio;

  /// Separa en bloques por líneas en blanco, sin partir bloques de código ```.
  static List<String> dividirBloques(String texto) {
    final bloques = <String>[];
    final actual = <String>[];
    var enCodigo = false;
    void cerrar() {
      if (actual.isNotEmpty) bloques.add(actual.join('\n'));
      actual.clear();
    }

    for (final linea in texto.split('\n')) {
      if (linea.trimLeft().startsWith('```')) enCodigo = !enCodigo;
      if (!enCodigo && linea.trim().isEmpty) {
        cerrar();
      } else {
        actual.add(linea);
      }
    }
    cerrar();
    return bloques;
  }

  @override
  State<EditorMarkdown> createState() => _EditorMarkdownState();
}

class _EditorMarkdownState extends State<EditorMarkdown> {
  late List<String> _bloques;
  int? _editando;
  TextEditingController? _edicion;
  FocusNode? _foco;

  @override
  void initState() {
    super.initState();
    _bloques = EditorMarkdown.dividirBloques(widget.controller.text);
  }

  @override
  void dispose() {
    _edicion?.dispose();
    _foco?.dispose();
    super.dispose();
  }

  void _editar(int i) {
    final anteriorEdicion = _edicion;
    final anteriorFoco = _foco;
    final foco = FocusNode();
    // Si el foco se va a otro sitio (título, Guardar…), vuelve a la vista previa.
    foco.addListener(() {
      if (!foco.hasFocus && _foco == foco) _terminar();
    });
    setState(() {
      _editando = i;
      _edicion = TextEditingController(text: _bloques[i]);
      _foco = foco;
    });
    WidgetsBinding.instance.addPostFrameCallback((_) {
      anteriorEdicion?.dispose();
      anteriorFoco?.dispose();
    });
  }

  void _anadir() {
    setState(() => _bloques.add(''));
    _editar(_bloques.length - 1);
  }

  void _terminar() {
    setState(() {
      _editando = null;
      _bloques = EditorMarkdown.dividirBloques(_bloques.join('\n\n'));
    });
  }

  void _escribir(String texto) {
    _bloques[_editando!] = texto;
    widget.controller.text = _bloques
        .where((b) => b.trim().isNotEmpty)
        .join('\n\n');
    widget.onCambio?.call();
  }

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: <Widget>[
        for (var i = 0; i < _bloques.length; i++)
          if (i == _editando)
            TextField(
              controller: _edicion,
              focusNode: _foco,
              autofocus: true,
              maxLines: null,
              keyboardType: TextInputType.multiline,
              textCapitalization: TextCapitalization.sentences,
              style: Theme.of(context).textTheme.bodyLarge,
              decoration: InputDecoration(
                isDense: true,
                filled: true,
                fillColor: colores.elevada,
                border: InputBorder.none,
                enabledBorder: InputBorder.none,
                focusedBorder: InputBorder.none,
                contentPadding: const EdgeInsets.all(8),
              ),
              onChanged: _escribir,
            )
          else
            InkWell(
              onTap: () => _editar(i),
              borderRadius: BorderRadius.circular(8),
              child: Padding(
                padding: const EdgeInsets.all(8),
                child: ContenidoMarkdown(texto: _bloques[i], selectable: false),
              ),
            ),
        InkWell(
          onTap: _anadir,
          borderRadius: BorderRadius.circular(8),
          child: Container(
            constraints: const BoxConstraints(minHeight: 48),
            alignment: Alignment.centerLeft,
            padding: const EdgeInsets.symmetric(horizontal: 8),
            child: Text(
              _bloques.isEmpty ? widget.hint : 'Toca para seguir escribiendo',
              style: Theme.of(
                context,
              ).textTheme.bodyLarge?.copyWith(color: colores.tintaTenue),
            ),
          ),
        ),
      ],
    );
  }
}
