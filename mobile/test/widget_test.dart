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
    'Navega entre Login, Registro, Recuperar contraseña y el MainShell autenticado',
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

      // 1. Pantalla de Login inicial
      expect(find.text('Iniciar sesión'), findsOneWidget);

      // 2. Ir a Crear cuenta (/registro)
      await tester.tap(find.text('Crear cuenta'));
      await tester.pumpAndSettle();
      expect(find.text('Completa tus datos para comenzar a organizar tu trabajo.'), findsOneWidget);

      // 3. Volver a Login e ir a Recuperar contraseña
      await tester.tap(find.text('Iniciar sesión'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('¿Olvidaste tu contraseña?'));
      await tester.pumpAndSettle();
      expect(find.text('Recuperar contraseña'), findsOneWidget);

      // 4. Autenticar sesión -> redirige automáticamente a /dashboard dentro de MainShell
      sesionStore.establecerSesion(
        accessToken: 'jwt-test',
        usuario: const UsuarioSesion(
          id: 1,
          nombre: 'Ana',
          email: 'ana@cosmoflow.com',
          emailVerificado: true,
          roles: <String>['ADMIN'],
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Hola, Ana'), findsOneWidget);
      expect(find.text('Tareas'), findsWidgets);

      // 5. Cambiar a la pestaña de Notas desde la barra inferior
      await tester.tap(find.text('Notas'));
      await tester.pumpAndSettle();
      expect(find.text('Tus apuntes y documentos en Markdown.'), findsOneWidget);
    },
  );
}
