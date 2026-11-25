import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../theme/colores_noche_indigo.dart';
import 'tarjeta_seccion.dart';

/// Primera carga de una lista: skeleton agrupado con pulso sutil.
class EstadoCargando extends StatefulWidget {
  const EstadoCargando({super.key, this.filas = 4});

  final int filas;

  @override
  State<EstadoCargando> createState() => _EstadoCargandoState();
}

class _EstadoCargandoState extends State<EstadoCargando>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1100),
  );

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (MediaQuery.disableAnimationsOf(context)) {
      _controller.stop();
    } else if (!_controller.isAnimating) {
      _controller.repeat(reverse: true);
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: AnimatedBuilder(
        animation: _controller,
        builder: (context, _) {
          final opacidad = 0.45 + (_controller.value * 0.45);
          return Opacity(
            opacity: opacidad,
            child: TarjetaSeccion(
              divisorIndent: 56,
              children: <Widget>[
                for (var i = 0; i < widget.filas; i++)
                  Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 14,
                    ),
                    child: Row(
                      children: <Widget>[
                        Container(
                          width: 22,
                          height: 22,
                          decoration: BoxDecoration(
                            color: colores.elevada,
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: <Widget>[
                              FractionallySizedBox(
                                widthFactor: i.isEven ? 0.72 : 0.56,
                                child: Container(
                                  height: 13,
                                  decoration: BoxDecoration(
                                    color: colores.elevada,
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                ),
                              ),
                              const SizedBox(height: 8),
                              FractionallySizedBox(
                                widthFactor: 0.36,
                                child: Container(
                                  height: 10,
                                  decoration: BoxDecoration(
                                    color: colores.elevada,
                                    borderRadius: BorderRadius.circular(5),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }
}

/// Error al cargar: icono Lucide en contenedor suave, mensaje humano y «Reintentar».
class EstadoError extends StatelessWidget {
  const EstadoError({
    super.key,
    required this.mensaje,
    required this.onReintentar,
  });

  final String mensaje;
  final VoidCallback onReintentar;

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    return _EstadoBase(
      icono: LucideIcons.cloudOff,
      colorIcono: colores.rosePeligro,
      fondoIcono: colores.roseSuave,
      titulo: 'Algo salió mal',
      mensaje: mensaje,
      accion: OutlinedButton.icon(
        onPressed: onReintentar,
        icon: const Icon(LucideIcons.refreshCw, size: 16),
        label: const Text('Reintentar'),
      ),
    );
  }
}

/// Lista sin elementos: icono en contenedor suave, título y explicación.
class EstadoVacio extends StatelessWidget {
  const EstadoVacio({
    super.key,
    required this.icono,
    required this.titulo,
    required this.mensaje,
    this.accion,
  });

  final IconData icono;
  final String titulo;
  final String mensaje;
  final Widget? accion;

  @override
  Widget build(BuildContext context) => _EstadoBase(
    icono: icono,
    titulo: titulo,
    mensaje: mensaje,
    accion: accion,
  );
}

class _EstadoBase extends StatelessWidget {
  const _EstadoBase({
    required this.icono,
    required this.titulo,
    required this.mensaje,
    this.colorIcono,
    this.fondoIcono,
    this.accion,
  });

  final IconData icono;
  final String titulo;
  final String mensaje;
  final Color? colorIcono;
  final Color? fondoIcono;
  final Widget? accion;

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final textTheme = Theme.of(context).textTheme;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 56),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              color: fondoIcono ?? colores.superficie,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(
                color: fondoIcono == null
                    ? colores.borde
                    : (colorIcono ?? colores.borde).withValues(alpha: 0.2),
              ),
            ),
            alignment: Alignment.center,
            child: Icon(
              icono,
              size: 26,
              color: colorIcono ?? colores.tintaTenue,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            titulo,
            style: textTheme.titleMedium,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 6),
          Text(
            mensaje,
            textAlign: TextAlign.center,
            style: textTheme.bodyMedium?.copyWith(color: colores.tintaTenue),
          ),
          if (accion != null) ...<Widget>[const SizedBox(height: 20), accion!],
        ],
      ),
    );
  }
}
