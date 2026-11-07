import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import '../../../core/theme/colores_noche_indigo.dart';
import '../../auth/api/auth_api.dart';

/// Diálogo modal para cambiar la contraseña de la cuenta (`PUT /api/auth/password`).
class CambiarPasswordDialog extends StatefulWidget {
  const CambiarPasswordDialog({super.key, required this.authApi});

  final AuthApi authApi;

  @override
  State<CambiarPasswordDialog> createState() => _CambiarPasswordDialogState();
}

class _CambiarPasswordDialogState extends State<CambiarPasswordDialog> {
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
      final mensajeServidor =
          data is Map<String, dynamic> ? data['mensaje'] as String? : null;
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

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 400),
        child: Padding(
          padding: const EdgeInsets.all(24),
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
                  const SizedBox(height: 12),
                ],
                Text('Contraseña actual', style: textTheme.labelMedium),
                const SizedBox(height: 6),
                TextFormField(
                  controller: _actualController,
                  obscureText: true,
                  decoration: const InputDecoration(hintText: '••••••••'),
                  validator: (valor) {
                    if (valor == null || valor.isEmpty) {
                      return 'Ingresa tu contraseña actual';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 12),
                Text('Nueva contraseña', style: textTheme.labelMedium),
                const SizedBox(height: 6),
                TextFormField(
                  controller: _nuevaController,
                  obscureText: true,
                  decoration: const InputDecoration(
                    hintText: 'Mínimo 8 caracteres',
                  ),
                  validator: (valor) {
                    if (valor == null || valor.length < 8) {
                      return 'Mínimo 8 caracteres';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 20),
                Wrap(
                  alignment: WrapAlignment.end,
                  spacing: 8,
                  children: <Widget>[
                    OutlinedButton(
                      onPressed:
                          _isCargando ? null : () => Navigator.of(context).pop(),
                      child: const Text('Cancelar'),
                    ),
                    FilledButton(
                      onPressed: _isCargando ? null : _guardar,
                      child: _isCargando
                          ? const SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Text('Guardar'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
