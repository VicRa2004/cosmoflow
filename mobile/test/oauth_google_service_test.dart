import 'package:cosmoflow_mobile/core/api/api_client.dart';
import 'package:cosmoflow_mobile/core/auth/almacenamiento_seguro.dart';
import 'package:cosmoflow_mobile/core/auth/sesion_store.dart';
import 'package:cosmoflow_mobile/core/auth/usuario_sesion.dart';
import 'package:cosmoflow_mobile/modules/auth/api/auth_api.dart';
import 'package:cosmoflow_mobile/modules/auth/services/oauth_google_service.dart';
import 'package:flutter_test/flutter_test.dart';

class _AuthApiFalsa extends AuthApi {
  _AuthApiFalsa({required super.apiClient, required this.onRestaurar});

  final Future<bool> Function() onRestaurar;

  @override
  Future<bool> restaurarSesion() => onRestaurar();
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test(
    'OAuthGoogleService procesa exitosamente un deep link con refreshToken',
    () async {
      final almacenamiento = MemoriaAlmacenamientoSeguro();
      final sesionStore = SesionStore(almacenamientoSeguro: almacenamiento);
      final apiClient = ApiClient(sesionStore: sesionStore);

      var sesionRestaurada = false;
      final authApi = _AuthApiFalsa(
        apiClient: apiClient,
        onRestaurar: () async {
          sesionRestaurada = true;
          sesionStore.establecerSesion(
            accessToken: 'jwt_valido',
            usuario: const UsuarioSesion(
              id: 1,
              nombre: 'Carlos',
              email: 'carlos@test.com',
              emailVerificado: true,
            ),
          );
          return true;
        },
      );

      final service = OAuthGoogleService();

      final procesado = await service.procesarDeepLink(
        uri: Uri.parse(
          'cosmoflow://login-callback?refreshToken=token_secreto_123',
        ),
        authApi: authApi,
      );

      expect(procesado, isTrue);
      expect(
        await almacenamiento.leerRefreshToken(),
        equals('token_secreto_123'),
      );
      expect(sesionRestaurada, isTrue);
      expect(sesionStore.isAutenticado, isTrue);
    },
  );

  test('OAuthGoogleService ignora callbacks con error=google', () async {
    final almacenamiento = MemoriaAlmacenamientoSeguro();
    final sesionStore = SesionStore(almacenamientoSeguro: almacenamiento);
    final apiClient = ApiClient(sesionStore: sesionStore);

    var restaurarLlamado = false;
    final authApi = _AuthApiFalsa(
      apiClient: apiClient,
      onRestaurar: () async {
        restaurarLlamado = true;
        return true;
      },
    );

    final service = OAuthGoogleService();

    final procesado = await service.procesarDeepLink(
      uri: Uri.parse('cosmoflow://login-callback?error=google'),
      authApi: authApi,
    );

    expect(procesado, isFalse);
    expect(await almacenamiento.leerRefreshToken(), isNull);
    expect(restaurarLlamado, isFalse);
  });

  test('OAuthGoogleService ignora esquemas o hosts distintos', () async {
    final almacenamiento = MemoriaAlmacenamientoSeguro();
    final sesionStore = SesionStore(almacenamientoSeguro: almacenamiento);
    final apiClient = ApiClient(sesionStore: sesionStore);

    final authApi = _AuthApiFalsa(
      apiClient: apiClient,
      onRestaurar: () async => true,
    );

    final service = OAuthGoogleService();

    expect(
      await service.procesarDeepLink(
        uri: Uri.parse(
          'https://cosmoflow.saasil.mx/login-callback?refreshToken=123',
        ),
        authApi: authApi,
      ),
      isFalse,
    );

    expect(
      await service.procesarDeepLink(
        uri: Uri.parse('cosmoflow://otra-ruta?refreshToken=123'),
        authApi: authApi,
      ),
      isFalse,
    );
  });
}
