import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import '../api/auth_api.dart';
import '../widgets/auth_layout.dart';

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
      final mensajeServidor = data is Map<String, dynamic>
          ? data['mensaje'] as String?
          : null;
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
    return AuthLayout(
      formKey: _formKey,
      titulo: 'Recuperar contraseña',
      subtitulo: 'Te enviaremos un enlace para restablecerla.',
      mensajeError: _mensajeError,
      mensajeExito: _mensajeExito,
      children: <Widget>[
        CampoEmail(
          controller: _emailController,
          onSubmitted: (_) => _enviarFormulario(),
        ),
        const SizedBox(height: 24),
        BotonEnviar(
          texto: 'Enviar enlace',
          cargando: _isCargando,
          onPressed: _isCargando ? null : _enviarFormulario,
        ),
      ],
    );
  }
}
