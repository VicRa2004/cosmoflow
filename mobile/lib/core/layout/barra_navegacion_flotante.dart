import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../auth/usuario_sesion.dart';
import '../theme/colores_noche_indigo.dart';
import '../theme/tema_app.dart';
import '../widgets/avatar_usuario.dart';
import 'navegacion.dart';

/// Barra de navegación inferior flotante estilo dock con efecto cristal,
/// indicador deslizante animado, feedback háptico y avatar en el destino Perfil.
class BarraNavegacionFlotante extends StatelessWidget {
  const BarraNavegacionFlotante({
    super.key,
    required this.items,
    required this.indiceActivo,
    required this.onSeleccionar,
    this.usuario,
  });

  final List<ItemNavegacion> items;
  final int indiceActivo;
  final ValueChanged<int> onSeleccionar;
  final UsuarioSesion? usuario;

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final esOscuro = Theme.of(context).brightness == Brightness.dark;
    final count = items.length;
    final seleccionado = indiceActivo.clamp(0, count - 1);
    final alineacionX = count <= 1
        ? 0.0
        : -1.0 + (2.0 * seleccionado / (count - 1));

    return SafeArea(
      top: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(12, 0, 12, 10),
        child: Container(
          height: 64,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(TemaApp.radioSheet),
            boxShadow: <BoxShadow>[
              BoxShadow(
                color: esOscuro
                    ? colores.lateral.withValues(alpha: 0.55)
                    : colores.indigoMarca.withValues(alpha: 0.10),
                blurRadius: esOscuro ? 24 : 20,
                offset: const Offset(0, 8),
                spreadRadius: -2,
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(TemaApp.radioSheet),
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 18, sigmaY: 18),
              child: DecoratedBox(
                decoration: BoxDecoration(
                  color: colores.superficie.withValues(
                    alpha: esOscuro ? 0.86 : 0.90,
                  ),
                  borderRadius: BorderRadius.circular(TemaApp.radioSheet),
                  border: Border.all(
                    color: esOscuro
                        ? colores.bordeFuerte.withValues(alpha: 0.65)
                        : colores.borde.withValues(alpha: 0.95),
                    width: 1,
                  ),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(5),
                  child: Stack(
                    children: <Widget>[
                      // Píldora activa deslizante
                      AnimatedAlign(
                        duration: const Duration(milliseconds: 260),
                        curve: Curves.easeOutCubic,
                        alignment: Alignment(alineacionX, 0),
                        child: FractionallySizedBox(
                          widthFactor: 1 / count,
                          heightFactor: 1,
                          child: DecoratedBox(
                            decoration: BoxDecoration(
                              color: colores.indigoSuave,
                              borderRadius: BorderRadius.circular(
                                TemaApp.radioDialogo - 2,
                              ),
                              border: Border.all(
                                color: colores.indigoMarca.withValues(
                                  alpha: esOscuro ? 0.30 : 0.18,
                                ),
                                width: 1,
                              ),
                            ),
                          ),
                        ),
                      ),
                      // Destinos interactivos
                      Row(
                        children: <Widget>[
                          for (var i = 0; i < count; i++)
                            Expanded(
                              child: _ItemDock(
                                item: items[i],
                                activo: i == seleccionado,
                                usuario: items[i].ruta == '/perfil'
                                    ? usuario
                                    : null,
                                onTap: () {
                                  if (i != seleccionado) {
                                    HapticFeedback.selectionClick();
                                  }
                                  onSeleccionar(i);
                                },
                              ),
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _ItemDock extends StatelessWidget {
  const _ItemDock({
    required this.item,
    required this.activo,
    required this.onTap,
    this.usuario,
  });

  final ItemNavegacion item;
  final bool activo;
  final VoidCallback onTap;
  final UsuarioSesion? usuario;

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final colorContenido = activo ? colores.indigoMarca : colores.tintaTenue;

    return Semantics(
      selected: activo,
      button: true,
      label: item.etiqueta,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(TemaApp.radioDialogo - 2),
          splashColor: colores.indigoMarca.withValues(alpha: 0.10),
          highlightColor: Colors.transparent,
          child: SizedBox.expand(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: <Widget>[
                AnimatedScale(
                  scale: activo ? 1.08 : 1.0,
                  duration: const Duration(milliseconds: 220),
                  curve: Curves.easeOutCubic,
                  child: _construirIcono(colores, colorContenido),
                ),
                const SizedBox(height: 3),
                AnimatedDefaultTextStyle(
                  duration: const Duration(milliseconds: 200),
                  style: Theme.of(context).textTheme.labelSmall!.copyWith(
                    color: colorContenido,
                    fontWeight: activo ? FontWeight.w600 : FontWeight.w500,
                    letterSpacing: -0.1,
                  ),
                  child: Text(
                    item.etiqueta,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    softWrap: false,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _construirIcono(ColoresNocheIndigo colores, Color colorContenido) {
    if (usuario != null) {
      return Container(
        padding: const EdgeInsets.all(1.5),
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          border: Border.all(
            color: activo ? colores.indigoMarca : Colors.transparent,
            width: 1.5,
          ),
        ),
        child: AvatarUsuario(
          nombre: usuario!.nombre,
          avatarUrl: usuario!.avatarUrl,
          tamano: 20,
        ),
      );
    }
    return Icon(
      activo ? (item.iconoActivo ?? item.icono) : item.icono,
      size: 20,
      color: colorContenido,
    );
  }
}
