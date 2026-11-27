import 'package:flutter/material.dart';

import '../config/entorno.dart';
import '../theme/colores_noche_indigo.dart';

/// Resuelve una ruta relativa devuelta por el backend (p. ej. `/api/avatares/1?v=...`)
/// contra la URL base de la API. Devuelve `null` si [url] está vacía.
String? resolverUrlMedia(String? url, {String? baseUrl}) {
  final limpia = url?.trim();
  if (limpia == null || limpia.isEmpty) return null;
  final base = Uri.tryParse(baseUrl ?? Entorno.apiBaseUrl);
  if (base == null) return limpia;
  return base.resolve(limpia).toString();
}

/// Foto de perfil de usuario (u organización/equipo) con respaldo automático
/// a la inicial del nombre si no hay imagen o falla la carga.
class AvatarUsuario extends StatelessWidget {
  const AvatarUsuario({
    super.key,
    required this.nombre,
    this.avatarUrl,
    this.tamano = 36,
    this.radio,
    this.colorFondo,
    this.colorTexto,
    this.baseUrl,
  });

  final String nombre;
  final String? avatarUrl;
  final double tamano;

  /// Si es `null`, el avatar es circular (como `Avatar.tsx` en web).
  final double? radio;
  final Color? colorFondo;
  final Color? colorTexto;
  final String? baseUrl;

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final inicial = nombre.trim().isNotEmpty
        ? nombre.trim()[0].toUpperCase()
        : 'U';
    final fondo = colorFondo ?? colores.elevada;
    final texto = colorTexto ?? colores.tintaSuave;
    final urlResuelta = resolverUrlMedia(avatarUrl, baseUrl: baseUrl);
    final borderRadius = BorderRadius.circular(radio ?? tamano / 2);

    final textTheme = Theme.of(context).textTheme;
    final estiloInicial = tamano >= 44
        ? textTheme.titleMedium
        : tamano >= 30
        ? textTheme.labelMedium
        : textTheme.labelSmall;

    Widget respaldo() => Container(
      width: tamano,
      height: tamano,
      decoration: BoxDecoration(color: fondo, borderRadius: borderRadius),
      alignment: Alignment.center,
      child: Text(
        inicial,
        style: estiloInicial?.copyWith(
          color: texto,
          fontWeight: FontWeight.w600,
        ),
      ),
    );

    if (urlResuelta == null) return respaldo();

    return ClipRRect(
      borderRadius: borderRadius,
      child: SizedBox.square(
        dimension: tamano,
        child: Image.network(
          urlResuelta,
          width: tamano,
          height: tamano,
          fit: BoxFit.cover,
          errorBuilder: (_, _, _) => respaldo(),
        ),
      ),
    );
  }
}
