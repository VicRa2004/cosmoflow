import 'dart:convert';
import 'dart:typed_data';

import 'package:cosmoflow_mobile/core/api/api_client.dart';
import 'package:cosmoflow_mobile/core/auth/almacenamiento_seguro.dart';
import 'package:cosmoflow_mobile/core/auth/sesion_store.dart';
import 'package:cosmoflow_mobile/modules/auth/api/auth_api.dart';
import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';

class _AdaptadorMock implements HttpClientAdapter {
  _AdaptadorMock(this.handler);

  final Object? Function(RequestOptions options) handler;
  final List<RequestOptions> peticiones = <RequestOptions>[];

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    peticiones.add(options);
    return ResponseBody.fromString(
      jsonEncode(handler(options)),
      200,
      headers: <String, List<String>>{
        Headers.contentTypeHeader: <String>[Headers.jsonContentType],
      },
    );
  }

  @override
  void close({bool force = false}) {}
}

const _usuario = <String, dynamic>{
  'id': 1,
  'nombre': 'Ana',
  'email': 'ana@test.com',
  'emailVerificado': true,
  'isActivo': true,
  'roles': <String>[],
};

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late SesionStore sesion;
  late _AdaptadorMock adaptador;
  late AuthApi authApi;

  setUp(() {
    sesion = SesionStore(almacenamientoSeguro: MemoriaAlmacenamientoSeguro());
    final apiClient = ApiClient(sesionStore: sesion, baseUrl: 'http://api');
    adaptador = _AdaptadorMock((options) {
      switch (options.path) {
        case '/auth/login':
          return <String, dynamic>{
            'requiereDosPasos': true,
            'tokenDosPasos': 'tok-2fa',
          };
        case '/auth/login/dos-pasos':
          return <String, dynamic>{
            'accessToken': 'jwt',
            'refreshToken': 'refresh',
            'usuario': _usuario,
          };
        default:
          return <dynamic>[];
      }
    });
    apiClient.dio.httpClientAdapter = adaptador;
    authApi = AuthApi(apiClient: apiClient);
  });

  test(
    'con 2FA, login devuelve el token intermedio sin abrir sesión',
    () async {
      final token = await authApi.login(email: 'ana@test.com', password: 'x');

      expect(token, 'tok-2fa');
      expect(sesion.isAutenticado, isFalse);
    },
  );

  test('completarDosPasos envía token y código y abre la sesión', () async {
    await authApi.completarDosPasos(
      tokenDosPasos: 'tok-2fa',
      codigo: ' 123456 ',
    );

    final peticion = adaptador.peticiones.first;
    expect(peticion.path, '/auth/login/dos-pasos');
    expect(peticion.data, <String, dynamic>{
      'tokenDosPasos': 'tok-2fa',
      'codigo': '123456',
    });
    expect(sesion.isAutenticado, isTrue);
    expect(sesion.accessToken, 'jwt');
  });
}
