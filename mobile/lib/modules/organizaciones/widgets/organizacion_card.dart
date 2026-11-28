import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../../core/theme/colores_noche_indigo.dart';
import '../../../core/theme/tema_app.dart';
import '../../../core/widgets/avatar_usuario.dart';
import '../models/organizacion_models.dart';
import 'selector_color.dart';

/// Avatar circular con degradado de color (o imagen real si existe),
/// compartido por organizaciones, equipos y proyectos.
class AvatarDegradadoCirculo extends StatelessWidget {
  const AvatarDegradadoCirculo({
    super.key,
    required this.nombre,
    required this.colorBase,
    this.avatarUrl,
    this.tamano = 48,
    this.icono,
  });

  final String nombre;
  final String? avatarUrl;
  final Color colorBase;
  final double tamano;
  final IconData? icono;

  @override
  Widget build(BuildContext context) {
    if (avatarUrl != null && avatarUrl!.trim().isNotEmpty) {
      return AvatarUsuario(
        nombre: nombre,
        avatarUrl: avatarUrl,
        tamano: tamano,
        colorFondo: colorBase,
        colorTexto: context.colores.sobreAcento,
      );
    }

    final hsl = HSLColor.fromColor(colorBase);
    final colorSecundario = hsl
        .withHue((hsl.hue + 24) % 360)
        .withLightness((hsl.lightness + 0.06).clamp(0.25, 0.72))
        .toColor();
    final inicial = nombre.trim().isEmpty
        ? '?'
        : nombre.trim()[0].toUpperCase();

    return Container(
      width: tamano,
      height: tamano,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: <Color>[colorSecundario, colorBase],
        ),
      ),
      alignment: Alignment.center,
      child: icono != null
          ? Icon(icono, size: tamano * 0.45, color: context.colores.sobreAcento)
          : Text(
              inicial,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                color: context.colores.sobreAcento,
                fontWeight: FontWeight.w700,
              ),
            ),
    );
  }
}

/// Pila horizontal de avatares circulares superpuestos (hasta 5 + `+N`).
class AvataresApiladosMiembros extends StatelessWidget {
  const AvataresApiladosMiembros({super.key, required this.miembros});

  final List<MiembroDto> miembros;

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    const maxVisibles = 5;
    const tamano = 28.0;
    const paso = 20.0;
    final visibles = miembros.take(maxVisibles).toList(growable: false);
    final extra = miembros.length - visibles.length;
    final totalCirculos = visibles.length + (extra > 0 ? 1 : 0);
    if (totalCirculos == 0) return const SizedBox.shrink();
    final ancho = tamano + (totalCirculos - 1) * paso;

    return SizedBox(
      height: tamano,
      width: ancho,
      child: Stack(
        children: <Widget>[
          for (var i = 0; i < visibles.length; i++)
            Positioned(
              left: i * paso,
              child: Container(
                padding: const EdgeInsets.all(1.5),
                decoration: BoxDecoration(
                  color: colores.superficie,
                  shape: BoxShape.circle,
                ),
                child: AvatarUsuario(
                  nombre: visibles[i].nombre,
                  avatarUrl: visibles[i].avatarUrl,
                  tamano: tamano - 3,
                ),
              ),
            ),
          if (extra > 0)
            Positioned(
              left: visibles.length * paso,
              child: Container(
                width: tamano,
                height: tamano,
                decoration: BoxDecoration(
                  color: colores.elevada,
                  shape: BoxShape.circle,
                  border: Border.all(color: colores.superficie, width: 1.5),
                ),
                alignment: Alignment.center,
                child: Text(
                  '+$extra',
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: colores.tintaSuave,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

/// Tarjeta limpia de organización: monograma circular degradado, nombre,
/// tuerca de ajustes para admins y pie con avatares apilados + total de miembros.
class OrganizacionCard extends StatelessWidget {
  const OrganizacionCard({
    super.key,
    required this.organizacion,
    required this.onTap,
    this.onAjustes,
    this.miembros = const <MiembroDto>[],
  });

  final OrganizacionDto organizacion;
  final VoidCallback onTap;
  final VoidCallback? onAjustes;
  final List<MiembroDto> miembros;

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final textTheme = Theme.of(context).textTheme;
    final esOscuro = Theme.of(context).brightness == Brightness.dark;
    final colorBase =
        parsearColorHex(organizacion.color) ?? colores.indigoMarca;
    final desc = organizacion.descripcion.trim();

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: TemaApp.margenPantalla),
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: colores.superficie,
          borderRadius: BorderRadius.circular(TemaApp.radioDialogo),
          border: Border.all(color: colores.borde, width: 1),
          boxShadow: esOscuro
              ? null
              : <BoxShadow>[
                  BoxShadow(
                    color: colores.indigoMarca.withValues(alpha: 0.05),
                    blurRadius: 16,
                    offset: const Offset(0, 6),
                  ),
                ],
        ),
        child: Material(
          color: Colors.transparent,
          borderRadius: BorderRadius.circular(TemaApp.radioDialogo),
          clipBehavior: Clip.antiAlias,
          child: InkWell(
            onTap: onTap,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: <Widget>[
                      AvatarDegradadoCirculo(
                        nombre: organizacion.nombre,
                        avatarUrl: organizacion.avatarUrl,
                        colorBase: colorBase,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: <Widget>[
                            Text(
                              organizacion.nombre,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            if (desc.isNotEmpty) ...<Widget>[
                              const SizedBox(height: 2),
                              Text(
                                desc,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: textTheme.bodySmall,
                              ),
                            ],
                          ],
                        ),
                      ),
                      if (organizacion.isAdmin && onAjustes != null)
                        IconButton(
                          tooltip: 'Ajustes',
                          onPressed: onAjustes,
                          icon: Icon(
                            LucideIcons.settings,
                            size: 19,
                            color: colores.tintaSuave,
                          ),
                        )
                      else
                        Icon(
                          LucideIcons.chevronRight,
                          size: 18,
                          color: colores.tintaTenue,
                        ),
                    ],
                  ),
                  if (miembros.isNotEmpty) ...<Widget>[
                    const SizedBox(height: 14),
                    Row(
                      children: <Widget>[
                        AvataresApiladosMiembros(miembros: miembros),
                        const SizedBox(width: 10),
                        Text(
                          '${miembros.length} ${miembros.length == 1 ? 'miembro' : 'miembros'}',
                          style: textTheme.bodySmall?.copyWith(
                            color: colores.tintaTenue,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
