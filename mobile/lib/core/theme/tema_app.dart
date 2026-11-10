import 'package:flutter/material.dart';
import 'colores_noche_indigo.dart';

/// `ThemeData` claro y oscuro: identidad de `frontend/DESIGN.md` con medidas móviles
/// (skill `disenar-pantallas-mobile`): radios 8/12, controles de 48 dp, cuerpo de 16.
/// - Profundidad por filetes de `1px`, sin sombras en tarjetas (`elevation: 0`).
class TemaApp {
  TemaApp._();

  static const double radioControl = 8.0;
  static const double radioTarjeta = 12.0;

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
        titleTextStyle: TextStyle(
          color: paleta.tinta,
          fontSize: 20,
          fontWeight: FontWeight.w600,
        ),
      ),
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        backgroundColor: paleta.indigoMarca,
        foregroundColor: Colors.white,
        elevation: 2,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: paleta.superficie,
        showDragHandle: true,
        dragHandleColor: paleta.bordeFuerte,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: paleta.superficie,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radioTarjeta * 2),
        ),
      ),
      snackBarTheme: const SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
      ),
      dividerTheme: DividerThemeData(
        color: paleta.borde,
        thickness: 1,
        space: 1,
      ),
      listTileTheme: ListTileThemeData(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16),
        iconColor: paleta.tintaSuave,
        minVerticalPadding: 12,
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
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 12,
          vertical: 14,
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
          minimumSize: const Size(64, 48),
          padding: const EdgeInsets.symmetric(horizontal: 20),
          textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radioControl),
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          backgroundColor: paleta.superficie,
          foregroundColor: paleta.tinta,
          minimumSize: const Size(64, 48),
          padding: const EdgeInsets.symmetric(horizontal: 20),
          side: BorderSide(color: paleta.borde, width: 1),
          textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radioControl),
          ),
        ),
      ),
      textTheme: TextTheme(
        headlineMedium: TextStyle(
          color: paleta.tinta,
          fontSize: 26,
          fontWeight: FontWeight.w600,
          height: 1.3,
          letterSpacing: -0.4,
        ),
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
        bodyLarge: TextStyle(
          color: paleta.tinta,
          fontSize: 16,
          fontWeight: FontWeight.w400,
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
