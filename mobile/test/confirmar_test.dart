import 'package:cosmoflow_mobile/core/theme/tema_app.dart';
import 'package:cosmoflow_mobile/core/widgets/confirmar.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  for (final (boton, esperado) in <(String, bool)>[
    ('Cancelar', false),
    ('Eliminar', true),
  ]) {
    testWidgets('confirmar devuelve $esperado al pulsar $boton', (tester) async {
      bool? resultado;
      await tester.pumpWidget(
        MaterialApp(
          theme: TemaApp.claro,
          home: Builder(
            builder: (context) => TextButton(
              onPressed: () async => resultado = await confirmar(
                context,
                titulo: '¿Eliminar?',
                mensaje: 'No se puede deshacer.',
                accion: 'Eliminar',
              ),
              child: const Text('abrir'),
            ),
          ),
        ),
      );
      await tester.tap(find.text('abrir'));
      await tester.pumpAndSettle();
      await tester.tap(find.text(boton));
      await tester.pumpAndSettle();
      expect(resultado, esperado);
    });
  }
}
