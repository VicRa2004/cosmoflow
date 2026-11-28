import 'package:flutter/material.dart';

import '../../../core/auth/sesion_store.dart';
import '../../../core/theme/colores_noche_indigo.dart';
import '../../../core/theme/tema_app.dart';
import '../../../core/widgets/avisos.dart';
import '../api/perfil_api.dart';

/// Bottom sheet para confirmar la baja voluntaria de cuenta (`DELETE /api/cuenta`).
class EliminarCuentaSheet extends StatefulWidget {
  const EliminarCuentaSheet({
    super.key,
    required this.perfilApi,
    required this.sesionStore,
  });

  final PerfilApi perfilApi;
  final SesionStore sesionStore;

  @override
  State<EliminarCuentaSheet> createState() => _EliminarCuentaSheetState();
}

class _EliminarCuentaSheetState extends State<EliminarCuentaSheet> {
  final _formKey = GlobalKey<FormState>();
  final _passwordCtrl = TextEditingController();
  bool _ocupado = false;

  @override
  void dispose() {
    _passwordCtrl.dispose();
    super.dispose();
  }

  Future<void> _confirmarBaja() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    setState(() => _ocupado = true);
    try {
      final ok = await ejecutarConAviso(
        context,
        () => widget.perfilApi.eliminarCuenta(_passwordCtrl.text),
        error: 'No se pudo eliminar la cuenta. Revisa tu contraseña o si eres el único administrador de una organización.',
      );
      if (ok) {
        await widget.sesionStore.limpiarSesion();
        if (mounted) Navigator.of(context).pop(true);
      }
    } finally {
      if (mounted) setState(() => _ocupado = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final textTheme = Theme.of(context).textTheme;
    final bottom = MediaQuery.viewInsetsOf(context).bottom;

    return Padding(
      padding: EdgeInsets.fromLTRB(
        TemaApp.margenPantalla,
        4,
        TemaApp.margenPantalla,
        bottom + 24,
      ),
      child: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            Text(
              'Eliminar cuenta',
              style: textTheme.titleLarge?.copyWith(color: colores.rosePeligro),
            ),
            const SizedBox(height: 8),
            Text(
              'Esta acción es irreversible. Se borrarán tus tareas, notas, carpetas, tags, plantillas y sesiones personales.',
              style: textTheme.bodySmall,
            ),
            const SizedBox(height: TemaApp.espacioCampo),
            TextFormField(
              controller: _passwordCtrl,
              obscureText: true,
              decoration: const InputDecoration(
                labelText: 'Confirma tu contraseña',
              ),
              validator: (v) =>
                  (v == null || v.isEmpty) ? 'Introduce tu contraseña.' : null,
            ),
            const SizedBox(height: TemaApp.espacioSeccion),
            FilledButton(
              onPressed: _ocupado ? null : _confirmarBaja,
              style: FilledButton.styleFrom(
                backgroundColor: colores.rosePeligro,
                foregroundColor: colores.sobreAcento,
              ),
              child: const Text('Eliminar mi cuenta permanentemente'),
            ),
          ],
        ),
      ),
    );
  }
}
