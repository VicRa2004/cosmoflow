import 'package:flutter/material.dart';
import '../theme/colores_noche_indigo.dart';

/// Primera carga de una lista: indicador centrado.
class EstadoCargando extends StatelessWidget {
  const EstadoCargando({super.key});

  @override
  Widget build(BuildContext context) => const Padding(
    padding: EdgeInsets.symmetric(vertical: 64),
    child: Center(child: CircularProgressIndicator()),
  );
}

/// Error al cargar: mensaje humano y «Reintentar».
class EstadoError extends StatelessWidget {
  const EstadoError({
    super.key,
    required this.mensaje,
    required this.onReintentar,
  });

  final String mensaje;
  final VoidCallback onReintentar;

  @override
  Widget build(BuildContext context) => _EstadoBase(
    icono: Icons.cloud_off_rounded,
    titulo: 'Algo salió mal',
    mensaje: mensaje,
    accion: OutlinedButton(
      onPressed: onReintentar,
      child: const Text('Reintentar'),
    ),
  );
}

/// Lista sin elementos: icono, título y explicación, sin tarjeta alrededor.
class EstadoVacio extends StatelessWidget {
  const EstadoVacio({
    super.key,
    required this.icono,
    required this.titulo,
    required this.mensaje,
  });

  final IconData icono;
  final String titulo;
  final String mensaje;

  @override
  Widget build(BuildContext context) =>
      _EstadoBase(icono: icono, titulo: titulo, mensaje: mensaje);
}

class _EstadoBase extends StatelessWidget {
  const _EstadoBase({
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
  Widget build(BuildContext context) {
    final colores = context.colores;
    final textTheme = Theme.of(context).textTheme;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 64),
      child: Column(
        children: <Widget>[
          Icon(icono, size: 40, color: colores.tintaTenue),
          const SizedBox(height: 16),
          Text(titulo, style: textTheme.titleMedium),
          const SizedBox(height: 4),
          Text(
            mensaje,
            textAlign: TextAlign.center,
            style: textTheme.bodyMedium?.copyWith(color: colores.tintaTenue),
          ),
          if (accion != null) ...<Widget>[const SizedBox(height: 16), accion!],
        ],
      ),
    );
  }
}
