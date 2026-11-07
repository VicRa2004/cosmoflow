import 'package:flutter/material.dart';

/// Tokens semánticos del sistema de diseño «Noche índigo» (`frontend/DESIGN.md`).
@immutable
class ColoresNocheIndigo extends ThemeExtension<ColoresNocheIndigo> {
  const ColoresNocheIndigo({
    required this.indigoMarca,
    required this.indigoMarcaHover,
    required this.indigoFoco,
    required this.rosePeligro,
    required this.fondo,
    required this.superficie,
    required this.elevada,
    required this.borde,
    required this.bordeFuerte,
    required this.tinta,
    required this.tintaSuave,
    required this.tintaTenue,
    required this.lateral,
    required this.lateralElevada,
    required this.lateralBorde,
    required this.lateralTinta,
    required this.lateralSuave,
    required this.lateralTenue,
    required this.lateralAcento,
  });

  final Color indigoMarca;
  final Color indigoMarcaHover;
  final Color indigoFoco;
  final Color rosePeligro;
  final Color fondo;
  final Color superficie;
  final Color elevada;
  final Color borde;
  final Color bordeFuerte;
  final Color tinta;
  final Color tintaSuave;
  final Color tintaTenue;
  final Color lateral;
  final Color lateralElevada;
  final Color lateralBorde;
  final Color lateralTinta;
  final Color lateralSuave;
  final Color lateralTenue;
  final Color lateralAcento;

  /// Paleta para el tema claro («El escritorio en calma»).
  static const ColoresNocheIndigo claro = ColoresNocheIndigo(
    indigoMarca: Color(0xFF4F46E5),
    indigoMarcaHover: Color(0xFF4338CA),
    indigoFoco: Color(0xFF6366F1),
    rosePeligro: Color(0xFFE11D48),
    fondo: Color(0xFFFCFCFD),
    superficie: Color(0xFFFFFFFF),
    elevada: Color(0xFFF3F4F8),
    borde: Color(0xFFE4E6EE),
    bordeFuerte: Color(0xFFD0D4E0),
    tinta: Color(0xFF171926),
    tintaSuave: Color(0xFF3E4259),
    tintaTenue: Color(0xFF676C85),
    lateral: Color(0xFF141830),
    lateralElevada: Color(0xFF212747),
    lateralBorde: Color(0xFF252B4A),
    lateralTinta: Color(0xFFF4F5FA),
    lateralSuave: Color(0xFFC8CCE0),
    lateralTenue: Color(0xFF9399B8),
    lateralAcento: Color(0xFF9BA5FF),
  );

  /// Paleta para el tema oscuro («Noche índigo»).
  static const ColoresNocheIndigo oscuro = ColoresNocheIndigo(
    indigoMarca: Color(0xFF4F46E5),
    indigoMarcaHover: Color(0xFF4338CA),
    indigoFoco: Color(0xFF6366F1),
    rosePeligro: Color(0xFFE11D48),
    fondo: Color(0xFF0E101A),
    superficie: Color(0xFF151824),
    elevada: Color(0xFF1E2233),
    borde: Color(0xFF24293D),
    bordeFuerte: Color(0xFF333952),
    tinta: Color(0xFFF2F3F8),
    tintaSuave: Color(0xFFCACDE0),
    tintaTenue: Color(0xFF969BB5),
    lateral: Color(0xFF090B17),
    lateralElevada: Color(0xFF14182E),
    lateralBorde: Color(0xFF181C33),
    lateralTinta: Color(0xFFF4F5FA),
    lateralSuave: Color(0xFFC8CCE0),
    lateralTenue: Color(0xFF9399B8),
    lateralAcento: Color(0xFF9BA5FF),
  );

  @override
  ColoresNocheIndigo copyWith({
    Color? indigoMarca,
    Color? indigoMarcaHover,
    Color? indigoFoco,
    Color? rosePeligro,
    Color? fondo,
    Color? superficie,
    Color? elevada,
    Color? borde,
    Color? bordeFuerte,
    Color? tinta,
    Color? tintaSuave,
    Color? tintaTenue,
    Color? lateral,
    Color? lateralElevada,
    Color? lateralBorde,
    Color? lateralTinta,
    Color? lateralSuave,
    Color? lateralTenue,
    Color? lateralAcento,
  }) {
    return ColoresNocheIndigo(
      indigoMarca: indigoMarca ?? this.indigoMarca,
      indigoMarcaHover: indigoMarcaHover ?? this.indigoMarcaHover,
      indigoFoco: indigoFoco ?? this.indigoFoco,
      rosePeligro: rosePeligro ?? this.rosePeligro,
      fondo: fondo ?? this.fondo,
      superficie: superficie ?? this.superficie,
      elevada: elevada ?? this.elevada,
      borde: borde ?? this.borde,
      bordeFuerte: bordeFuerte ?? this.bordeFuerte,
      tinta: tinta ?? this.tinta,
      tintaSuave: tintaSuave ?? this.tintaSuave,
      tintaTenue: tintaTenue ?? this.tintaTenue,
      lateral: lateral ?? this.lateral,
      lateralElevada: lateralElevada ?? this.lateralElevada,
      lateralBorde: lateralBorde ?? this.lateralBorde,
      lateralTinta: lateralTinta ?? this.lateralTinta,
      lateralSuave: lateralSuave ?? this.lateralSuave,
      lateralTenue: lateralTenue ?? this.lateralTenue,
      lateralAcento: lateralAcento ?? this.lateralAcento,
    );
  }

  @override
  ColoresNocheIndigo lerp(ThemeExtension<ColoresNocheIndigo>? other, double t) {
    if (other is! ColoresNocheIndigo) return this;
    return ColoresNocheIndigo(
      indigoMarca: Color.lerp(indigoMarca, other.indigoMarca, t)!,
      indigoMarcaHover:
          Color.lerp(indigoMarcaHover, other.indigoMarcaHover, t)!,
      indigoFoco: Color.lerp(indigoFoco, other.indigoFoco, t)!,
      rosePeligro: Color.lerp(rosePeligro, other.rosePeligro, t)!,
      fondo: Color.lerp(fondo, other.fondo, t)!,
      superficie: Color.lerp(superficie, other.superficie, t)!,
      elevada: Color.lerp(elevada, other.elevada, t)!,
      borde: Color.lerp(borde, other.borde, t)!,
      bordeFuerte: Color.lerp(bordeFuerte, other.bordeFuerte, t)!,
      tinta: Color.lerp(tinta, other.tinta, t)!,
      tintaSuave: Color.lerp(tintaSuave, other.tintaSuave, t)!,
      tintaTenue: Color.lerp(tintaTenue, other.tintaTenue, t)!,
      lateral: Color.lerp(lateral, other.lateral, t)!,
      lateralElevada: Color.lerp(lateralElevada, other.lateralElevada, t)!,
      lateralBorde: Color.lerp(lateralBorde, other.lateralBorde, t)!,
      lateralTinta: Color.lerp(lateralTinta, other.lateralTinta, t)!,
      lateralSuave: Color.lerp(lateralSuave, other.lateralSuave, t)!,
      lateralTenue: Color.lerp(lateralTenue, other.lateralTenue, t)!,
      lateralAcento: Color.lerp(lateralAcento, other.lateralAcento, t)!,
    );
  }
}

extension ColoresNocheIndigoContext on BuildContext {
  ColoresNocheIndigo get colores =>
      Theme.of(this).extension<ColoresNocheIndigo>() ??
      ColoresNocheIndigo.claro;
}
