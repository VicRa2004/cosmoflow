import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/colores_noche_indigo.dart';
import '../api/auth_api.dart';
import '../widgets/boton_google.dart';
import '../widgets/google_oauth_sheet.dart';

/// Pantalla de registro de usuario (`/registro`) con estética «Noche índigo».
class RegistroPage extends StatefulWidget {
  const RegistroPage({super.key, required this.authApi});

  final AuthApi authApi;

  @override
  State<RegistroPage> createState() => _RegistroPageState();
}

class _RegistroPageState extends State<RegistroPage> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController _nombreController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();

  bool _isCargando = false;
  bool _isCargandoGoogle = false;
  String? _mensajeError;

  bool get _ocupado => _isCargando || _isCargandoGoogle;

  @override
  void dispose() {
    _nombreController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _continuarConGoogle() async {
    setState(() {
      _isCargandoGoogle = true;
      _mensajeError = null;
    });

    try {
      await autenticarConGoogleModal(context: context, authApi: widget.authApi);
    } on OAuthGoogleException catch (e) {
      if (mounted) {
        setState(() => _mensajeError = e.mensaje);
      }
    } on DioException {
      if (mounted) {
        setState(() {
          _mensajeError = 'No se pudo continuar con Google. Inténtalo de nuevo o regístrate con tu email.';
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _mensajeError = 'Ocurrió un error al conectar con Google.';
        });
      }
    } finally {
      if (mounted) {
        setState(() => _isCargandoGoogle = false);
      }
    }
  }

  Future<void> _enviarFormulario() async {
    final form = _formKey.currentState;
    if (form == null || !form.validate()) return;

    setState(() {
      _isCargando = true;
      _mensajeError = null;
    });

    try {
      await widget.authApi.registro(
        nombre: _nombreController.text,
        email: _emailController.text,
        password: _passwordController.text,
      );
    } on DioException catch (e) {
      final data = e.response?.data;
      final mensajeServidor = data is Map<String, dynamic>
          ? data['mensaje'] as String?
          : null;
      if (mounted) {
        setState(() {
          _mensajeError =
              mensajeServidor ?? 'No se pudo completar el registro.';
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _mensajeError = 'Ocurrió un error inesperado al registrarte.';
        });
      }
    } finally {
      if (mounted) {
        setState(() {
          _isCargando = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final textTheme = Theme.of(context).textTheme;

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 384),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: <Widget>[
                    Row(
                      children: <Widget>[
                        Container(
                          width: 36,
                          height: 36,
                          decoration: BoxDecoration(
                            color: colores.indigoMarca,
                            borderRadius: BorderRadius.circular(6),
                          ),
                          alignment: Alignment.center,
                          child: const Text(
                            'C',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Text('Cosmoflow', style: textTheme.titleMedium),
                      ],
                    ),
                    const SizedBox(height: 24),
                    Text(
                      'Crear cuenta',
                      style: textTheme.headlineSmall?.copyWith(fontSize: 24),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Completa tus datos para comenzar a organizar tu trabajo.',
                      style: textTheme.bodyMedium?.copyWith(
                        color: colores.tintaTenue,
                      ),
                    ),
                    const SizedBox(height: 24),
                    if (_mensajeError != null) ...<Widget>[
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 10,
                        ),
                        decoration: BoxDecoration(
                          color: colores.rosePeligro.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(
                            color: colores.rosePeligro.withValues(alpha: 0.4),
                          ),
                        ),
                        child: Text(
                          _mensajeError!,
                          style: textTheme.bodySmall?.copyWith(
                            color: colores.rosePeligro,
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],
                    BotonGoogle(
                      onPressed: _ocupado ? null : _continuarConGoogle,
                      isCargando: _isCargandoGoogle,
                    ),
                    const SeparadorO(),
                    Text('Nombre', style: textTheme.labelMedium),
                    const SizedBox(height: 6),
                    TextFormField(
                      controller: _nombreController,
                      textInputAction: TextInputAction.next,
                      decoration: const InputDecoration(
                        hintText: 'Tu nombre completo',
                      ),
                      validator: (valor) {
                        if (valor == null || valor.trim().length < 2) {
                          return 'Ingresa tu nombre (mínimo 2 caracteres)';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),
                    Text('Email', style: textTheme.labelMedium),
                    const SizedBox(height: 6),
                    TextFormField(
                      controller: _emailController,
                      keyboardType: TextInputType.emailAddress,
                      textInputAction: TextInputAction.next,
                      decoration: const InputDecoration(
                        hintText: 'nombre@empresa.com',
                      ),
                      validator: (valor) {
                        if (valor == null || valor.trim().isEmpty) {
                          return 'Ingresa tu email';
                        }
                        if (!valor.contains('@')) {
                          return 'Ingresa un email válido';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),
                    Text('Contraseña', style: textTheme.labelMedium),
                    const SizedBox(height: 6),
                    TextFormField(
                      controller: _passwordController,
                      obscureText: true,
                      textInputAction: TextInputAction.done,
                      onFieldSubmitted: (_) => _enviarFormulario(),
                      decoration: const InputDecoration(
                        hintText: 'Mínimo 8 caracteres',
                      ),
                      validator: (valor) {
                        if (valor == null || valor.length < 8) {
                          return 'La contraseña debe tener al menos 8 caracteres';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 24),
                    FilledButton(
                      onPressed: _ocupado ? null : _enviarFormulario,
                      child: _isCargando
                          ? const SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Text('Crear cuenta'),
                    ),
                    const SizedBox(height: 16),
                    Wrap(
                      alignment: WrapAlignment.center,
                      crossAxisAlignment: WrapCrossAlignment.center,
                      spacing: 4,
                      children: <Widget>[
                        Text('¿Ya tienes cuenta?', style: textTheme.bodySmall),
                        TextButton(
                          onPressed: () => context.go('/login'),
                          child: const Text('Iniciar sesión'),
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
    );
  }
}
