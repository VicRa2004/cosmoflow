import 'package:flutter/material.dart';

import '../theme/colores_noche_indigo.dart';
import '../theme/tema_app.dart';

/// Bloque agrupado estilo iOS/Notion: cabecera opcional sobre una tarjeta limpia
/// de `superficie` con borde de 1px y divisores internos entre elementos.
class TarjetaSeccion extends StatelessWidget {
  const TarjetaSeccion({
    super.key,
    required this.children,
    this.titulo,
    this.contador,
    this.colorTitulo,
    this.accion,
    this.margin = const EdgeInsets.symmetric(horizontal: 16),
    this.paddingInterno = EdgeInsets.zero,
    this.divisorIndent = 16,
    this.mostrarDivisores = true,
  });

  final List<Widget> children;
  final String? titulo;
  final int? contador;
  final Color? colorTitulo;
  final Widget? accion;
  final EdgeInsetsGeometry margin;
  final EdgeInsetsGeometry paddingInterno;
  final double divisorIndent;
  final bool mostrarDivisores;

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final textTheme = Theme.of(context).textTheme;

    return Padding(
      padding: margin,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          if (titulo != null || accion != null)
            Padding(
              padding: const EdgeInsets.fromLTRB(4, 0, 4, 8),
              child: Row(
                children: <Widget>[
                  if (titulo != null)
                    Text(
                      titulo!,
                      style: textTheme.labelLarge?.copyWith(
                        color: colorTitulo ?? colores.tintaTenue,
                      ),
                    ),
                  if (contador != null) ...<Widget>[
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 7,
                        vertical: 1.5,
                      ),
                      decoration: BoxDecoration(
                        color: (colorTitulo ?? colores.tintaTenue).withValues(
                          alpha: 0.12,
                        ),
                        borderRadius: BorderRadius.circular(
                          TemaApp.radioCompleto,
                        ),
                      ),
                      child: Text(
                        '$contador',
                        style: textTheme.labelSmall?.copyWith(
                          color: colorTitulo ?? colores.tintaSuave,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                  const Spacer(),
                  ?accion,
                ],
              ),
            ),
          Material(
            color: colores.superficie,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(TemaApp.radioTarjeta),
              side: BorderSide(color: colores.borde, width: 1),
            ),
            clipBehavior: Clip.antiAlias,
            child: Padding(
              padding: paddingInterno,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: <Widget>[
                  for (var i = 0; i < children.length; i++) ...<Widget>[
                    children[i],
                    if (mostrarDivisores && i < children.length - 1)
                      Divider(indent: divisorIndent, endIndent: 0),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Contenedor cuadrado redondeado con fondo tintado suave para iconos Lucide.
class IconoCaja extends StatelessWidget {
  const IconoCaja({
    super.key,
    required this.icono,
    this.color,
    this.fondo,
    this.dimension = 34,
    this.tamanoIcono = 18,
    this.radio = 10,
  });

  final IconData icono;
  final Color? color;
  final Color? fondo;
  final double dimension;
  final double tamanoIcono;
  final double radio;

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final tono = color ?? colores.tintaSuave;
    return Container(
      width: dimension,
      height: dimension,
      decoration: BoxDecoration(
        color: fondo ?? colores.elevada,
        borderRadius: BorderRadius.circular(radio),
      ),
      alignment: Alignment.center,
      child: Icon(icono, size: tamanoIcono, color: tono),
    );
  }
}

/// Pill compacto para metadatos: prioridad, fecha, estado, carpeta o verificación.
class InsigniaPill extends StatelessWidget {
  const InsigniaPill({
    super.key,
    required this.texto,
    this.icono,
    this.colorTexto,
    this.colorFondo,
  });

  final String texto;
  final IconData? icono;
  final Color? colorTexto;
  final Color? colorFondo;

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final tono = colorTexto ?? colores.tintaSuave;
    final fondo = colorFondo ?? colores.elevada;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2.5),
      decoration: BoxDecoration(
        color: fondo,
        borderRadius: BorderRadius.circular(TemaApp.radioPequeno),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          if (icono != null) ...<Widget>[
            Icon(icono, size: 12, color: tono),
            const SizedBox(width: 4),
          ],
          Text(
            texto,
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: tono,
              fontWeight: FontWeight.w600,
              height: 1.2,
            ),
          ),
        ],
      ),
    );
  }
}
