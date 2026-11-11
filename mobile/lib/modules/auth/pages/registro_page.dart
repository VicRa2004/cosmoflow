import 'package:dio/dio.dart';
import 'package:flutter/material.dart';

import '../api/auth_api.dart';
import '../widgets/auth_layout.dart';
import '../widgets/boton_google.dart';
import '../widgets/google_oauth_sheet.dart';

/// Pantalla de registro de usuario (`/registro`) con estética «Noche índigo».
class RegistroPage extends StatefulWidget {
  const RegistroPage({super.key, required this.authApi});

  final AuthApi authApi;

  @override
  State<RegistroPage> createState() => _RegistroPageState();
}

class _RegistroPageState extends State<RegistroPage>
    with WidgetsBindingObserver {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController _nombreController = TextEditingController();
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
    return AuthLayout(
      formKey: _formKey,
      titulo: 'Crear cuenta',
      subtitulo: 'Empieza a organizar tus tareas y notas.',
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
              TextFormField(
                controller: _nombreController,
                textCapitalization: TextCapitalization.words,
                textInputAction: TextInputAction.next,
                autofillHints: const <String>[AutofillHints.name],
                decoration: const InputDecoration(
                  labelText: 'Nombre',
                  prefixIcon: Icon(Icons.person_outline_rounded),
                ),
                validator: (v) => (v == null || v.trim().length < 2)
                    ? 'Ingresa tu nombre (mínimo 2 caracteres)'
                    : null,
              ),
              const SizedBox(height: 16),
              CampoEmail(controller: _emailController),
              const SizedBox(height: 16),
              CampoPassword(
                controller: _passwordController,
                nueva: true,
                onSubmitted: (_) => _enviarFormulario(),
                validator: (v) => (v == null || v.length < 8)
                    ? 'La contraseña debe tener al menos 8 caracteres'
                    : null,
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),
        BotonEnviar(
          texto: 'Crear cuenta',
          cargando: _isCargando,
          onPressed: _ocupado ? null : _enviarFormulario,
        ),
      ],
    );
  }
}
