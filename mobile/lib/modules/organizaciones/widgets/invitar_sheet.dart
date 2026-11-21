import 'package:flutter/material.dart';

import '../../../core/theme/colores_noche_indigo.dart';

/// Bottom sheet de 1 campo para invitar a una persona por email (RN-12).
class InvitarSheet extends StatefulWidget {
  const InvitarSheet({super.key});

  @override
  State<InvitarSheet> createState() => _InvitarSheetState();
}

class _InvitarSheetState extends State<InvitarSheet> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController _emailController = TextEditingController();

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  void _enviar() {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    Navigator.of(context).pop(_emailController.text.trim());
  }

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final colores = context.colores;

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
            Text('Invitar miembro', style: textTheme.titleMedium),
            const SizedBox(height: 4),
            Text(
              'Si el email no tiene cuenta, podrá crearla desde el enlace.',
              style: textTheme.bodySmall?.copyWith(color: colores.tintaTenue),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _emailController,
              autofocus: true,
              keyboardType: TextInputType.emailAddress,
              textInputAction: TextInputAction.done,
              autocorrect: false,
              onFieldSubmitted: (_) => _enviar(),
              decoration: const InputDecoration(
                labelText: 'Email',
                hintText: 'persona@ejemplo.com',
              ),
              validator: (valor) {
                final email = valor?.trim() ?? '';
                if (email.isEmpty) return 'El email es obligatorio';
                final regex = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');
                if (!regex.hasMatch(email)) return 'Email no válido';
                return null;
              },
            ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: _enviar,
              child: const Text('Enviar invitación'),
            ),
          ],
        ),
      ),
    );
  }
}
