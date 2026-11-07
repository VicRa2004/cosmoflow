import 'package:cosmoflow_mobile/core/api/api_client.dart';
import 'package:cosmoflow_mobile/core/api/auth_interceptor.dart';
import 'package:cosmoflow_mobile/core/auth/almacenamiento_seguro.dart';
import 'package:cosmoflow_mobile/core/auth/sesion_store.dart';
import 'package:cosmoflow_mobile/core/auth/usuario_sesion.dart';
import 'package:cosmoflow_mobile/main.dart';
import 'package:cosmoflow_mobile/modules/auth/api/auth_api.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('AuthInterceptor extrae el refresh_token del header Set-Cookie', () {
    const headers = <String>[
      'refresh_token=token_secreto_123; Path=/api/auth; HttpOnly; SameSite=Strict',
    ];

    final extraido = AuthInterceptor.extraerRefreshTokenDeCookies(headers);
    expect(extraido, equals('token_secreto_123'));
  });

  testWidgets(
    'Redirige a /login cuando no hay sesión y a /dashboard al autenticarse',
    (WidgetTester tester) async {
      final almacenamiento = MemoriaAlmacenamientoSeguro();
      final sesionStore = SesionStore(almacenamientoSeguro: almacenamiento);
      final apiClient = ApiClient(sesionStore: sesionStore);
      final authApi = AuthApi(apiClient: apiClient);

      await tester.pumpWidget(
        CosmoflowMobileApp(
          sesionStore: sesionStore,
          authApi: authApi,
          restaurarAlIniciar: false,
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Iniciar sesión'), findsOneWidget);
      expect(find.text('Entrar'), findsOneWidget);

      sesionStore.establecerSesion(
        accessToken: 'jwt-test',
        usuario: const UsuarioSesion(
          id: 1,
          nombre: 'Ana',
          email: 'ana@cosmoflow.com',
          emailVerificado: true,
          roles: <String>['admin'],
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Hola, Ana'), findsOneWidget);
      expect(find.text('Email: ana@cosmoflow.com'), findsOneWidget);
    },
  );
}
