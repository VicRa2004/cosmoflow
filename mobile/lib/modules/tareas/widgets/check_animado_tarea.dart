import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/theme/colores_noche_indigo.dart';

/// Casilla circular de tarea con animación tipo Things 3 / Reminders:
/// al completarse se rellena en esmeralda con rebote elástico, destello sutil
/// y palomita trazada progresivamente.
class CheckAnimadoTarea extends StatefulWidget {
  const CheckAnimadoTarea({
    super.key,
    required this.completada,
    required this.onTap,
  });

  final bool completada;
  final VoidCallback onTap;

  @override
  State<CheckAnimadoTarea> createState() => _CheckAnimadoTareaState();
}

class _CheckAnimadoTareaState extends State<CheckAnimadoTarea>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 340),
    value: widget.completada ? 1.0 : 0.0,
  );

  late final Animation<double> _escala = TweenSequence<double>(
    <TweenSequenceItem<double>>[
      TweenSequenceItem<double>(
        tween: Tween<double>(
          begin: 1.0,
          end: 0.84,
        ).chain(CurveTween(curve: Curves.easeOut)),
        weight: 22,
      ),
      TweenSequenceItem<double>(
        tween: Tween<double>(
          begin: 0.84,
          end: 1.16,
        ).chain(CurveTween(curve: Curves.easeOutBack)),
        weight: 48,
      ),
      TweenSequenceItem<double>(
        tween: Tween<double>(
          begin: 1.16,
          end: 1.0,
        ).chain(CurveTween(curve: Curves.easeInOut)),
        weight: 30,
      ),
    ],
  ).animate(_ctrl);

  late final Animation<double> _palomita = CurvedAnimation(
    parent: _ctrl,
    curve: const Interval(0.25, 0.92, curve: Curves.easeOutCubic),
  );

  late final Animation<double> _halo = CurvedAnimation(
    parent: _ctrl,
    curve: const Interval(0.15, 1.0, curve: Curves.easeOut),
  );

  @override
  void didUpdateWidget(covariant CheckAnimadoTarea oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.completada != widget.completada) {
      final sinAnimaciones = MediaQuery.disableAnimationsOf(context);
      if (sinAnimaciones) {
        _ctrl.value = widget.completada ? 1.0 : 0.0;
      } else if (widget.completada) {
        _ctrl.forward(from: 0.0);
      } else {
        _ctrl.reverse();
      }
    }
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final etiqueta = widget.completada ? 'Reabrir' : 'Completar';

    return Semantics(
      label: etiqueta,
      checked: widget.completada,
      button: true,
      child: InkResponse(
        onTap: () {
          HapticFeedback.mediumImpact();
          widget.onTap();
        },
        radius: 24,
        containedInkWell: false,
        child: SizedBox.square(
          dimension: 48,
          child: AnimatedBuilder(
            animation: _ctrl,
            builder: (context, _) {
              final progreso = _ctrl.value;
              final haloOpacidad =
                  widget.completada && _ctrl.status == AnimationStatus.forward
                  ? (1.0 - _halo.value) * 0.45
                  : 0.0;
              final haloRadio = 22.0 + (_halo.value * 16.0);

              return Stack(
                alignment: Alignment.center,
                children: <Widget>[
                  if (haloOpacidad > 0.01)
                    Container(
                      width: haloRadio,
                      height: haloRadio,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: colores.emeraldExito.withValues(
                            alpha: haloOpacidad,
                          ),
                          width: 2,
                        ),
                      ),
                    ),
                  Transform.scale(
                    scale: _ctrl.status == AnimationStatus.forward
                        ? _escala.value
                        : 1.0,
                    child: Container(
                      width: 22,
                      height: 22,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: Color.lerp(
                          Colors.transparent,
                          colores.emeraldExito,
                          progreso,
                        ),
                        border: Border.all(
                          color: Color.lerp(
                            colores.bordeFuerte,
                            colores.emeraldExito,
                            progreso,
                          )!,
                          width: 1.8,
                        ),
                      ),
                      child: _palomita.value > 0.01
                          ? CustomPaint(
                              painter: _PalomitaPainter(
                                progreso: _palomita.value,
                                color: colores.sobreAcento,
                              ),
                            )
                          : null,
                    ),
                  ),
                ],
              );
            },
          ),
        ),
      ),
    );
  }
}

class _PalomitaPainter extends CustomPainter {
  const _PalomitaPainter({required this.progreso, required this.color});

  final double progreso;
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final path = Path()
      ..moveTo(size.width * 0.24, size.height * 0.52)
      ..lineTo(size.width * 0.43, size.height * 0.70)
      ..lineTo(size.width * 0.76, size.height * 0.34);

    final metrics = path.computeMetrics().toList();
    if (metrics.isEmpty) return;
    final metric = metrics.first;
    final parcial = metric.extractPath(0, metric.length * progreso);

    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.2
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    canvas.drawPath(parcial, paint);
  }

  @override
  bool shouldRepaint(covariant _PalomitaPainter oldDelegate) =>
      oldDelegate.progreso != progreso || oldDelegate.color != color;
}
