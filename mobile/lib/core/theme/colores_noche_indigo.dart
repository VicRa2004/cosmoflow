import 'package:flutter/material.dart';

/// Tokens semánticos del sistema de diseño «Noche índigo» adaptado a móvil
/// con tarjetas agrupadas estilo iOS/Notion sobre lienzo tintado.
@immutable
class ColoresNocheIndigo extends ThemeExtension<ColoresNocheIndigo> {
  const ColoresNocheIndigo({
    required this.indigoMarca,
    required this.indigoMarcaHover,
    required this.indigoFoco,
    required this.indigoSuave,
    required this.rosePeligro,
    required this.rosePeligroHover,
    required this.roseSuave,
    required this.amberAviso,
    required this.amberSuave,
    required this.emeraldExito,
    required this.emeraldSuave,
    required this.sobreAcento,
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
    required this.lateralAlerta,
  });

  final Color indigoMarca;
  final Color indigoMarcaHover;
  final Color indigoFoco;
  final Color indigoSuave;
  final Color rosePeligro;
  final Color rosePeligroHover;
  final Color roseSuave;
  final Color amberAviso;
  final Color amberSuave;
  final Color emeraldExito;
  final Color emeraldSuave;

  /// Texto/icono claro sobre fondos de acento sólidos (`indigoMarca`, `rosePeligro`, colores de entidad).
  final Color sobreAcento;
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
  final Color lateralAlerta;

  /// Paleta para el tema claro («El escritorio en calma» con tarjetas agrupadas).
  static const ColoresNocheIndigo claro = ColoresNocheIndigo(
    indigoMarca: Color(0xFF4F46E5),
    indigoMarcaHover: Color(0xFF4338CA),
    indigoFoco: Color(0xFF6366F1),
    indigoSuave: Color(0xFFEEF0FF),
    rosePeligro: Color(0xFFE11D48),
    rosePeligroHover: Color(0xFFBE123C),
    roseSuave: Color(0xFFFFF1F2),
    amberAviso: Color(0xFFD97706),
    amberSuave: Color(0xFFFEF3C7),
    emeraldExito: Color(0xFF059669),
    emeraldSuave: Color(0xFFECFDF5),
    sobreAcento: Color(0xFFFFFFFF),
    fondo: Color(0xFFF3F4F9),
    superficie: Color(0xFFFFFFFF),
    elevada: Color(0xFFECEEF6),
    borde: Color(0xFFE3E6F0),
    bordeFuerte: Color(0xFFCBD0E0),
    tinta: Color(0xFF141726),
    tintaSuave: Color(0xFF3E4259),
    tintaTenue: Color(0xFF6B708A),
    lateral: Color(0xFF141830),
    lateralElevada: Color(0xFF212747),
    lateralBorde: Color(0xFF252B4A),
    lateralTinta: Color(0xFFF4F5FA),
    lateralSuave: Color(0xFFC8CCE0),
    lateralTenue: Color(0xFF9399B8),
    lateralAcento: Color(0xFF9BA5FF),
    lateralAlerta: Color(0xFFFDA4AF),
  );

  /// Paleta para el tema oscuro («Noche índigo»).
  static const ColoresNocheIndigo oscuro = ColoresNocheIndigo(
    indigoMarca: Color(0xFF6366F1),
    indigoMarcaHover: Color(0xFF4F46E5),
    indigoFoco: Color(0xFF818CF8),
    indigoSuave: Color(0xFF1E2245),
    rosePeligro: Color(0xFFFB7185),
    rosePeligroHover: Color(0xFFF43F5E),
    roseSuave: Color(0xFF2D1620),
    amberAviso: Color(0xFFFBBF24),
    amberSuave: Color(0xFF2B2314),
    emeraldExito: Color(0xFF34D399),
    emeraldSuave: Color(0xFF122B23),
    sobreAcento: Color(0xFFFFFFFF),
    fondo: Color(0xFF0B0D16),
    superficie: Color(0xFF141724),
    elevada: Color(0xFF1C2032),
    borde: Color(0xFF23283D),
    bordeFuerte: Color(0xFF343B56),
    tinta: Color(0xFFF3F4F9),
    tintaSuave: Color(0xFFCBD0E3),
    tintaTenue: Color(0xFF8F95B2),
    lateral: Color(0xFF080A14),
    lateralElevada: Color(0xFF14182E),
    lateralBorde: Color(0xFF181C33),
    lateralTinta: Color(0xFFF4F5FA),
    lateralSuave: Color(0xFFC8CCE0),
    lateralTenue: Color(0xFF9399B8),
    lateralAcento: Color(0xFF9BA5FF),
    lateralAlerta: Color(0xFFFDA4AF),
  );

  @override
  ColoresNocheIndigo copyWith({
    Color? indigoMarca,
    Color? indigoMarcaHover,
    Color? indigoFoco,
    Color? indigoSuave,
    Color? rosePeligro,
    Color? rosePeligroHover,
    Color? roseSuave,
    Color? amberAviso,
    Color? amberSuave,
    Color? emeraldExito,
    Color? emeraldSuave,
    Color? sobreAcento,
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
    Color? lateralAlerta,
  }) {
    return ColoresNocheIndigo(
      indigoMarca: indigoMarca ?? this.indigoMarca,
      indigoMarcaHover: indigoMarcaHover ?? this.indigoMarcaHover,
      indigoFoco: indigoFoco ?? this.indigoFoco,
      indigoSuave: indigoSuave ?? this.indigoSuave,
      rosePeligro: rosePeligro ?? this.rosePeligro,
      rosePeligroHover: rosePeligroHover ?? this.rosePeligroHover,
      roseSuave: roseSuave ?? this.roseSuave,
      amberAviso: amberAviso ?? this.amberAviso,
      amberSuave: amberSuave ?? this.amberSuave,
      emeraldExito: emeraldExito ?? this.emeraldExito,
      emeraldSuave: emeraldSuave ?? this.emeraldSuave,
      sobreAcento: sobreAcento ?? this.sobreAcento,
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
      lateralAlerta: lateralAlerta ?? this.lateralAlerta,
    );
  }

  @override
  ColoresNocheIndigo lerp(ThemeExtension<ColoresNocheIndigo>? other, double t) {
    if (other is! ColoresNocheIndigo) return this;
    return ColoresNocheIndigo(
      indigoMarca: Color.lerp(indigoMarca, other.indigoMarca, t)!,
      indigoMarcaHover: Color.lerp(
        indigoMarcaHover,
        other.indigoMarcaHover,
        t,
      )!,
      indigoFoco: Color.lerp(indigoFoco, other.indigoFoco, t)!,
      indigoSuave: Color.lerp(indigoSuave, other.indigoSuave, t)!,
      rosePeligro: Color.lerp(rosePeligro, other.rosePeligro, t)!,
      rosePeligroHover: Color.lerp(
        rosePeligroHover,
        other.rosePeligroHover,
        t,
      )!,
      roseSuave: Color.lerp(roseSuave, other.roseSuave, t)!,
      amberAviso: Color.lerp(amberAviso, other.amberAviso, t)!,
      amberSuave: Color.lerp(amberSuave, other.amberSuave, t)!,
      emeraldExito: Color.lerp(emeraldExito, other.emeraldExito, t)!,
      emeraldSuave: Color.lerp(emeraldSuave, other.emeraldSuave, t)!,
      sobreAcento: Color.lerp(sobreAcento, other.sobreAcento, t)!,
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
      lateralAlerta: Color.lerp(lateralAlerta, other.lateralAlerta, t)!,
    );
  }
}

extension ColoresNocheIndigoContext on BuildContext {
  ColoresNocheIndigo get colores =>
      Theme.of(this).extension<ColoresNocheIndigo>() ??
      ColoresNocheIndigo.claro;
}
