import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../api/auth_api.dart';
import 'auth_layout.dart';

/// Segundo paso del login: código de la app autenticadora o de recuperación.
/// Al acertar, [AuthApi] establece la sesión y el router sale del login solo.
class CodigoDosPasosForm extends StatefulWidget {
  const CodigoDosPasosForm({
    super.key,
    required this.authApi,
    required this.tokenDosPasos,
    required this.onError,
    required this.onVolver,
  });

  final AuthApi authApi;
  final String tokenDosPasos;
  final ValueChanged<String?> onError;
  final VoidCallback onVolver;

  @override
  State<CodigoDosPasosForm> createState() => _CodigoDosPasosFormState();
}

class _CodigoDosPasosFormState extends State<CodigoDosPasosForm> {
  final TextEditingController _codigoController = TextEditingController();
  bool _conRecuperacion = false;
  bool _isCargando = false;

  @override
  void dispose() {
    _codigoController.dispose();
    super.dispose();
  }

  Future<void> _verificar() async {
    if (_codigoController.text.trim().length < 6) return;
    setState(() => _isCargando = true);
    widget.onError(null);
    try {
      await widget.authApi.completarDosPasos(
        tokenDosPasos: widget.tokenDosPasos,
        codigo: _codigoController.text,
      );
    } on DioException catch (e) {
      final data = e.response?.data;
      _codigoController.clear();
      widget.onError(
        (data is Map<String, dynamic> ? data['mensaje'] as String? : null) ??
            'No se pudo verificar el código.',
      );
    } finally {
      if (mounted) setState(() => _isCargando = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: <Widget>[
        Text(
          _conRecuperacion
              ? 'Escribe uno de tus códigos de recuperación. Cada uno sirve una sola vez.'
              : 'Escribe el código de 6 dígitos de tu app autenticadora.',
        ),
        const SizedBox(height: 16),
        TextField(
          key: const Key('codigoDosPasos'),
          controller: _codigoController,
          autofocus: true,
          autofillHints: const <String>[AutofillHints.oneTimeCode],
          keyboardType: _conRecuperacion
              ? TextInputType.text
              : TextInputType.number,
          inputFormatters: _conRecuperacion
              ? null
              : <TextInputFormatter>[
                  FilteringTextInputFormatter.digitsOnly,
                  LengthLimitingTextInputFormatter(6),
                ],
          decoration: InputDecoration(
            labelText: _conRecuperacion ? 'Código de recuperación' : 'Código',
            hintText: _conRecuperacion ? 'xxxxx-xxxxx' : '123456',
          ),
          onSubmitted: (_) => _verificar(),
        ),
        const SizedBox(height: 24),
        BotonEnviar(
          texto: 'Verificar',
          cargando: _isCargando,
          onPressed: _isCargando ? null : _verificar,
        ),
        const SizedBox(height: 8),
        TextButton(
          onPressed: () => setState(() {
            _conRecuperacion = !_conRecuperacion;
            _codigoController.clear();
          }),
          child: Text(
            _conRecuperacion
                ? 'Usar la app autenticadora'
                : 'Usar un código de recuperación',
          ),
        ),
        TextButton(onPressed: widget.onVolver, child: const Text('Volver')),
      ],
    );
  }
}
