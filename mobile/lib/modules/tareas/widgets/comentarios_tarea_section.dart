import 'package:flutter/material.dart';

import '../../../core/theme/colores_noche_indigo.dart';
import '../../../core/widgets/avisos.dart';
import '../../../core/widgets/confirmar.dart';
import '../../../core/widgets/contenido_markdown.dart';
import '../api/comentarios_api.dart';
import '../models/tarea_model.dart';
import 'tarea_form.dart';

/// Sección de comentarios en Markdown (hilos de 1 nivel y menciones `@`)
/// dentro del detalle de una tarea.
class ComentariosTareaSection extends StatefulWidget {
  const ComentariosTareaSection({
    super.key,
    required this.tarea,
    required this.comentariosApi,
    this.yoId,
    this.miembros = const <ResponsableCandidato>[],
    this.cargarAlIniciar = true,
  });

  final TareaDto tarea;
  final ComentariosApi comentariosApi;
  final int? yoId;
  final List<ResponsableCandidato> miembros;
  final bool cargarAlIniciar;

  @override
  State<ComentariosTareaSection> createState() =>
      _ComentariosTareaSectionState();
}

class _ComentariosTareaSectionState extends State<ComentariosTareaSection> {
  final TextEditingController _nuevo = TextEditingController();
  List<ComentarioTareaDto> _comentarios = const <ComentarioTareaDto>[];
  bool _cargando = false;
  bool _enviando = false;
  String? _error;
  int? _respondiendoPadreId;
  String? _respondiendoNombre;
  int? _editandoId;
  String? _consultaMencion;

  @override
  void initState() {
    super.initState();
    if (widget.cargarAlIniciar) _cargar();
  }

  @override
  void dispose() {
    _nuevo.dispose();
    super.dispose();
  }

  Future<void> _cargar() async {
    setState(() {
      _cargando = _comentarios.isEmpty;
      _error = null;
    });
    try {
      final pagina = await widget.comentariosApi.obtenerTodos(widget.tarea.id);
      if (mounted) setState(() => _comentarios = pagina.datos);
    } catch (_) {
      if (mounted && _comentarios.isEmpty) {
        setState(() => _error = 'No se pudieron cargar los comentarios.');
      }
    } finally {
      if (mounted) setState(() => _cargando = false);
    }
  }

  void _actualizarMencion(String texto) {
    if (widget.miembros.isEmpty) {
      if (_consultaMencion != null) setState(() => _consultaMencion = null);
      return;
    }
    final consulta = consultaMencionActiva(texto);
    if (consulta != _consultaMencion) {
      setState(() => _consultaMencion = consulta);
    }
  }

  void _seleccionarMencion(ResponsableCandidato miembro) {
    final actualizado = insertarMencionEnTexto(
      _nuevo.text,
      id: miembro.id,
      nombre: miembro.nombre,
    );
    _nuevo.value = TextEditingValue(
      text: actualizado,
      selection: TextSelection.collapsed(offset: actualizado.length),
    );
    setState(() => _consultaMencion = null);
  }

  void _iniciarRespuesta(int hiloId, ComentarioTareaDto objetivo) {
    final etiquetar =
        widget.tarea.organizacionId != null &&
        objetivo.padreId != null &&
        objetivo.autorId != widget.yoId;
    final prefijo = etiquetar
        ? '[@${objetivo.autorNombre}](mencion:${objetivo.autorId}) '
        : '';
    setState(() {
      _editandoId = null;
      _respondiendoPadreId = hiloId;
      _respondiendoNombre = objetivo.autorNombre;
      _nuevo.text = prefijo;
      _nuevo.selection = TextSelection.collapsed(offset: prefijo.length);
      _consultaMencion = null;
    });
  }

  void _iniciarEdicion(ComentarioTareaDto comentario) {
    setState(() {
      _respondiendoPadreId = null;
      _respondiendoNombre = null;
      _editandoId = comentario.id;
      _nuevo.text = comentario.contenido;
      _nuevo.selection = TextSelection.collapsed(
        offset: comentario.contenido.length,
      );
      _consultaMencion = null;
    });
  }

  void _cancelarModo() {
    setState(() {
      _respondiendoPadreId = null;
      _respondiendoNombre = null;
      _editandoId = null;
      _consultaMencion = null;
      _nuevo.clear();
    });
  }

  Future<void> _enviar() async {
    final texto = _nuevo.text.trim();
    if (texto.isEmpty || _enviando) return;
    setState(() => _enviando = true);
    try {
      final ok = await ejecutarConAviso(context, () async {
        if (_editandoId != null) {
          await widget.comentariosApi.actualizar(
            widget.tarea.id,
            _editandoId!,
            contenido: texto,
          );
        } else {
          await widget.comentariosApi.crear(
            widget.tarea.id,
            contenido: texto,
            padreId: _respondiendoPadreId,
          );
        }
      }, error: 'No se pudo guardar el comentario.');
      if (ok && mounted) {
        _cancelarModo();
        await _cargar();
      }
    } finally {
      if (mounted) setState(() => _enviando = false);
    }
  }

  Future<void> _eliminar(ComentarioTareaDto c, int cantidadRespuestas) async {
    final ok = await confirmar(
      context,
      titulo: '¿Eliminar comentario?',
      mensaje: cantidadRespuestas > 0
          ? 'Se borrará junto con $cantidadRespuestas ${cantidadRespuestas == 1 ? 'respuesta' : 'respuestas'}.'
          : 'El comentario se borrará definitivamente.',
      accion: 'Eliminar',
    );
    if (!ok || !mounted) return;
    final borrado = await ejecutarConAviso(
      context,
      () => widget.comentariosApi.eliminar(widget.tarea.id, c.id),
      error: 'No se pudo eliminar el comentario.',
    );
    if (borrado && mounted) await _cargar();
  }

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final textTheme = Theme.of(context).textTheme;
    final hilos = agruparHilosComentarios(_comentarios);
    final sugerencias = _consultaMencion == null
        ? const <ResponsableCandidato>[]
        : widget.miembros
              .where(
                (m) => m.nombre.toLowerCase().contains(
                  _consultaMencion!.toLowerCase(),
                ),
              )
              .take(6)
              .toList(growable: false);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Row(
            children: <Widget>[
              Icon(
                Icons.chat_bubble_outline_rounded,
                size: 18,
                color: colores.tintaTenue,
              ),
              const SizedBox(width: 8),
              Text(
                _comentarios.isEmpty
                    ? 'Comentarios'
                    : 'Comentarios (${_comentarios.length})',
                style: textTheme.titleMedium,
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (_cargando)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 16),
              child: Center(child: CircularProgressIndicator(strokeWidth: 2)),
            )
          else if (_error != null)
            TextButton(onPressed: _cargar, child: Text('$_error Reintentar'))
          else if (_comentarios.isEmpty)
            Text(
              'Aún no hay comentarios. Escribe el primero abajo.',
              style: textTheme.bodySmall?.copyWith(color: colores.tintaTenue),
            )
          else
            for (final raiz in hilos.raices) ...<Widget>[
              _ItemComentario(
                comentario: raiz,
                propio: raiz.autorId == widget.yoId,
                onResponder: () => _iniciarRespuesta(raiz.id, raiz),
                onEditar: () => _iniciarEdicion(raiz),
                onEliminar: () => _eliminar(
                  raiz,
                  hilos.respuestasPorPadre[raiz.id]?.length ?? 0,
                ),
              ),
              if (hilos.respuestasPorPadre[raiz.id] case final resps?)
                Container(
                  margin: const EdgeInsets.only(left: 16, top: 8, bottom: 8),
                  padding: const EdgeInsets.only(left: 12),
                  decoration: BoxDecoration(
                    border: Border(left: BorderSide(color: colores.borde)),
                  ),
                  child: Column(
                    children: <Widget>[
                      for (final resp in resps) ...<Widget>[
                        _ItemComentario(
                          comentario: resp,
                          propio: resp.autorId == widget.yoId,
                          esRespuesta: true,
                          onResponder: () => _iniciarRespuesta(raiz.id, resp),
                          onEditar: () => _iniciarEdicion(resp),
                          onEliminar: () => _eliminar(resp, 0),
                        ),
                        const SizedBox(height: 8),
                      ],
                    ],
                  ),
                ),
              const Divider(height: 20),
            ],
          const SizedBox(height: 8),
          if (_editandoId != null || _respondiendoNombre != null)
            Padding(
              padding: const EdgeInsets.only(bottom: 6),
              child: Row(
                children: <Widget>[
                  Expanded(
                    child: Text(
                      _editandoId != null
                          ? 'Editando comentario'
                          : 'Respondiendo a $_respondiendoNombre',
                      style: textTheme.labelMedium?.copyWith(
                        color: colores.indigoMarca,
                      ),
                    ),
                  ),
                  TextButton(
                    onPressed: _cancelarModo,
                    child: const Text('Cancelar'),
                  ),
                ],
              ),
            ),
          if (sugerencias.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  spacing: 8,
                  children: <Widget>[
                    for (final m in sugerencias)
                      ActionChip(
                        avatar: const Icon(
                          Icons.alternate_email_rounded,
                          size: 16,
                        ),
                        label: Text(m.nombre),
                        onPressed: () => _seleccionarMencion(m),
                      ),
                  ],
                ),
              ),
            ),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: <Widget>[
              Expanded(
                child: TextField(
                  controller: _nuevo,
                  minLines: 1,
                  maxLines: 5,
                  textCapitalization: TextCapitalization.sentences,
                  decoration: InputDecoration(
                    hintText: widget.miembros.isNotEmpty
                        ? 'Escribe un comentario (usa @ para mencionar)…'
                        : 'Escribe un comentario en Markdown…',
                  ),
                  onChanged: _actualizarMencion,
                ),
              ),
              const SizedBox(width: 8),
              IconButton.filled(
                tooltip: _editandoId != null
                    ? 'Guardar comentario'
                    : 'Enviar comentario',
                onPressed: _enviando ? null : _enviar,
                icon: _enviando
                    ? const SizedBox.square(
                        dimension: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : Icon(
                        _editandoId != null
                            ? Icons.check_rounded
                            : Icons.send_rounded,
                      ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _ItemComentario extends StatelessWidget {
  const _ItemComentario({
    required this.comentario,
    required this.propio,
    required this.onResponder,
    required this.onEditar,
    required this.onEliminar,
    this.esRespuesta = false,
  });

  final ComentarioTareaDto comentario;
  final bool propio;
  final bool esRespuesta;
  final VoidCallback onResponder;
  final VoidCallback onEditar;
  final VoidCallback onEliminar;

  String _fechaCorta(String iso) {
    final dt = DateTime.tryParse(iso)?.toLocal();
    if (dt == null) return '';
    final hh = dt.hour.toString().padLeft(2, '0');
    final mm = dt.minute.toString().padLeft(2, '0');
    return '${dt.day}/${dt.month} $hh:$mm';
  }

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final textTheme = Theme.of(context).textTheme;
    final inicial = comentario.autorNombre.trim().isNotEmpty
        ? comentario.autorNombre.trim()[0].toUpperCase()
        : 'U';

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        CircleAvatar(
          radius: esRespuesta ? 13 : 16,
          backgroundColor: colores.elevada,
          foregroundColor: colores.tintaSuave,
          child: Text(inicial, style: textTheme.labelMedium),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Row(
                children: <Widget>[
                  Expanded(
                    child: Text(
                      '${comentario.autorNombre} · ${_fechaCorta(comentario.createdAt)}${comentario.editadoEn != null ? ' (editado)' : ''}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: textTheme.bodySmall?.copyWith(
                        color: colores.tintaTenue,
                      ),
                    ),
                  ),
                  IconButton(
                    tooltip: 'Responder',
                    constraints: const BoxConstraints.tightFor(
                      width: 36,
                      height: 36,
                    ),
                    padding: EdgeInsets.zero,
                    iconSize: 18,
                    onPressed: onResponder,
                    icon: const Icon(Icons.reply_rounded),
                  ),
                  if (propio)
                    PopupMenuButton<String>(
                      padding: EdgeInsets.zero,
                      iconSize: 18,
                      onSelected: (accion) {
                        if (accion == 'editar') onEditar();
                        if (accion == 'eliminar') onEliminar();
                      },
                      itemBuilder: (_) => <PopupMenuEntry<String>>[
                        const PopupMenuItem<String>(
                          value: 'editar',
                          child: Text('Editar'),
                        ),
                        PopupMenuItem<String>(
                          value: 'eliminar',
                          child: Text(
                            'Eliminar',
                            style: TextStyle(color: colores.rosePeligro),
                          ),
                        ),
                      ],
                    ),
                ],
              ),
              const SizedBox(height: 2),
              ContenidoMarkdown(texto: comentario.contenido),
            ],
          ),
        ),
      ],
    );
  }
}
