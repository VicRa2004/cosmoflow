import 'package:flutter/material.dart';
import '../../../core/offline/aviso_pendientes.dart';
import '../../../core/widgets/avisos.dart';
import '../../../core/widgets/pagina_editor.dart';
import '../../tags/models/tag_model.dart';
import '../api/notas_api.dart';
import '../models/carpeta_model.dart';
import '../models/nota_model.dart';
import '../widgets/nota_form.dart';

/// Datos que la lista pasa al editor (`extra` de GoRouter).
class NotaEditorArgs {
  const NotaEditorArgs({
    this.nota,
    this.tags = const <TagDto>[],
    this.carpetas = const <CarpetaDto>[],
    this.carpetaInicial,
  });

  final NotaDto? nota;
  final List<TagDto> tags;
  final List<CarpetaDto> carpetas;
  final int? carpetaInicial;
}

/// `/notas/nueva` y `/notas/:id/editar`. Devuelve `true` al guardar.
class NotaEditorPage extends StatefulWidget {
  const NotaEditorPage({super.key, required this.notasApi, required this.args});

  final NotasApi notasApi;
  final NotaEditorArgs args;

  @override
  State<NotaEditorPage> createState() => _NotaEditorPageState();
}

class _NotaEditorPageState extends State<NotaEditorPage> {
  final _form = GlobalKey<NotaFormState>();

  Future<bool> _guardar() async {
    final v = _form.currentState?.validar();
    if (v == null) return false;
    final nota = widget.args.nota;
    return ejecutarConAviso(context, () async {
      if (nota == null) {
        final creada = await widget.notasApi.crear(
          titulo: v.titulo,
          contenido: v.contenido,
          tagIds: v.tagIds,
          carpetaId: v.carpetaId,
        );
        if (mounted) avisarSiEncolada(context, creada);
      } else {
        await widget.notasApi.actualizar(
          nota.id,
          titulo: v.titulo,
          contenido: v.contenido,
          color: nota.color,
          tagIds: v.tagIds,
          carpetaId: v.carpetaId,
        );
      }
    }, error: 'No se pudo guardar la nota.');
  }

  @override
  Widget build(BuildContext context) {
    final a = widget.args;
    return PaginaEditor(
      titulo: a.nota == null ? 'Nueva nota' : 'Editar nota',
      onGuardar: _guardar,
      builder: (onCambio) => NotaForm(
        key: _form,
        notaInicial: a.nota,
        tagsDisponibles: a.tags,
        carpetas: a.carpetas,
        carpetaInicial: a.carpetaInicial,
        onCambio: onCambio,
      ),
    );
  }
}
