import 'package:cosmoflow_mobile/core/theme/tema_app.dart';
import 'package:cosmoflow_mobile/core/widgets/contenido_markdown.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('un enlace con esquema no permitido no se abre y avisa', (
    tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: TemaApp.claro,
        home: Scaffold(
          body: Builder(
            builder: (context) => TextButton(
              onPressed: () =>
                  ContenidoMarkdown.abrirEnlace(context, 'javascript:alert(1)'),
              child: const Text('abrir'),
            ),
          ),
        ),
      ),
    );
    await tester.tap(find.text('abrir'));
    await tester.pump();
    expect(find.text('No se pudo abrir el enlace.'), findsOneWidget);
  });
}
