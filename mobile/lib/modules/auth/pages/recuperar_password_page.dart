import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/colores_noche_indigo.dart';
import '../api/auth_api.dart';

/// Pantalla de solicitud de enlace de recuperación (`/recuperar-password`).
class RecuperarPasswordPage extends StatefulWidget {
  const RecuperarPasswordPage({super.key, required this.authApi});

  final AuthApi authApi;

  @override
  State<RecuperarPasswordPage> createState() => _RecuperarPasswordPageState();
}

class _RecuperarPasswordPageState extends State<RecuperarPasswordPage> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController _emailController = TextEditingController();

  bool _isCargando = false;
  String? _mensajeError;
  String? _mensajeExito;

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _enviarFormulario() async {
    final form = _formKey.currentState;
    if (form == null || !form.validate()) return;

    setState(() {
      _isCargando = true;
      _mensajeError = null;
      _mensajeExito = null;
    });

    try {
      final respuesta = await widget.authApi.recuperarPassword(
        email: _emailController.text,
      );
      if (mounted) {
        setState(() {
          _mensajeExito = respuesta;
        });
      }
    } on DioException catch (e) {
      final data = e.response?.data;
      final mensajeServidor =
          data is Map<String, dynamic> ? data['mensaje'] as String? : null;
      if (mounted) {
        setState(() {
          _mensajeError =
              mensajeServidor ?? 'No se pudo procesar la solicitud.';
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _mensajeError = 'Ocurrió un error inesperado.';
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
                      'Recuperar contraseña',
                      style: textTheme.headlineSmall?.copyWith(fontSize: 24),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Te enviaremos un enlace a tu correo para restablecer tu contraseña.',
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
                    if (_mensajeExito != null) ...<Widget>[
                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Text(
                            _mensajeExito!,
                            style: textTheme.bodyMedium?.copyWith(
                              color: colores.tintaSuave,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],
                    Text('Email', style: textTheme.labelMedium),
                    const SizedBox(height: 6),
                    TextFormField(
                      controller: _emailController,
                      keyboardType: TextInputType.emailAddress,
                      textInputAction: TextInputAction.done,
                      onFieldSubmitted: (_) => _enviarFormulario(),
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
                    const SizedBox(height: 24),
                    FilledButton(
                      onPressed: _isCargando ? null : _enviarFormulario,
                      child: _isCargando
                          ? const SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Text('Enviar enlace'),
                    ),
                    const SizedBox(height: 16),
                    Center(
                      child: TextButton(
                        onPressed: () => context.go('/login'),
                        child: const Text('Volver a iniciar sesión'),
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
