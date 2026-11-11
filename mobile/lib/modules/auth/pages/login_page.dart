import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../api/auth_api.dart';
import '../widgets/auth_layout.dart';
import '../widgets/boton_google.dart';
import '../widgets/google_oauth_sheet.dart';

/// Pantalla de inicio de sesión con estética «Noche índigo».
class LoginPage extends StatefulWidget {
  const LoginPage({super.key, required this.authApi});

  final AuthApi authApi;

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> with WidgetsBindingObserver {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();

  bool _isCargando = false;
  bool _isCargandoGoogle = false;
  String? _mensajeError;

  bool get _ocupado => _isCargando || _isCargandoGoogle;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed && _isCargandoGoogle) {
      Future<void>.delayed(const Duration(milliseconds: 1200), () {
        if (mounted &&
            _isCargandoGoogle &&
            !widget.authApi.apiClient.sesionStore.isAutenticado) {
          setState(() => _isCargandoGoogle = false);
        }
      });
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
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
          _mensajeError = 'No se pudo iniciar sesión con Google. Inténtalo de nuevo o usa tu email y contraseña.';
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
      await widget.authApi.login(
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
              mensajeServidor ??
              'No se pudo iniciar sesión. Verifica tus datos.';
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _mensajeError = 'Ocurrió un error inesperado al iniciar sesión.';
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
    return AuthLayout(
      formKey: _formKey,
      titulo: 'Iniciar sesión',
      subtitulo: 'Accede a tus tareas y notas.',
      mensajeError: _mensajeError,
      children: <Widget>[
        BotonGoogle(
          onPressed: _ocupado ? null : _continuarConGoogle,
          isCargando: _isCargandoGoogle,
        ),
        const SeparadorO(),
        AutofillGroup(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: <Widget>[
              CampoEmail(controller: _emailController),
              const SizedBox(height: 16),
              CampoPassword(
                controller: _passwordController,
                onSubmitted: (_) => _enviarFormulario(),
                validator: (v) =>
                    (v == null || v.isEmpty) ? 'Ingresa tu contraseña' : null,
              ),
            ],
          ),
        ),
        Align(
          alignment: Alignment.centerRight,
          child: TextButton(
            onPressed: () => context.push('/recuperar-password'),
            child: const Text('¿Olvidaste tu contraseña?'),
          ),
        ),
        const SizedBox(height: 8),
        BotonEnviar(
          texto: 'Entrar',
          cargando: _isCargando,
          onPressed: _ocupado ? null : _enviarFormulario,
        ),
        const SizedBox(height: 24),
        OutlinedButton(
          onPressed: () => context.push('/registro'),
          child: const Text('Crear cuenta'),
        ),
      ],
    );
  }
}
