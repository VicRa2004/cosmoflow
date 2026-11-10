import 'package:flutter/material.dart';
import '../../../core/offline/aviso_pendientes.dart';
import '../../../core/widgets/avisos.dart';
import '../../../core/widgets/pagina_editor.dart';
import '../api/tareas_api.dart';
import '../models/tarea_model.dart';
import '../widgets/tarea_form.dart';

/// `/tareas/nueva` y `/tareas/:id/editar`. Devuelve `true` al guardar.
class TareaEditorPage extends StatefulWidget {
  const TareaEditorPage({super.key, required this.tareasApi, this.tarea});

  final TareasApi tareasApi;

  /// `null` = crear.
  final TareaDto? tarea;

  @override
  State<TareaEditorPage> createState() => _TareaEditorPageState();
}

class _TareaEditorPageState extends State<TareaEditorPage> {
  final _form = GlobalKey<TareaFormState>();

  Future<bool> _guardar() async {
    final v = _form.currentState?.validar();
    if (v == null) return false;
    final tarea = widget.tarea;
    return ejecutarConAviso(context, () async {
      if (tarea == null) {
        final creada = await widget.tareasApi.crear(
          titulo: v.titulo,
          contenido: v.contenido,
          estado: v.estado,
          prioridad: v.prioridad,
          fechaInicio: v.fechaInicio,
          fechaVencimiento: v.fechaVencimiento,
        );
        if (mounted) avisarSiEncolada(context, creada);
      } else {
        await widget.tareasApi.actualizar(tarea.id, <String, dynamic>{
          'titulo': v.titulo,
          'contenido': v.contenido,
          'estado': v.estado.valorApi,
          'prioridad': v.prioridad.valorApi,
          'fechaInicio': v.fechaInicio,
          'fechaVencimiento': v.fechaVencimiento,
        });
      }
    }, error: 'No se pudo guardar la tarea.');
  }

  @override
  Widget build(BuildContext context) {
    return PaginaEditor(
      titulo: widget.tarea == null ? 'Nueva tarea' : 'Editar tarea',
      onGuardar: _guardar,
      builder: (onCambio) =>
          TareaForm(key: _form, tareaInicial: widget.tarea, onCambio: onCambio),
    );
  }
}
