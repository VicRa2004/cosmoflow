import 'dart:async';

import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../../core/theme/colores_noche_indigo.dart';
import '../../../core/widgets/tarjeta_seccion.dart';
import '../../organizaciones/services/contexto_organizacion_cache.dart';
import '../models/tarea_model.dart';
import 'check_animado_tarea.dart';

/// Fila de lista de tarea: casilla circular animada (48 dp), título Inter con
/// tachado suave, pills de metadatos, acción de fijar y colapso opcional al salir.
class TareaFila extends StatefulWidget {
  const TareaFila({
    super.key,
    required this.tarea,
    required this.onTap,
    this.onLongPress,
    this.onAlternarCompletada,
    this.onAlternarFijada,
    this.mostrarEstado = true,
    this.puedeActualizar = true,
    this.modoSeleccion = false,
    this.seleccionada = false,
    this.animarSalida = false,
    this.ubicacion,
  });

  final TareaDto tarea;
  final VoidCallback onTap;
  final VoidCallback? onLongPress;
  final VoidCallback? onAlternarCompletada;
  final VoidCallback? onAlternarFijada;
  final bool mostrarEstado;
  final bool puedeActualizar;
  final bool modoSeleccion;
  final bool seleccionada;

  /// Si es `true` (p. ej. en Pendientes), al completar muestra el check + tachado
  /// en gris, espera un instante y colapsa la fila suavemente antes de notificar.
  final bool animarSalida;
  final UbicacionTarea? ubicacion;

  @override
  State<TareaFila> createState() => _TareaFilaState();
}

class _TareaFilaState extends State<TareaFila>
    with SingleTickerProviderStateMixin {
  late final AnimationController _salidaCtrl = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 260),
    value: 1.0,
  );
  late final Animation<double> _salidaCurva = CurvedAnimation(
    parent: _salidaCtrl,
    curve: Curves.easeInOutCubic,
  );

  bool _completandoLocal = false;
  Timer? _pausaSalida;

  @override
  void didUpdateWidget(covariant TareaFila oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.tarea.id != widget.tarea.id ||
        oldWidget.tarea.estado != widget.tarea.estado) {
      _pausaSalida?.cancel();
      _completandoLocal = false;
      _salidaCtrl.value = 1.0;
    }
  }

  @override
  void dispose() {
    _pausaSalida?.cancel();
    _salidaCtrl.dispose();
    super.dispose();
  }

  void _alPulsarCompletar() {
    final callback = widget.onAlternarCompletada;
    if (callback == null) return;

    final yaCompletada = widget.tarea.estado == EstadoTarea.completada;
    final sinAnimaciones = MediaQuery.disableAnimationsOf(context);

    // Al reabrir, sin animación de salida, o si el sistema desactiva animaciones:
    if (yaCompletada || !widget.animarSalida || sinAnimaciones) {
      if (!yaCompletada && !sinAnimaciones) {
        setState(() => _completandoLocal = true);
      }
      callback();
      return;
    }

    // Secuencia en vistas donde la tarea sale (Pendientes / filtro abiertas):
    // 1) Check esmeralda + tachado y atenuado gris inmediato
    // 2) Breve pausa para percibir el logro (~520 ms)
    // 3) Colapso suave en altura y opacidad (260 ms) → dispara callback
    if (_completandoLocal) return;
    setState(() => _completandoLocal = true);

    _pausaSalida = Timer(const Duration(milliseconds: 520), () async {
      if (!mounted) return;
      await _salidaCtrl.reverse();
      if (mounted) callback();
    });
  }

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final textTheme = Theme.of(context).textTheme;
    final tarea = widget.tarea;
    final completada =
        tarea.estado == EstadoTarea.completada || _completandoLocal;
    final puedeMarcar =
        widget.puedeActualizar &&
        tarea.estado != EstadoTarea.cancelada &&
        widget.onAlternarCompletada != null;
    final puedeFijar =
        widget.puedeActualizar && widget.onAlternarFijada != null;

    final colorFondo = widget.seleccionada
        ? colores.indigoSuave.withValues(alpha: 0.6)
        : _completandoLocal
        ? colores.elevada.withValues(alpha: 0.8)
        : Colors.transparent;

    final fila = InkWell(
      onTap: _completandoLocal ? null : widget.onTap,
      onLongPress: _completandoLocal ? null : widget.onLongPress,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 240),
        curve: Curves.easeOut,
        color: colorFondo,
        child: ConstrainedBox(
          constraints: const BoxConstraints(minHeight: 62),
          child: Padding(
            padding: EdgeInsets.fromLTRB(
              6,
              10,
              (!widget.modoSeleccion && puedeFijar) ? 6 : 16,
              10,
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: <Widget>[
                SizedBox.square(
                  dimension: 48,
                  child: widget.modoSeleccion
                      ? Checkbox(
                          value: widget.seleccionada,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(4),
                          ),
                          onChanged: (_) => widget.onTap(),
                        )
                      : puedeMarcar
                      ? CheckAnimadoTarea(
                          completada: completada,
                          onTap: _alPulsarCompletar,
                        )
                      : Icon(
                          tarea.estado == EstadoTarea.cancelada
                              ? LucideIcons.ban
                              : LucideIcons.circle,
                          size: 20,
                          color: colores.tintaTenue,
                        ),
                ),
                const SizedBox(width: 2),
                Expanded(
                  child: AnimatedOpacity(
                    duration: const Duration(milliseconds: 240),
                    opacity: _completandoLocal ? 0.52 : 1.0,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: <Widget>[
                        Row(
                          children: <Widget>[
                            Expanded(
                              child: AnimatedDefaultTextStyle(
                                duration: const Duration(milliseconds: 220),
                                style: textTheme.bodyLarge!.copyWith(
                                  fontWeight: FontWeight.w500,
                                  decoration: completada
                                      ? TextDecoration.lineThrough
                                      : TextDecoration.none,
                                  decorationColor: colores.tintaTenue,
                                  color: completada
                                      ? colores.tintaTenue
                                      : colores.tinta,
                                ),
                                child: Text(
                                  tarea.titulo,
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ),
                            if (tarea.bloqueada) ...<Widget>[
                              const SizedBox(width: 6),
                              Icon(
                                LucideIcons.lock,
                                size: 14,
                                color: colores.amberAviso,
                                semanticLabel: 'Bloqueada',
                              ),
                            ],
                            if (tarea.recurrencia != null) ...<Widget>[
                              const SizedBox(width: 6),
                              Icon(
                                LucideIcons.repeat,
                                size: 14,
                                color: colores.indigoMarca,
                                semanticLabel:
                                    'Se repite: ${tarea.recurrencia!.etiqueta}',
                              ),
                            ],
                          ],
                        ),
                        const SizedBox(height: 5),
                        _Metadatos(
                          tarea: tarea,
                          mostrarEstado: widget.mostrarEstado,
                          ubicacion: widget.ubicacion,
                        ),
                      ],
                    ),
                  ),
                ),
                if (!widget.modoSeleccion && puedeFijar)
                  IconButton(
                    tooltip: tarea.isFijada ? 'Desfijar tarea' : 'Fijar tarea',
                    onPressed: _completandoLocal
                        ? null
                        : widget.onAlternarFijada,
                    icon: Icon(
                      LucideIcons.pin,
                      size: 17,
                      color: tarea.isFijada
                          ? colores.indigoMarca
                          : colores.tintaTenue.withValues(alpha: 0.65),
                    ),
                  )
                else if (!widget.modoSeleccion && tarea.isFijada)
                  Padding(
                    padding: const EdgeInsets.only(left: 8),
                    child: Icon(
                      LucideIcons.pin,
                      size: 16,
                      color: colores.indigoMarca,
                      semanticLabel: 'Fijada',
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );

    if (!widget.animarSalida) return fila;

    return SizeTransition(
      sizeFactor: _salidaCurva,
      alignment: Alignment.topCenter,
      child: FadeTransition(opacity: _salidaCurva, child: fila),
    );
  }
}

class _Metadatos extends StatelessWidget {
  const _Metadatos({
    required this.tarea,
    required this.mostrarEstado,
    this.ubicacion,
  });

  final TareaDto tarea;
  final bool mostrarEstado;
  final UbicacionTarea? ubicacion;

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final (textoFecha, colorFecha, fondoFecha) = _vencimiento(colores);
    final (textoUbicacion, iconoUbicacion) = _etiquetaUbicacion();

    return Wrap(
      spacing: 6,
      runSpacing: 4,
      crossAxisAlignment: WrapCrossAlignment.center,
      children: <Widget>[
        if (tarea.prioridad == PrioridadTarea.alta)
          InsigniaPill(
            texto: 'Alta',
            icono: LucideIcons.flag,
            colorTexto: colores.rosePeligro,
            colorFondo: colores.roseSuave,
          ),
        if (textoFecha != null)
          InsigniaPill(
            texto: textoFecha,
            icono: LucideIcons.calendar,
            colorTexto: colorFecha,
            colorFondo: fondoFecha,
          ),
        if (tarea.bloqueada)
          InsigniaPill(
            texto: 'Bloqueada',
            colorTexto: colores.amberAviso,
            colorFondo: colores.amberSuave,
          ),
        if (mostrarEstado)
          InsigniaPill(
            texto: tarea.estado.etiqueta,
            colorTexto: colores.tintaSuave,
            colorFondo: colores.elevada,
          ),
        if (textoUbicacion != null)
          InsigniaPill(
            texto: textoUbicacion,
            icono: iconoUbicacion,
            colorTexto: colores.indigoMarca,
            colorFondo: colores.indigoSuave,
          ),
      ],
    );
  }

  (String?, IconData?) _etiquetaUbicacion() {
    if (ubicacion != null) {
      return (ubicacion!.etiquetaCorta, ubicacion!.icono);
    }
    if (!tarea.isCompartida) return (null, null);
    if (tarea.equipoId != null) return ('Equipo', LucideIcons.users);
    if (tarea.proyectoId != null) return ('Proyecto', LucideIcons.folderKanban);
    return ('Organización', LucideIcons.building2);
  }

  (String?, Color, Color) _vencimiento(ColoresNocheIndigo colores) {
    final dia = tarea.fechaVencimiento;
    if (dia == null || dia.isEmpty) {
      return (null, colores.tintaTenue, colores.elevada);
    }
    final ahora = DateTime.now();
    final hoy = DateTime(ahora.year, ahora.month, ahora.day);
    final fecha = DateTime.tryParse(dia);
    if (fecha == null || !tarea.estado.isAbierta) {
      return (dia, colores.tintaTenue, colores.elevada);
    }
    final dias = fecha.difference(hoy).inDays;
    if (dias < 0) {
      return ('Vencida · $dia', colores.rosePeligro, colores.roseSuave);
    }
    if (dias == 0) return ('Hoy', colores.amberAviso, colores.amberSuave);
    if (dias == 1) return ('Mañana', colores.amberAviso, colores.amberSuave);
    return (dia, colores.tintaSuave, colores.elevada);
  }
}
