import 'package:flutter/material.dart';

import '../../../core/api/adjuntos_api.dart';
import '../../../core/theme/colores_noche_indigo.dart';
import '../../../core/widgets/campo_fecha.dart';
import '../../../core/widgets/editor_markdown.dart';
import '../../organizaciones/widgets/selector_color.dart';
import '../../plantillas/models/plantilla_model.dart';
import '../../tags/models/tag_model.dart';
import '../models/tarea_model.dart';
import 'adjuntos_tarea_section.dart';
import 'campo_subtareas.dart';
import 'tarea_form_opciones.dart';

/// Miembro elegible como responsable de una tarea compartida.
typedef ResponsableCandidato = ({int id, String nombre});

/// Valores del formulario de tarea (crear o editar).
class TareaFormValores {
  const TareaFormValores({
    required this.titulo,
    required this.contenido,
    required this.estado,
    required this.prioridad,
    this.fechaInicio,
    this.fechaVencimiento,
    this.color,
    this.isFijada = false,
    this.dependeDeId,
    this.recurrencia,
    this.tagIds = const <int>[],
    this.responsableIds = const <int>[],
    this.subtareas = const <SubtareaDto>[],
  });

  final String titulo;
  final String contenido;
  final EstadoTarea estado;
  final PrioridadTarea prioridad;
  final String? fechaInicio;
  final String? fechaVencimiento;
  final String? color;
  final bool isFijada;
  final int? dependeDeId;
  final RecurrenciaTarea? recurrencia;
  final List<int> tagIds;
  final List<int> responsableIds;
  final List<SubtareaDto> subtareas;
}

/// Campos de la tarea. No sabe dónde vive: la página llama a [TareaFormState.validar].
class TareaForm extends StatefulWidget {
  const TareaForm({
    super.key,
    this.tareaInicial,
    this.plantillaInicial,
    this.encabezado,
    this.tagsDisponibles = const <TagDto>[],
    this.responsablesDisponibles = const <ResponsableCandidato>[],
    this.tareasCandidatas = const <TareaDto>[],
    this.adjuntosApi,
    this.organizacionId,
    this.equipoId,
    this.proyectoId,
    this.selectorArchivo,
    this.onCambio,
  });

  final TareaDto? tareaInicial;
  final PlantillaTareaDto? plantillaInicial;
  final Widget? encabezado;
  final List<TagDto> tagsDisponibles;
  final List<ResponsableCandidato> responsablesDisponibles;
  final List<TareaDto> tareasCandidatas;
  final AdjuntosApi? adjuntosApi;
  final int? organizacionId;
  final int? equipoId;
  final int? proyectoId;
  final SelectorArchivoAdjunto? selectorArchivo;
  final VoidCallback? onCambio;

  @override
  State<TareaForm> createState() => TareaFormState();
}

class TareaFormState extends State<TareaForm> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _titulo;
  late final TextEditingController _contenido;
  late final TextEditingController _inicio;
  late final TextEditingController _vencimiento;
  late EstadoTarea _estado;
  late PrioridadTarea _prioridad;
  String? _color;
  late bool _isFijada;
  late int? _dependeDeId;
  late RecurrenciaTarea? _recurrencia;
  late final Set<int> _tags;
  late final Set<int> _responsables;
  late final List<SubtareaDto> _subtareas;
  final List<({AdjuntoDto adjunto, String alt})> _adjuntosAgregados =
      <({AdjuntoDto adjunto, String alt})>[];
  final Set<String> _adjuntosEliminados = <String>{};

  @override
  void initState() {
    super.initState();
    final t = widget.tareaInicial;
    final p = t == null ? widget.plantillaInicial : null;
    final hoy = DateTime.now();
    _titulo = TextEditingController(text: t?.titulo ?? p?.titulo ?? '');
    _contenido = TextEditingController(
      text: t?.contenido ?? p?.contenido ?? '',
    );
    _inicio = TextEditingController(
      text: t != null ? (t.fechaInicio ?? '') : CampoFecha.aIso(hoy),
    );
    _vencimiento = TextEditingController(
      text: t != null
          ? (t.fechaVencimiento ?? '')
          : CampoFecha.aIso(hoy.add(const Duration(days: 4))),
    );
    _estado = t?.estado ?? EstadoTarea.pendiente;
    _prioridad = t?.prioridad ?? p?.prioridad ?? PrioridadTarea.media;
    _color = t != null ? t.color : p?.color;
    _isFijada = t?.isFijada ?? false;
    _dependeDeId = t?.dependeDeId;
    _recurrencia = t?.recurrencia;
    // RN-60: los tags nunca vienen de la plantilla; se eligen en el destino.
    _tags = Set<int>.from(t?.tagIds ?? const <int>[]);
    _responsables = Set<int>.from(t?.responsableIds ?? const <int>[]);
    _subtareas = t != null
        ? List<SubtareaDto>.from(t.subtareas)
        : (p?.subtareas ?? const <String>[])
              .map((titulo) => SubtareaDto(titulo: titulo))
              .toList();
    for (final c in <TextEditingController>[_inicio, _vencimiento]) {
      c.addListener(() => widget.onCambio?.call());
    }
  }

  String _contenidoSincronizado() {
    var texto = _contenido.text;
    for (final url in _adjuntosEliminados) {
      texto = quitarAdjuntoDeMarkdown(texto, url);
    }
    for (final item in _adjuntosAgregados) {
      if (!texto.contains(item.adjunto.url)) {
        texto = agregarAdjuntoAMarkdown(texto, item.adjunto, alt: item.alt);
      }
    }
    return texto;
  }

  Future<void> _alSubirAdjunto(AdjuntoDto adjunto, String alt) async {
    setState(() {
      _adjuntosEliminados.remove(adjunto.url);
      _adjuntosAgregados.add((adjunto: adjunto, alt: alt));
      _contenido.text = _contenidoSincronizado();
    });
    widget.onCambio?.call();
  }

  Future<void> _alEliminarAdjunto(AdjuntoReferencia adjunto) async {
    setState(() {
      _adjuntosAgregados.removeWhere((e) => e.adjunto.url == adjunto.url);
      _adjuntosEliminados.add(adjunto.url);
      _contenido.text = _contenidoSincronizado();
    });
    widget.onCambio?.call();
  }

  @override
  void dispose() {
    for (final c in <TextEditingController>[
      _titulo,
      _contenido,
      _inicio,
      _vencimiento,
    ]) {
      c.dispose();
    }
    super.dispose();
  }

  /// Valida y devuelve los valores, o `null` si hay errores.
  TareaFormValores? validar() {
    if (!(_formKey.currentState?.validate() ?? false)) return null;
    String? fecha(TextEditingController c) =>
        c.text.trim().isEmpty ? null : c.text.trim();
    final colorLimpio = _color?.trim();
    return TareaFormValores(
      titulo: _titulo.text.trim(),
      contenido: _contenidoSincronizado(),
      estado: _estado,
      prioridad: _prioridad,
      fechaInicio: fecha(_inicio),
      fechaVencimiento: fecha(_vencimiento),
      color: (colorLimpio != null && colorLimpio.isNotEmpty)
          ? colorLimpio
          : null,
      isFijada: _isFijada,
      dependeDeId: _dependeDeId,
      recurrencia: _recurrencia,
      tagIds: _tags.toList(growable: false),
      responsableIds: _responsables.toList(growable: false),
      subtareas: List<SubtareaDto>.unmodifiable(_subtareas),
    );
  }

  @override
  Widget build(BuildContext context) {
    final seccion = Theme.of(context).textTheme.labelLarge
        ?.copyWith(color: context.colores.tintaTenue);
    return Form(
      key: _formKey,
      onChanged: widget.onCambio,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
        children: <Widget>[
          if (widget.encabezado != null) widget.encabezado!,
          TextFormField(
            controller: _titulo,
            autofocus: widget.tareaInicial == null,
            textCapitalization: TextCapitalization.sentences,
            textInputAction: TextInputAction.next,
            decoration: const InputDecoration(labelText: 'Título'),
            validator: (v) => (v == null || v.trim().isEmpty)
                ? 'El título es obligatorio'
                : null,
          ),
          const SizedBox(height: 24),
          Text('Descripción', style: seccion),
          const SizedBox(height: 8),
          EditorMarkdown(
            controller: _contenido,
            hint: 'Detalles, pasos… o pulsa «/» para insertar un bloque',
            onCambio: widget.onCambio,
          ),
          const SizedBox(height: 24),
          Text('Prioridad', style: seccion),
          const SizedBox(height: 8),
          SegmentedButton<PrioridadTarea>(
            showSelectedIcon: false,
            segments: <ButtonSegment<PrioridadTarea>>[
              for (final p in PrioridadTarea.values)
                ButtonSegment<PrioridadTarea>(
                  value: p,
                  label: Text(p.etiqueta),
                ),
            ],
            selected: <PrioridadTarea>{_prioridad},
            onSelectionChanged: (s) {
              setState(() => _prioridad = s.first);
              widget.onCambio?.call();
            },
          ),
          const SizedBox(height: 16),
          DropdownButtonFormField<EstadoTarea>(
            initialValue: _estado,
            decoration: const InputDecoration(labelText: 'Estado'),
            items: <DropdownMenuItem<EstadoTarea>>[
              for (final e in EstadoTarea.values)
                DropdownMenuItem<EstadoTarea>(
                  value: e,
                  child: Text(e.etiqueta),
                ),
            ],
            onChanged: (v) {
              if (v != null) setState(() => _estado = v);
            },
          ),
          const SizedBox(height: 24),
          Text('Fechas', style: seccion),
          const SizedBox(height: 8),
          CampoFecha(etiqueta: 'Inicio', controller: _inicio),
          const SizedBox(height: 16),
          CampoFecha(
            etiqueta: 'Vence',
            controller: _vencimiento,
            validator: (v) {
              final ini = _inicio.text.trim();
              final ven = v?.trim() ?? '';
              return ini.isNotEmpty && ven.isNotEmpty && ven.compareTo(ini) < 0
                  ? 'Debe ser posterior al inicio'
                  : null;
            },
          ),
          const SizedBox(height: 24),
          SelectorColor(
            valor: _color,
            opcional: true,
            onChanged: (nuevo) {
              setState(() => _color = nuevo);
              widget.onCambio?.call();
            },
          ),
          const SizedBox(height: 24),
          CampoSubtareas(
            titulos: _subtareas.map((s) => s.titulo).toList(growable: false),
            onAgregar: (titulo) {
              setState(() => _subtareas.add(SubtareaDto(titulo: titulo)));
              widget.onCambio?.call();
            },
            onEliminar: (indice) {
              setState(() => _subtareas.removeAt(indice));
              widget.onCambio?.call();
            },
          ),
          TareaFormOpciones(
            recurrencia: _recurrencia,
            onRecurrenciaChanged: (v) {
              setState(() => _recurrencia = v);
              widget.onCambio?.call();
            },
            dependeDeId: _dependeDeId,
            tareasCandidatas: widget.tareasCandidatas,
            onDependeDeChanged: (v) {
              setState(() => _dependeDeId = v);
              widget.onCambio?.call();
            },
            isFijada: _isFijada,
            onFijadaChanged: (v) {
              setState(() => _isFijada = v);
              widget.onCambio?.call();
            },
            contenidoParaAdjuntos: _contenidoSincronizado(),
            adjuntosApi: widget.adjuntosApi,
            organizacionId: widget.organizacionId,
            equipoId: widget.equipoId,
            proyectoId: widget.proyectoId,
            onAdjuntoSubido: _alSubirAdjunto,
            onEliminarAdjunto: _alEliminarAdjunto,
            selectorArchivo: widget.selectorArchivo,
          ),
          if (widget.responsablesDisponibles.isNotEmpty) ...<Widget>[
            const SizedBox(height: 24),
            Text('Responsables', style: seccion),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: <Widget>[
                for (final m in widget.responsablesDisponibles)
                  FilterChip(
                    avatar: const Icon(Icons.person_outline_rounded, size: 18),
                    label: Text(m.nombre),
                    selected: _responsables.contains(m.id),
                    onSelected: (sel) {
                      setState(
                        () => sel
                            ? _responsables.add(m.id)
                            : _responsables.remove(m.id),
                      );
                      widget.onCambio?.call();
                    },
                  ),
              ],
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
