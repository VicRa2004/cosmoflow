import 'package:flutter/material.dart';
import 'confirmar.dart';

/// Pantalla completa de crear/editar: cerrar a la izquierda, «Guardar» en la AppBar
/// (visible con el teclado abierto) y aviso si se sale con cambios sin guardar.
///
/// [onGuardar] devuelve `true` si guardó; entonces la página hace `pop(true)`.
class PaginaEditor extends StatefulWidget {
  const PaginaEditor({
    super.key,
    required this.titulo,
    required this.onGuardar,
    required this.builder,
  });

  final String titulo;
  final Future<bool> Function() onGuardar;

  /// Construye el formulario; debe llamar a `onCambio` cuando el usuario edite.
  final Widget Function(VoidCallback onCambio) builder;

  @override
  State<PaginaEditor> createState() => _PaginaEditorState();
}

class _PaginaEditorState extends State<PaginaEditor> {
  bool _sucio = false;
  bool _guardando = false;

  void _marcarSucio() {
    if (!_sucio) setState(() => _sucio = true);
  }

  Future<void> _guardar() async {
    FocusScope.of(context).unfocus();
    setState(() => _guardando = true);
    final ok = await widget.onGuardar();
    if (!mounted) return;
    setState(() => _guardando = false);
    if (ok) {
      _sucio = false;
      Navigator.of(context).pop(true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: !_sucio,
      onPopInvokedWithResult: (didPop, _) async {
        if (didPop) return;
        final descartar = await confirmar(
          context,
          titulo: '¿Descartar cambios?',
          mensaje: 'Perderás lo que has escrito.',
          accion: 'Descartar',
        );
        if (descartar && context.mounted) {
          setState(() => _sucio = false);
          Navigator.of(context).pop();
        }
      },
      child: Scaffold(
        appBar: AppBar(
          leading: const CloseButton(),
          title: Text(widget.titulo),
          actions: <Widget>[
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: _guardando
                  ? const Padding(
                      padding: EdgeInsets.all(14),
                      child: SizedBox.square(
                        dimension: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      ),
                    )
                  : TextButton(
                      onPressed: _guardar,
                      child: const Text('Guardar'),
                    ),
            ),
          ],
        ),
        body: SafeArea(child: widget.builder(_marcarSucio)),
      ),
    );
  }
}
