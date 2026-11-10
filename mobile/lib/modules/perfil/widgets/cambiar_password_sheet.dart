import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import '../../../core/theme/colores_noche_indigo.dart';
import '../../auth/api/auth_api.dart';

/// Diálogo modal para cambiar la contraseña de la cuenta (`PUT /api/auth/password`).
class CambiarPasswordSheet extends StatefulWidget {
  const CambiarPasswordSheet({super.key, required this.authApi});

  final AuthApi authApi;

  @override
  State<CambiarPasswordSheet> createState() => _CambiarPasswordSheetState();
}

class _CambiarPasswordSheetState extends State<CambiarPasswordSheet> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController _actualController = TextEditingController();
  final TextEditingController _nuevaController = TextEditingController();

  bool _isCargando = false;
  String? _mensajeError;

  @override
  void dispose() {
    _actualController.dispose();
    _nuevaController.dispose();
    super.dispose();
  }

  Future<void> _guardar() async {
    final form = _formKey.currentState;
    if (form == null || !form.validate()) return;

    setState(() {
      _isCargando = true;
      _mensajeError = null;
    });

    try {
      await widget.authApi.cambiarPassword(
        passwordActual: _actualController.text,
        passwordNueva: _nuevaController.text,
      );
      if (mounted) {
        Navigator.of(context).pop(true);
      }
    } on DioException catch (e) {
      final data = e.response?.data;
      final mensajeServidor = data is Map<String, dynamic>
          ? data['mensaje'] as String?
          : null;
      if (mounted) {
        setState(() {
          _mensajeError =
              mensajeServidor ?? 'No se pudo actualizar la contraseña.';
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _mensajeError = 'Ocurrió un error al actualizar la contraseña.';
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

    return Padding(
      padding: EdgeInsets.fromLTRB(
        16,
        0,
        16,
        16 + MediaQuery.viewInsetsOf(context).bottom,
      ),
      child: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            Text('Cambiar contraseña', style: textTheme.titleMedium),
            const SizedBox(height: 4),
            Text(
              'Se cerrarán tus demás sesiones activas.',
              style: textTheme.bodySmall,
            ),
            const SizedBox(height: 16),
            if (_mensajeError != null) ...<Widget>[
              Text(
                _mensajeError!,
                style: textTheme.bodyMedium?.copyWith(
                  color: colores.rosePeligro,
                ),
              ),
              const SizedBox(height: 12),
            ],
            TextFormField(
              controller: _actualController,
              obscureText: true,
              autofocus: true,
              textInputAction: TextInputAction.next,
              decoration: const InputDecoration(labelText: 'Contraseña actual'),
              validator: (valor) => (valor == null || valor.isEmpty)
                  ? 'Ingresa tu contraseña actual'
                  : null,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _nuevaController,
              obscureText: true,
              textInputAction: TextInputAction.done,
              onFieldSubmitted: (_) => _isCargando ? null : _guardar(),
              decoration: const InputDecoration(
                labelText: 'Nueva contraseña',
                helperText: 'Mínimo 8 caracteres',
              ),
              validator: (valor) => (valor == null || valor.length < 8)
                  ? 'Mínimo 8 caracteres'
                  : null,
            ),
            const SizedBox(height: 24),
            FilledButton(
              onPressed: _isCargando ? null : _guardar,
              child: _isCargando
                  ? const SizedBox.square(
                      dimension: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Guardar'),
            ),
          ],
        ),
      ),
    );
  }
}
