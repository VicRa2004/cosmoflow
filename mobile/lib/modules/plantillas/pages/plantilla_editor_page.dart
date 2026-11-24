import 'package:flutter/material.dart';

import '../../../core/widgets/avisos.dart';
import '../../../core/widgets/estados.dart';
import '../../../core/widgets/pagina_editor.dart';
import '../api/plantillas_api.dart';
import '../models/plantilla_model.dart';
import '../widgets/plantilla_form.dart';

/// Argumentos para abrir `/plantillas/:id/editar`.
class PlantillaEditorArgs {
  const PlantillaEditorArgs({this.plantilla, this.organizacionId});

  final PlantillaTareaDto? plantilla;
  final int? organizacionId;

  static PlantillaEditorArgs fromExtra(Object? extra) {
    if (extra is PlantillaEditorArgs) return extra;
    if (extra is PlantillaTareaDto) {
      return PlantillaEditorArgs(plantilla: extra);
    }
    return const PlantillaEditorArgs();
  }
}

/// `/plantillas/:id/editar`: edición a pantalla completa de una plantilla.
class PlantillaEditorPage extends StatefulWidget {
  const PlantillaEditorPage({
    super.key,
    required this.plantillaId,
    required this.plantillasApi,
    this.args = const PlantillaEditorArgs(),
  });

  final int plantillaId;
  final PlantillasApi plantillasApi;
  final PlantillaEditorArgs args;

  @override
  State<PlantillaEditorPage> createState() => _PlantillaEditorPageState();
}

class _PlantillaEditorPageState extends State<PlantillaEditorPage> {
  final _form = GlobalKey<PlantillaFormState>();
  late PlantillaTareaDto? _plantilla = widget.args.plantilla;
  bool _cargando = false;
  String? _mensajeError;

  @override
  void initState() {
    super.initState();
    if (_plantilla == null) {
      _cargar();
    }
  }

  Future<void> _cargar() async {
    setState(() {
      _cargando = true;
      _mensajeError = null;
    });
    try {
      final lista = await widget.plantillasApi.obtenerTodas(
        organizacionId: widget.args.organizacionId,
      );
      final encontrada = lista
          .where((p) => p.id == widget.plantillaId)
          .firstOrNull;
      if (!mounted) return;
      setState(() {
        _plantilla = encontrada;
        _mensajeError = encontrada == null
            ? 'No se encontró la plantilla.'
            : null;
      });
    } catch (_) {
      if (mounted) {
        setState(() => _mensajeError = 'No se pudo cargar la plantilla.');
      }
    } finally {
      if (mounted) setState(() => _cargando = false);
    }
  }

  Future<bool> _guardar() async {
    final v = _form.currentState?.validar();
    if (v == null || _plantilla == null) return false;
    return ejecutarConAviso(
      context,
      () => widget.plantillasApi.actualizar(
        _plantilla!.id,
        nombre: v.nombre,
        titulo: v.titulo,
        contenido: v.contenido,
        prioridad: v.prioridad,
        color: v.color,
        subtareas: v.subtareas,
        organizacionId: widget.args.organizacionId,
      ),
      error: 'No se pudo actualizar la plantilla.',
      exito: 'Plantilla actualizada',
    );
  }

  @override
  Widget build(BuildContext context) {
    final plantilla = _plantilla;
    if (plantilla == null) {
      return Scaffold(
        appBar: AppBar(
          leading: const CloseButton(),
          title: const Text('Editar plantilla'),
        ),
        body: _cargando
            ? const EstadoCargando()
            : EstadoError(
                mensaje: _mensajeError ?? 'No se encontró la plantilla.',
                onReintentar: _cargar,
              ),
      );
    }

    return PaginaEditor(
      titulo: 'Editar plantilla',
      onGuardar: _guardar,
      builder: (onCambio) => PlantillaForm(
        key: _form,
        plantillaInicial: plantilla,
        onCambio: onCambio,
      ),
    );
  }
}
