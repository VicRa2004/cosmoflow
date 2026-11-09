import 'package:flutter/material.dart';

import '../../../core/theme/colores_noche_indigo.dart';

/// Botón «Continuar con Google» con el logotipo oficial de 4 colores y estética «Noche índigo».
class BotonGoogle extends StatelessWidget {
  const BotonGoogle({
    super.key,
    required this.onPressed,
    this.isCargando = false,
  });

  final VoidCallback? onPressed;
  final bool isCargando;

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;

    return OutlinedButton(
      onPressed: isCargando ? null : onPressed,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          if (isCargando)
            SizedBox(
              width: 16,
              height: 16,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: colores.tintaSuave,
              ),
            )
          else
            const SizedBox(
              width: 16,
              height: 16,
              child: CustomPaint(painter: _LogoGooglePainter()),
            ),
          const SizedBox(width: 10),
          const Text('Continuar con Google'),
        ],
      ),
    );
  }
}

/// Divisor horizontal con la letra «o» central (`SeparadorO` del frontend).
class SeparadorO extends StatelessWidget {
  const SeparadorO({super.key});

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final textTheme = Theme.of(context).textTheme;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 18),
      child: Row(
        children: <Widget>[
          Expanded(child: Divider(color: colores.borde, height: 1)),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Text(
              'o',
              style: textTheme.bodySmall?.copyWith(color: colores.tintaTenue),
            ),
          ),
          Expanded(child: Divider(color: colores.borde, height: 1)),
        ],
      ),
    );
  }
}

class _LogoGooglePainter extends CustomPainter {
  const _LogoGooglePainter();

  @override
  void paint(Canvas canvas, Size size) {
    final strokeWidth = size.width * 0.21;
    final rect = Rect.fromLTWH(
      strokeWidth / 2,
      strokeWidth / 2,
      size.width - strokeWidth,
      size.height - strokeWidth,
    );

    final paint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.butt;

    // Rojo superior
    paint.color = const Color(0xFFEA4335);
    canvas.drawArc(rect, -2.45, 1.65, false, paint);

    // Amarillo izquierdo
    paint.color = const Color(0xFFFBBC05);
    canvas.drawArc(rect, 2.30, 1.55, false, paint);

    // Verde inferior
    paint.color = const Color(0xFF34A853);
    canvas.drawArc(rect, 0.75, 1.55, false, paint);

    // Azul derecho + barra horizontal
    paint.color = const Color(0xFF4285F4);
    canvas.drawArc(rect, -0.15, 0.95, false, paint);

    final barraPaint = Paint()
      ..color = const Color(0xFF4285F4)
      ..style = PaintingStyle.fill;
    canvas.drawRect(
      Rect.fromLTWH(
        size.width * 0.50,
        size.height * 0.41,
        size.width * 0.46,
        strokeWidth * 0.92,
      ),
      barraPaint,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
