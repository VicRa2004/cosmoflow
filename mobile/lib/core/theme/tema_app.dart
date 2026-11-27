import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'colores_noche_indigo.dart';

/// `ThemeData` claro y oscuro: identidad «Noche índigo» con tipografía Inter,
/// tarjetas agrupadas estilo iOS/Notion, bordes sutiles de 1px y controles pulidos.
class TemaApp {
  TemaApp._();

  static const String fuente = 'Inter';

  // Escala de radios centralizada (evita `BorderRadius.circular` mágicos en vistas).
  static const double radioPequeno = 8.0;
  static const double radioChip = 10.0;
  static const double radioControl = 12.0;
  static const double radioTarjeta = 16.0;
  static const double radioDialogo = 20.0;
  static const double radioSheet = 24.0;
  static const double radioCompleto = 999.0;

  // Escala de espaciado y medidas táctiles (móvil).
  static const double margenPantalla = 16.0;
  static const double espacioSeccion = 20.0;
  static const double espacioCampo = 16.0;
  static const double espacioGrupo = 8.0;
  static const double altoBoton = 48.0;

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
    final esOscuro = brightness == Brightness.dark;
    final baseScheme = ColorScheme(
      brightness: brightness,
      primary: paleta.indigoMarca,
      onPrimary: paleta.sobreAcento,
      primaryContainer: paleta.indigoSuave,
      onPrimaryContainer: paleta.indigoMarca,
      secondary: paleta.elevada,
      onSecondary: paleta.tinta,
      secondaryContainer: paleta.elevada,
      onSecondaryContainer: paleta.tinta,
      error: paleta.rosePeligro,
      onError: paleta.sobreAcento,
      surface: paleta.superficie,
      onSurface: paleta.tinta,
      onSurfaceVariant: paleta.tintaTenue,
      outline: paleta.borde,
      outlineVariant: paleta.borde,
    );

    final bordeControl = OutlineInputBorder(
      borderRadius: BorderRadius.circular(radioControl),
      borderSide: BorderSide(color: paleta.borde, width: 1),
    );

    final textTheme = TextTheme(
      headlineMedium: TextStyle(
        fontFamily: fuente,
        color: paleta.tinta,
        fontSize: 26,
        fontWeight: FontWeight.w700,
        height: 1.25,
        letterSpacing: -0.6,
      ),
      headlineSmall: TextStyle(
        fontFamily: fuente,
        color: paleta.tinta,
        fontSize: 21,
        fontWeight: FontWeight.w600,
        height: 1.3,
        letterSpacing: -0.4,
      ),
      titleLarge: TextStyle(
        fontFamily: fuente,
        color: paleta.tinta,
        fontSize: 18,
        fontWeight: FontWeight.w600,
        height: 1.35,
        letterSpacing: -0.3,
      ),
      titleMedium: TextStyle(
        fontFamily: fuente,
        color: paleta.tinta,
        fontSize: 15.5,
        fontWeight: FontWeight.w600,
        height: 1.4,
        letterSpacing: -0.2,
      ),
      titleSmall: TextStyle(
        fontFamily: fuente,
        color: paleta.tinta,
        fontSize: 14,
        fontWeight: FontWeight.w600,
        height: 1.4,
        letterSpacing: -0.1,
      ),
      bodyLarge: TextStyle(
        fontFamily: fuente,
        color: paleta.tinta,
        fontSize: 15.5,
        fontWeight: FontWeight.w400,
        height: 1.45,
        letterSpacing: -0.1,
      ),
      bodyMedium: TextStyle(
        fontFamily: fuente,
        color: paleta.tinta,
        fontSize: 14,
        fontWeight: FontWeight.w400,
        height: 1.43,
      ),
      labelLarge: TextStyle(
        fontFamily: fuente,
        color: paleta.tintaSuave,
        fontSize: 13.5,
        fontWeight: FontWeight.w600,
        height: 1.4,
        letterSpacing: -0.1,
      ),
      labelMedium: TextStyle(
        fontFamily: fuente,
        color: paleta.tintaSuave,
        fontSize: 12.5,
        fontWeight: FontWeight.w500,
        height: 1.35,
        fontFeatures: const <FontFeature>[FontFeature.tabularFigures()],
      ),
      labelSmall: TextStyle(
        fontFamily: fuente,
        color: paleta.tintaTenue,
        fontSize: 11.5,
        fontWeight: FontWeight.w500,
        height: 1.3,
        fontFeatures: const <FontFeature>[FontFeature.tabularFigures()],
      ),
      bodySmall: TextStyle(
        fontFamily: fuente,
        color: paleta.tintaTenue,
        fontSize: 12.5,
        fontWeight: FontWeight.w400,
        height: 1.35,
        fontFeatures: const <FontFeature>[FontFeature.tabularFigures()],
      ),
    );

    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      fontFamily: fuente,
      colorScheme: baseScheme,
      scaffoldBackgroundColor: paleta.fondo,
      dividerColor: paleta.borde,
      splashFactory: InkSparkle.splashFactory,
      extensions: <ThemeExtension<dynamic>>[paleta],
      textTheme: textTheme,
      appBarTheme: AppBarTheme(
        backgroundColor: paleta.fondo,
        foregroundColor: paleta.tinta,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        titleSpacing: 16,
        systemOverlayStyle: esOscuro
            ? SystemUiOverlayStyle.light
            : SystemUiOverlayStyle.dark,
        iconTheme: IconThemeData(color: paleta.tintaSuave, size: 22),
        actionsIconTheme: IconThemeData(color: paleta.tintaSuave, size: 22),
        titleTextStyle: TextStyle(
          fontFamily: fuente,
          color: paleta.tinta,
          fontSize: 22,
          fontWeight: FontWeight.w700,
          letterSpacing: -0.5,
        ),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: paleta.superficie,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        height: 66,
        indicatorColor: paleta.indigoSuave,
        indicatorShape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radioControl),
        ),
        iconTheme: WidgetStateProperty.resolveWith<IconThemeData>((estados) {
          final activo = estados.contains(WidgetState.selected);
          return IconThemeData(
            size: 22,
            color: activo ? paleta.indigoMarca : paleta.tintaTenue,
          );
        }),
        labelTextStyle: WidgetStateProperty.resolveWith<TextStyle>((estados) {
          final activo = estados.contains(WidgetState.selected);
          return TextStyle(
            fontFamily: fuente,
            fontSize: 11.5,
            fontWeight: activo ? FontWeight.w600 : FontWeight.w500,
            letterSpacing: -0.1,
            color: activo ? paleta.indigoMarca : paleta.tintaTenue,
          );
        }),
      ),
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        backgroundColor: paleta.indigoMarca,
        foregroundColor: paleta.sobreAcento,
        elevation: 2,
        highlightElevation: 4,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radioTarjeta),
        ),
        extendedTextStyle: const TextStyle(
          fontFamily: fuente,
          fontSize: 14,
          fontWeight: FontWeight.w600,
          letterSpacing: -0.1,
        ),
      ),
      searchBarTheme: SearchBarThemeData(
        backgroundColor: WidgetStatePropertyAll<Color>(paleta.superficie),
        surfaceTintColor: const WidgetStatePropertyAll<Color>(
          Colors.transparent,
        ),
        elevation: const WidgetStatePropertyAll<double>(0),
        side: WidgetStatePropertyAll<BorderSide>(
          BorderSide(color: paleta.borde, width: 1),
        ),
        shape: WidgetStatePropertyAll<OutlinedBorder>(
          RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radioControl),
          ),
        ),
        constraints: const BoxConstraints(minHeight: 46, maxHeight: 46),
        padding: const WidgetStatePropertyAll<EdgeInsetsGeometry>(
          EdgeInsets.symmetric(horizontal: 14),
        ),
        hintStyle: WidgetStatePropertyAll<TextStyle>(
          TextStyle(
            fontFamily: fuente,
            color: paleta.tintaTenue,
            fontSize: 14.5,
            fontWeight: FontWeight.w400,
          ),
        ),
        textStyle: WidgetStatePropertyAll<TextStyle>(
          TextStyle(
            fontFamily: fuente,
            color: paleta.tinta,
            fontSize: 14.5,
            fontWeight: FontWeight.w400,
          ),
        ),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: paleta.superficie,
        selectedColor: paleta.indigoSuave,
        disabledColor: paleta.elevada,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        pressElevation: 0,
        showCheckmark: false,
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radioChip),
        ),
        side: WidgetStateBorderSide.resolveWith((estados) {
          final sel = estados.contains(WidgetState.selected);
          return BorderSide(
            color: sel ? paleta.indigoMarca.withValues(alpha: 0.4) : paleta.borde,
            width: 1,
          );
        }),
        labelStyle: TextStyle(
          fontFamily: fuente,
          fontSize: 13,
          fontWeight: FontWeight.w500,
          color: paleta.tintaSuave,
        ),
        secondaryLabelStyle: TextStyle(
          fontFamily: fuente,
          fontSize: 13,
          fontWeight: FontWeight.w600,
          color: paleta.indigoMarca,
        ),
        iconTheme: IconThemeData(size: 16, color: paleta.tintaSuave),
      ),
      segmentedButtonTheme: SegmentedButtonThemeData(
        style: ButtonStyle(
          backgroundColor: WidgetStateProperty.resolveWith<Color>((estados) {
            if (estados.contains(WidgetState.selected)) {
              return paleta.indigoSuave;
            }
            return paleta.superficie;
          }),
          foregroundColor: WidgetStateProperty.resolveWith<Color>((estados) {
            if (estados.contains(WidgetState.selected)) {
              return paleta.indigoMarca;
            }
            return paleta.tintaSuave;
          }),
          side: WidgetStatePropertyAll<BorderSide>(
            BorderSide(color: paleta.borde, width: 1),
          ),
          shape: WidgetStatePropertyAll<OutlinedBorder>(
            RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(radioControl),
            ),
          ),
          textStyle: const WidgetStatePropertyAll<TextStyle>(
            TextStyle(
              fontFamily: fuente,
              fontSize: 13.5,
              fontWeight: FontWeight.w600,
            ),
          ),
          padding: const WidgetStatePropertyAll<EdgeInsetsGeometry>(
            EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          ),
        ),
      ),
      checkboxTheme: CheckboxThemeData(
        shape: const CircleBorder(),
        side: BorderSide(color: paleta.bordeFuerte, width: 1.6),
        fillColor: WidgetStateProperty.resolveWith<Color?>((estados) {
          if (estados.contains(WidgetState.selected)) return paleta.indigoMarca;
          return Colors.transparent;
        }),
        checkColor: const WidgetStatePropertyAll<Color>(Colors.white),
      ),
      switchTheme: SwitchThemeData(
        thumbColor: WidgetStateProperty.resolveWith<Color>((estados) {
          if (estados.contains(WidgetState.selected)) return Colors.white;
          return paleta.tintaTenue;
        }),
        trackColor: WidgetStateProperty.resolveWith<Color>((estados) {
          if (estados.contains(WidgetState.selected)) return paleta.indigoMarca;
          return paleta.elevada;
        }),
        trackOutlineColor: WidgetStateProperty.resolveWith<Color>((estados) {
          if (estados.contains(WidgetState.selected)) return Colors.transparent;
          return paleta.borde;
        }),
      ),
      tabBarTheme: TabBarThemeData(
        indicatorColor: paleta.indigoMarca,
        labelColor: paleta.indigoMarca,
        unselectedLabelColor: paleta.tintaTenue,
        dividerColor: paleta.borde,
        indicatorSize: TabBarIndicatorSize.label,
        labelStyle: const TextStyle(
          fontFamily: fuente,
          fontSize: 13.5,
          fontWeight: FontWeight.w600,
        ),
        unselectedLabelStyle: const TextStyle(
          fontFamily: fuente,
          fontSize: 13.5,
          fontWeight: FontWeight.w500,
        ),
      ),
      popupMenuTheme: PopupMenuThemeData(
        color: paleta.superficie,
        surfaceTintColor: Colors.transparent,
        elevation: 6,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radioControl),
          side: BorderSide(color: paleta.borde, width: 1),
        ),
        textStyle: TextStyle(
          fontFamily: fuente,
          fontSize: 14,
          fontWeight: FontWeight.w500,
          color: paleta.tinta,
        ),
      ),
      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: paleta.superficie,
        surfaceTintColor: Colors.transparent,
        showDragHandle: true,
        dragHandleColor: paleta.bordeFuerte,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(radioSheet)),
        ),
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: paleta.superficie,
        surfaceTintColor: Colors.transparent,
        elevation: 8,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radioDialogo),
          side: BorderSide(color: paleta.borde, width: 1),
        ),
        titleTextStyle: TextStyle(
          fontFamily: fuente,
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: paleta.tinta,
          letterSpacing: -0.3,
        ),
        contentTextStyle: TextStyle(
          fontFamily: fuente,
          fontSize: 14.5,
          color: paleta.tintaSuave,
          height: 1.45,
        ),
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        backgroundColor: paleta.lateral,
        contentTextStyle: TextStyle(
          fontFamily: fuente,
          color: paleta.lateralTinta,
          fontSize: 13.5,
          fontWeight: FontWeight.w500,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radioControl),
        ),
      ),
      dividerTheme: DividerThemeData(
        color: paleta.borde,
        thickness: 1,
        space: 1,
      ),
      listTileTheme: ListTileThemeData(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
        iconColor: paleta.tintaSuave,
        minVerticalPadding: 10,
        titleTextStyle: textTheme.bodyLarge?.copyWith(
          fontWeight: FontWeight.w500,
        ),
        subtitleTextStyle: textTheme.bodySmall,
      ),
      cardTheme: CardThemeData(
        color: paleta.superficie,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        margin: EdgeInsets.zero,
        clipBehavior: Clip.antiAlias,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radioTarjeta),
          side: BorderSide(color: paleta.borde, width: 1),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: paleta.superficie,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 14,
          vertical: 14,
        ),
        hintStyle: TextStyle(
          fontFamily: fuente,
          color: paleta.tintaTenue,
          fontSize: 14.5,
        ),
        labelStyle: TextStyle(
          fontFamily: fuente,
          color: paleta.tintaSuave,
          fontSize: 13.5,
          fontWeight: FontWeight.w500,
        ),
        prefixIconColor: paleta.tintaTenue,
        suffixIconColor: paleta.tintaTenue,
        border: bordeControl,
        enabledBorder: bordeControl,
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radioControl),
          borderSide: BorderSide(color: paleta.indigoFoco, width: 1.6),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radioControl),
          borderSide: BorderSide(color: paleta.rosePeligro, width: 1.2),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radioControl),
          borderSide: BorderSide(color: paleta.rosePeligro, width: 1.6),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: paleta.indigoMarca,
          foregroundColor: paleta.sobreAcento,
          minimumSize: const Size(64, altoBoton),
          padding: const EdgeInsets.symmetric(horizontal: 20),
          elevation: 0,
          textStyle: const TextStyle(
            fontFamily: fuente,
            fontSize: 14.5,
            fontWeight: FontWeight.w600,
            letterSpacing: -0.1,
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
          minimumSize: const Size(64, altoBoton),
          padding: const EdgeInsets.symmetric(horizontal: 20),
          side: BorderSide(color: paleta.borde, width: 1),
          textStyle: const TextStyle(
            fontFamily: fuente,
            fontSize: 14.5,
            fontWeight: FontWeight.w600,
            letterSpacing: -0.1,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radioControl),
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: paleta.indigoMarca,
          textStyle: const TextStyle(
            fontFamily: fuente,
            fontSize: 14,
            fontWeight: FontWeight.w600,
            letterSpacing: -0.1,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radioChip),
          ),
        ),
      ),
    );
  }
}
