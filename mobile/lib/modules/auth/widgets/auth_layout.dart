import 'package:flutter/material.dart';
import '../../../core/theme/colores_noche_indigo.dart';

/// Esqueleto común de login, registro y recuperar contraseña: marca, título,
/// avisos y el formulario. En registro/recuperar la AppBar trae «atrás».
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
            padding: const EdgeInsets.fromLTRB(16, 24, 16, 32),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 400),
              child: Form(
                key: formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: <Widget>[
                    if (!puedeVolver) ...<Widget>[
                      Align(
                        alignment: Alignment.centerLeft,
                        child: Container(
                          width: 48,
                          height: 48,
                          decoration: BoxDecoration(
                            color: colores.indigoMarca,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          alignment: Alignment.center,
                          child: Text(
                            'C',
                            style: textTheme.headlineSmall?.copyWith(
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 32),
                    ],
                    Text(titulo, style: textTheme.headlineMedium),
                    const SizedBox(height: 8),
                    Text(
                      subtitulo,
                      style: textTheme.bodyLarge?.copyWith(
                        color: colores.tintaTenue,
                      ),
                    ),
                    const SizedBox(height: 32),
                    if (mensajeError != null)
                      _Aviso(
                        texto: mensajeError!,
                        icono: Icons.error_outline_rounded,
                        color: colores.rosePeligro,
                      ),
                    if (mensajeExito != null)
                      _Aviso(
                        texto: mensajeExito!,
                        icono: Icons.mark_email_read_outlined,
                        color: colores.indigoMarca,
                      ),
                    ...children,
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
  const _Aviso({required this.texto, required this.icono, required this.color});

  final String texto;
  final IconData icono;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        spacing: 12,
        children: <Widget>[
          Icon(icono, color: color, size: 20),
          Expanded(
            child: Text(
              texto,
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(color: color),
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
        prefixIcon: Icon(Icons.mail_outline_rounded),
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
        prefixIcon: const Icon(Icons.lock_outline_rounded),
        suffixIcon: IconButton(
          tooltip: _oculta ? 'Mostrar contraseña' : 'Ocultar contraseña',
          icon: Icon(
            _oculta ? Icons.visibility_outlined : Icons.visibility_off_outlined,
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
              child: CircularProgressIndicator(strokeWidth: 2),
            )
          : Text(texto),
    );
  }
}
