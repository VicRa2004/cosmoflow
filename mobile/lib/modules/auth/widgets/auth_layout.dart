import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../../core/theme/colores_noche_indigo.dart';
import '../../../core/theme/tema_app.dart';

/// Esqueleto común de login, registro y recuperar contraseña: marca Cosmoflow,
/// cabecera limpia y formulario agrupado en una tarjeta de superficie.
class AuthLayout extends StatelessWidget {
  const AuthLayout({
    super.key,
    required this.formKey,
    required this.titulo,
    required this.subtitulo,
    required this.children,
    this.mensajeError,
    this.mensajeExito,
  });

  final GlobalKey<FormState> formKey;
  final String titulo;
  final String subtitulo;
  final String? mensajeError;
  final String? mensajeExito;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final textTheme = Theme.of(context).textTheme;
    final puedeVolver = Navigator.of(context).canPop();

    return Scaffold(
      appBar: puedeVolver ? AppBar() : null,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(16, 20, 16, 32),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Form(
                key: formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: <Widget>[
                    if (!puedeVolver) ...<Widget>[
                      Row(
                        children: <Widget>[
                          Container(
                            width: 42,
                            height: 42,
                            decoration: BoxDecoration(
                              color: colores.indigoMarca,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            alignment: Alignment.center,
                            child: const Icon(
                              LucideIcons.sparkles,
                              color: Colors.white,
                              size: 20,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Text(
                            'Cosmoflow',
                            style: textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.w700,
                              letterSpacing: -0.4,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 28),
                    ],
                    Text(titulo, style: textTheme.headlineMedium),
                    const SizedBox(height: 6),
                    Text(
                      subtitulo,
                      style: textTheme.bodyMedium?.copyWith(
                        color: colores.tintaTenue,
                      ),
                    ),
                    const SizedBox(height: 24),
                    Material(
                      color: colores.superficie,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(
                          TemaApp.radioTarjeta + 4,
                        ),
                        side: BorderSide(color: colores.borde, width: 1),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: <Widget>[
                            if (mensajeError != null)
                              _Aviso(
                                texto: mensajeError!,
                                icono: LucideIcons.circleAlert,
                                color: colores.rosePeligro,
                                fondo: colores.roseSuave,
                              ),
                            if (mensajeExito != null)
                              _Aviso(
                                texto: mensajeExito!,
                                icono: LucideIcons.mailCheck,
                                color: colores.indigoMarca,
                                fondo: colores.indigoSuave,
                              ),
                            ...children,
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _Aviso extends StatelessWidget {
  const _Aviso({
    required this.texto,
    required this.icono,
    required this.color,
    required this.fondo,
  });

  final String texto;
  final IconData icono;
  final Color color;
  final Color fondo;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: fondo,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.25)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        spacing: 10,
        children: <Widget>[
          Icon(icono, color: color, size: 18),
          Expanded(
            child: Text(
              texto,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: color,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Email con teclado y autocompletado correctos.
class CampoEmail extends StatelessWidget {
  const CampoEmail({super.key, required this.controller, this.onSubmitted});

  final TextEditingController controller;
  final ValueChanged<String>? onSubmitted;

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      keyboardType: TextInputType.emailAddress,
      autofillHints: const <String>[AutofillHints.email],
      autocorrect: false,
      textInputAction: onSubmitted == null
          ? TextInputAction.next
          : TextInputAction.done,
      onFieldSubmitted: onSubmitted,
      decoration: const InputDecoration(
        labelText: 'Email',
        prefixIcon: Icon(LucideIcons.mail, size: 18),
      ),
      validator: (v) {
        if (v == null || v.trim().isEmpty) return 'Ingresa tu email';
        if (!v.contains('@')) return 'Ingresa un email válido';
        return null;
      },
    );
  }
}

/// Contraseña con botón para mostrarla.
class CampoPassword extends StatefulWidget {
  const CampoPassword({
    super.key,
    required this.controller,
    required this.validator,
    this.nueva = false,
    this.onSubmitted,
  });

  final TextEditingController controller;
  final FormFieldValidator<String> validator;

  /// `true` en registro: el gestor de contraseñas propone una nueva.
  final bool nueva;
  final ValueChanged<String>? onSubmitted;

  @override
  State<CampoPassword> createState() => _CampoPasswordState();
}

class _CampoPasswordState extends State<CampoPassword> {
  bool _oculta = true;

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: widget.controller,
      obscureText: _oculta,
      autofillHints: <String>[
        widget.nueva ? AutofillHints.newPassword : AutofillHints.password,
      ],
      textInputAction: TextInputAction.done,
      onFieldSubmitted: widget.onSubmitted,
      validator: widget.validator,
      decoration: InputDecoration(
        labelText: 'Contraseña',
        helperText: widget.nueva ? 'Mínimo 8 caracteres' : null,
        prefixIcon: const Icon(LucideIcons.lock, size: 18),
        suffixIcon: IconButton(
          tooltip: _oculta ? 'Mostrar contraseña' : 'Ocultar contraseña',
          icon: Icon(
            _oculta ? LucideIcons.eye : LucideIcons.eyeOff,
            size: 18,
          ),
          onPressed: () => setState(() => _oculta = !_oculta),
        ),
      ),
    );
  }
}

/// Botón principal a ancho completo con indicador mientras carga.
class BotonEnviar extends StatelessWidget {
  const BotonEnviar({
    super.key,
    required this.texto,
    required this.cargando,
    required this.onPressed,
  });

  final String texto;
  final bool cargando;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    return FilledButton(
      onPressed: onPressed,
      child: cargando
          ? const SizedBox.square(
              dimension: 20,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: Colors.white,
              ),
            )
          : Text(texto),
    );
  }
}
