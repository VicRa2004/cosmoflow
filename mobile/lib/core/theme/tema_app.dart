import 'package:flutter/material.dart';
import 'colores_noche_indigo.dart';

/// Construcción de `ThemeData` claro y oscuro siguiendo `frontend/DESIGN.md`:
/// - Radios: `6px` en controles, `8px` en tarjetas.
/// - Profundidad por filetes de `1px`, sin sombras en tarjetas (`elevation: 0`).
class TemaApp {
  TemaApp._();

  static const double radioControl = 6.0;
  static const double radioTarjeta = 8.0;

  static ThemeData get claro => _construirTema(
        brightness: Brightness.light,
        paleta: ColoresNocheIndigo.claro,
      );

  static ThemeData get oscuro => _construirTema(
        brightness: Brightness.dark,
        paleta: ColoresNocheIndigo.oscuro,
      );

  static ThemeData _construirTema({
    required Brightness brightness,
    required ColoresNocheIndigo paleta,
  }) {
    final baseScheme = ColorScheme(
      brightness: brightness,
      primary: paleta.indigoMarca,
      onPrimary: Colors.white,
      secondary: paleta.elevada,
      onSecondary: paleta.tinta,
      error: paleta.rosePeligro,
      onError: Colors.white,
      surface: paleta.superficie,
      onSurface: paleta.tinta,
    );

    final bordeControl = OutlineInputBorder(
      borderRadius: BorderRadius.circular(radioControl),
      borderSide: BorderSide(color: paleta.borde, width: 1),
    );

    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      colorScheme: baseScheme,
      scaffoldBackgroundColor: paleta.fondo,
      dividerColor: paleta.borde,
      extensions: <ThemeExtension<dynamic>>[paleta],
      appBarTheme: AppBarTheme(
        backgroundColor: paleta.fondo,
        foregroundColor: paleta.tinta,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        shape: Border(bottom: BorderSide(color: paleta.borde, width: 1)),
        titleTextStyle: TextStyle(
          color: paleta.tinta,
          fontSize: 16,
          fontWeight: FontWeight.w600,
        ),
      ),
      cardTheme: CardThemeData(
        color: paleta.superficie,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radioTarjeta),
          side: BorderSide(color: paleta.borde, width: 1),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: paleta.superficie,
        isDense: true,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 12,
          vertical: 10,
        ),
        hintStyle: TextStyle(color: paleta.tintaTenue, fontSize: 14),
        labelStyle: TextStyle(
          color: paleta.tintaSuave,
          fontSize: 13,
          fontWeight: FontWeight.w500,
        ),
        border: bordeControl,
        enabledBorder: bordeControl,
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radioControl),
          borderSide: BorderSide(color: paleta.indigoFoco, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radioControl),
          borderSide: BorderSide(color: paleta.rosePeligro, width: 1),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: paleta.indigoMarca,
          foregroundColor: Colors.white,
          minimumSize: const Size(0, 36),
          padding: const EdgeInsets.symmetric(horizontal: 14),
          textStyle: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radioControl),
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          backgroundColor: paleta.superficie,
          foregroundColor: paleta.tinta,
          minimumSize: const Size(0, 36),
          padding: const EdgeInsets.symmetric(horizontal: 14),
          side: BorderSide(color: paleta.borde, width: 1),
          textStyle: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radioControl),
          ),
        ),
      ),
      textTheme: TextTheme(
        headlineSmall: TextStyle(
          color: paleta.tinta,
          fontSize: 20,
          fontWeight: FontWeight.w600,
          height: 1.4,
        ),
        titleMedium: TextStyle(
          color: paleta.tinta,
          fontSize: 16,
          fontWeight: FontWeight.w600,
          height: 1.5,
        ),
        bodyMedium: TextStyle(
          color: paleta.tinta,
          fontSize: 14,
          fontWeight: FontWeight.w400,
          height: 1.43,
        ),
        labelMedium: TextStyle(
          color: paleta.tintaSuave,
          fontSize: 13,
          fontWeight: FontWeight.w500,
          height: 1.5,
        ),
        bodySmall: TextStyle(
          color: paleta.tintaTenue,
          fontSize: 12,
          fontWeight: FontWeight.w400,
          height: 1.33,
        ),
      ),
    );
  }
}
