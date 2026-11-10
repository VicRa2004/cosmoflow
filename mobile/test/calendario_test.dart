import 'package:flutter_test/flutter_test.dart';
import 'package:cosmoflow_mobile/modules/tareas/pages/calendario_page.dart';

void main() {
  test('noviembre 2026 empieza en lunes 26-oct y cubre semanas completas', () {
    final dias = diasDelMes(2026, 11);
    expect(diaLocal(dias.first), '2026-10-26');
    expect(diaLocal(dias.last), '2026-12-06');
    expect(dias.length % 7, 0);
  });
}
