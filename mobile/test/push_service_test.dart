import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';

import 'package:cosmoflow_mobile/core/api/api_client.dart';
import 'package:cosmoflow_mobile/core/auth/almacenamiento_seguro.dart';
import 'package:cosmoflow_mobile/core/auth/sesion_store.dart';
import 'package:cosmoflow_mobile/core/auth/usuario_sesion.dart';
import 'package:cosmoflow_mobile/core/push/push_service.dart';
import 'package:dio/dio.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_test/flutter_test.dart';

class _AdaptadorMock implements HttpClientAdapter {
  _AdaptadorMock(this.handler);

  final ({int status, Object? body}) Function(RequestOptions options) handler;
  final List<RequestOptions> peticiones = <RequestOptions>[];

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    peticiones.add(options);
    final res = handler(options);
    final texto = res.body == null ? '' : jsonEncode(res.body);
    return ResponseBody.fromString(
      texto,
      res.status,
      headers: <String, List<String>>{
        Headers.contentTypeHeader: <String>[Headers.jsonContentType],
      },
    );
  }

  @override
  void close({bool force = false}) {}
}

void main() {
  test('rutaDesdeDatos mapea tarea y nota e ignora payloads inválidos', () {
    expect(
      PushService.rutaDesdeDatos(<String, dynamic>{
        'tipo': 'tarea',
        'id': '42',
      }),
      equals('/tareas/42'),
    );
    expect(
      PushService.rutaDesdeDatos(<String, dynamic>{'tipo': 'nota', 'id': 7}),
      equals('/notas/7'),
    );
    expect(
      PushService.rutaDesdeDatos(<String, dynamic>{'tipo': 'otro', 'id': '5'}),
      isNull,
    );
    expect(
      PushService.rutaDesdeDatos(<String, dynamic>{
        'tipo': 'tarea',
        'id': 'abc',
      }),
      isNull,
    );
  });

  test('no pide permiso ni registra token si GET /notificaciones/movil devuelve disponible=false', () async {
    final sesion = SesionStore(
      almacenamientoSeguro: MemoriaAlmacenamientoSeguro(),
    );
    final apiClient = ApiClient(sesionStore: sesion);
    final adaptador = _AdaptadorMock((req) {
      if (req.path == '/notificaciones/movil') {
        return (
          status: 200,
          body: <String, dynamic>{'disponible': false, 'dispositivos': 0},
        );
      }
      return (status: 204, body: null);
    });
    apiClient.dio.httpClientAdapter = adaptador;

    var permisoPedido = false;
    final service = PushService(
      apiClient: apiClient,
      solicitarPermiso: () async => permisoPedido = true,
      obtenerToken: () async => 'token-fcm',
      plataforma: 'android',
    );

    await service.registrar();

    expect(permisoPedido, isFalse);
    expect(
      adaptador.peticiones.where(
        (r) => r.path == '/notificaciones/dispositivos',
      ),
      isEmpty,
    );
  });

  test(
    'registra dispositivo cuando disponible=true y lo da de baja con darDeBaja',
    () async {
      final sesion = SesionStore(
        almacenamientoSeguro: MemoriaAlmacenamientoSeguro(),
      );
      final apiClient = ApiClient(sesionStore: sesion);
      final adaptador = _AdaptadorMock((req) {
        if (req.path == '/notificaciones/movil') {
          return (
            status: 200,
            body: <String, dynamic>{'disponible': true, 'dispositivos': 1},
          );
        }
        return (status: 204, body: null);
      });
      apiClient.dio.httpClientAdapter = adaptador;

      var registradoCallback = false;
      final service = PushService(
        apiClient: apiClient,
        solicitarPermiso: () async {},
        obtenerToken: () async => 'token-fcm-123',
        plataforma: 'android',
        onDispositivoRegistrado: () => registradoCallback = true,
      );

      await service.registrar();
      expect(registradoCallback, isTrue);

      final post = adaptador.peticiones.firstWhere(
        (r) => r.method == 'POST' && r.path == '/notificaciones/dispositivos',
      );
      expect(
        post.data,
        equals(<String, dynamic>{
          'token': 'token-fcm-123',
          'plataforma': 'android',
        }),
      );

      await service.darDeBaja();
      final del = adaptador.peticiones.firstWhere(
        (r) => r.method == 'DELETE' && r.path == '/notificaciones/dispositivos',
      );
      expect(del.data, equals(<String, dynamic>{'token': 'token-fcm-123'}));
    },
  );

  test('muestra notificación local en primer plano y navega al tocar (incluyendo cold start)', () async {
    final sesion = SesionStore(
      almacenamientoSeguro: MemoriaAlmacenamientoSeguro(),
    );
    final apiClient = ApiClient(sesionStore: sesion);
    apiClient.dio.httpClientAdapter = _AdaptadorMock(
      (_) => (
        status: 200,
        body: <String, dynamic>{'disponible': false, 'dispositivos': 0},
      ),
    );

    final ctrlPrimerPlano = StreamController<RemoteMessage>.broadcast();
    final ctrlAbierta = StreamController<RemoteMessage>.broadcast();
    final ctrlRefresco = StreamController<String>.broadcast();
    final locales = <({String titulo, String cuerpo, String? payload})>[];
    final navegadas = <String>[];

    final service = PushService(
      apiClient: apiClient,
      streamRefrescoToken: ctrlRefresco.stream,
      streamMensajePrimerPlano: ctrlPrimerPlano.stream,
      streamMensajeAbierto: ctrlAbierta.stream,
      obtenerMensajeInicial: () async => const RemoteMessage(
        data: <String, dynamic>{'tipo': 'nota', 'id': '9'},
      ),
      mostrarNotificacionLocal:
          ({
            required String titulo,
            required String cuerpo,
            String? payload,
          }) async {
            locales.add((titulo: titulo, cuerpo: cuerpo, payload: payload));
          },
    );

    service.iniciar();
    service.vincularNavegador(navegadas.add);
    await Future<void>.delayed(Duration.zero);

    // Cold start sin sesión aún: espera a que el usuario se autentique.
    expect(navegadas, isEmpty);

    sesion.establecerSesion(
      accessToken: 'jwt',
      usuario: const UsuarioSesion(
        id: 1,
        nombre: 'Ana',
        email: 'ana@test.com',
        emailVerificado: true,
      ),
    );
    expect(navegadas, equals(<String>['/notas/9']));

    // Mensaje en primer plano -> notificación local.
    ctrlPrimerPlano.add(
      const RemoteMessage(
        notification: RemoteNotification(
          title: 'Tarea asignada',
          body: 'Revisar release',
        ),
        data: <String, dynamic>{'tipo': 'tarea', 'id': '42'},
      ),
    );
    await Future<void>.delayed(Duration.zero);
    expect(locales.length, equals(1));
    expect(locales.first.titulo, equals('Tarea asignada'));
    expect(locales.first.payload, equals('/tareas/42'));

    // Toque desde segundo plano -> navega directamente.
    ctrlAbierta.add(
      const RemoteMessage(data: <String, dynamic>{'tipo': 'tarea', 'id': '42'}),
    );
    await Future<void>.delayed(Duration.zero);
    expect(navegadas, equals(<String>['/notas/9', '/tareas/42']));

    service.dispose();
    await ctrlPrimerPlano.close();
    await ctrlAbierta.close();
    await ctrlRefresco.close();
  });
}
