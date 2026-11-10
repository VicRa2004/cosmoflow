import 'package:cosmoflow_mobile/core/theme/tema_app.dart';
import 'package:cosmoflow_mobile/core/widgets/editor_markdown.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('divide por líneas en blanco sin partir bloques de código', () {
    expect(
      EditorMarkdown.dividirBloques('# T\n\n\nuno\ndos\n\n```\na\n\nb\n```\n'),
      <String>['# T', 'uno\ndos', '```\na\n\nb\n```'],
    );
    expect(EditorMarkdown.dividirBloques('  \n'), isEmpty);
  });

  testWidgets('tocar un bloque lo edita y actualiza el texto completo', (
    tester,
  ) async {
    final controller = TextEditingController(text: '# Hola\n\nmundo');
    var cambios = 0;
    await tester.pumpWidget(
      MaterialApp(
        theme: TemaApp.claro,
        home: Scaffold(
          body: EditorMarkdown(
            controller: controller,
            hint: 'Escribe',
            onCambio: () => cambios++,
          ),
        ),
      ),
    );
    expect(find.byType(TextField), findsNothing);
    await tester.tap(find.text('mundo'));
    await tester.pump();
    await tester.enterText(find.byType(TextField), 'mundo **feliz**');
    expect(controller.text, '# Hola\n\nmundo **feliz**');
    expect(cambios, 1);
  });
}
