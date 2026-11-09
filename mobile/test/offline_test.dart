import 'dart:convert';
import 'dart:typed_data';
import 'package:cosmoflow_mobile/core/api/api_client.dart';
import 'package:cosmoflow_mobile/core/auth/almacenamiento_seguro.dart';
import 'package:cosmoflow_mobile/core/auth/sesion_store.dart';
import 'package:cosmoflow_mobile/core/auth/usuario_sesion.dart';
import 'package:cosmoflow_mobile/core/offline/cola_sin_conexion.dart';
import 'package:cosmoflow_mobile/modules/auth/api/auth_api.dart';
import 'package:cosmoflow_mobile/modules/notas/api/notas_api.dart';
import 'package:cosmoflow_mobile/modules/notas/models/carpeta_model.dart';
import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Responde con [responder]; `null` simula que no hay red.
class _AdaptadorFalso implements HttpClientAdapter {
  _AdaptadorFalso(this.responder);
  ResponseBody? Function(RequestOptions) responder;
  final List<String> peticiones = <String>[];
  final List<Object> claves = <Object>[];

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    peticiones.add('${options.method} ${options.path}');
    final clave = options.headers['Idempotency-Key'];
    if (clave != null) claves.add(clave);
    final respuesta = responder(options);
    if (respuesta == null) throw const SocketExceptionFalsa();
    return respuesta;
  }

  @override
  void close({bool force = false}) {}
}

class SocketExceptionFalsa implements Exception {
  const SocketExceptionFalsa();
}

ResponseBody _json(int status, Object cuerpo) => ResponseBody.fromString(
  jsonEncode(cuerpo),
  status,
  headers: <String, List<String>>{
    Headers.contentTypeHeader: <String>[Headers.jsonContentType],
  },
);

const _ana = UsuarioSesion(
  id: 1,
  nombre: 'Ana',
  email: 'ana@cosmoflow.com',
  emailVerificado: true,
);

({ApiClient api, _AdaptadorFalso red, _AdaptadorFalso redRefresh}) _cliente(
  SesionStore sesion,
) {
  final red = _AdaptadorFalso((_) => null);
  final redRefresh = _AdaptadorFalso((_) => null);
  final dio = Dio(BaseOptions(baseUrl: 'http://api'))..httpClientAdapter = red;
  final dioRefresh = Dio(BaseOptions(baseUrl: 'http://api'))
    ..httpClientAdapter = redRefresh;
  return (
    api: ApiClient(sesionStore: sesion, dio: dio, dioRefresh: dioRefresh),
    red: red,
    redRefresh: redRefresh,
  );
}

void main() {
  setUp(() => SharedPreferences.setMockInitialValues(<String, Object>{}));

  test(
    'sin red la nota queda en la cola y se envía al volver la conexión',
    () async {
      final sesion = SesionStore(
        almacenamientoSeguro: MemoriaAlmacenamientoSeguro(),
      )..establecerSesion(accessToken: 'jwt', usuario: _ana);
      final (:api, :red, redRefresh: _) = _cliente(sesion);
      final cola = ColaSinConexion(apiClient: api);
      final notas = NotasApi(apiClient: api, cola: cola);

      expect(await notas.crear(titulo: 'En el metro'), isNull);
      expect(await notas.crear(titulo: 'Inválida'), isNull);
      expect(cola.pendientes(1, '/notas').map((o) => o.titulo), <String>[
        'En el metro',
        'Inválida',
      ]);

      // Sobrevive a reiniciar la app.
      final recargada = ColaSinConexion(apiClient: api);
      await recargada.cargar();
      expect(recargada.pendientes(1, '/notas'), hasLength(2));

      // Vuelve la red: una se guarda y la otra la rechaza el servidor (se descarta).
      red.responder = (o) => (o.data as Map)['titulo'] == 'Inválida'
          ? _json(400, <String, String>{'error': 'mal'})
          : _json(201, <String, Object>{'id': 9, 'titulo': 'En el metro'});
      expect(await recargada.sincronizar(), 1);
      expect(recargada.pendientes(1, '/notas'), isEmpty);
      expect(red.peticiones.where((p) => p == 'POST /notas'), hasLength(4));
      // El reintento lleva la misma Idempotency-Key que el primer envío.
      expect(red.claves.sublist(2), red.claves.sublist(0, 2));
      expect(red.claves, hasLength(4));
      expect(red.claves.toSet(), hasLength(2));
    },
  );

  test('sin red al abrir la app entra con el último usuario', () async {
    final almacenamiento = MemoriaAlmacenamientoSeguro();
    await almacenamiento.guardarRefreshToken('rt');
    await almacenamiento.guardarUsuario(jsonEncode(_ana.toJson()));
    final sesion = SesionStore(almacenamientoSeguro: almacenamiento);
    final (:api, red: _, redRefresh: _) = _cliente(sesion);

    expect(await AuthApi(apiClient: api).restaurarSesion(), isFalse);
    expect(sesion.isAutenticado, isTrue);
    expect(sesion.sinConexion, isTrue);
    expect(sesion.usuario?.nombre, 'Ana');
  });

  test('un refresh rechazado (401) no entra sin conexión', () async {
    final almacenamiento = MemoriaAlmacenamientoSeguro();
    await almacenamiento.guardarRefreshToken('rt');
    await almacenamiento.guardarUsuario(jsonEncode(_ana.toJson()));
    final sesion = SesionStore(almacenamientoSeguro: almacenamiento);
    final (:api, red: _, :redRefresh) = _cliente(sesion);
    redRefresh.responder = (_) => _json(401, <String, String>{'error': 'x'});

    expect(await AuthApi(apiClient: api).restaurarSesion(), isFalse);
    expect(sesion.isAutenticado, isFalse);
  });

  test('carpetasEnArbol recorre en profundidad con su nivel', () {
    const carpetas = <CarpetaDto>[
      CarpetaDto(id: 1, nombre: 'Viajes'),
      CarpetaDto(id: 3, nombre: 'Trabajo'),
      CarpetaDto(id: 2, nombre: 'Europa', padreId: 1),
    ];
    expect(
      carpetasEnArbol(carpetas).map((e) => '${e.nivel}:${e.carpeta.nombre}'),
      <String>['0:Viajes', '1:Europa', '0:Trabajo'],
    );
  });
}
