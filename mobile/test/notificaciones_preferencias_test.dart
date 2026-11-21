import 'dart:convert';
import 'dart:typed_data';

import 'package:cosmoflow_mobile/core/api/api_client.dart';
import 'package:cosmoflow_mobile/core/auth/almacenamiento_seguro.dart';
import 'package:cosmoflow_mobile/core/auth/sesion_store.dart';
import 'package:cosmoflow_mobile/core/theme/tema_app.dart';
import 'package:cosmoflow_mobile/modules/notificaciones/api/notificaciones_api.dart';
import 'package:cosmoflow_mobile/modules/notificaciones/models/notificacion_models.dart';
import 'package:cosmoflow_mobile/modules/notificaciones/pages/notificaciones_preferencias_page.dart';
import 'package:cosmoflow_mobile/modules/notificaciones/preferencias_push_prompt.dart';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

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
    return ResponseBody.fromString(
      res.body == null ? '' : jsonEncode(res.body),
      res.status,
      headers: <String, List<String>>{
        Headers.contentTypeHeader: <String>[Headers.jsonContentType],
      },
    );
  }

  @override
  void close({bool force = false}) {}
}

List<Map<String, dynamic>> _preferenciasIniciales() => <Map<String, dynamic>>[
  for (final evento
      in etiquetasEventoNotificacion.keys) ...<Map<String, dynamic>>[
    <String, dynamic>{
      'evento': evento,
      'canal': 'app',
      'activo': true,
      'personalizado': true,
    },
    <String, dynamic>{
      'evento': evento,
      'canal': 'correo',
      'activo': true,
      'personalizado': true,
    },
    <String, dynamic>{
      'evento': evento,
      'canal': 'movil',
      'activo': false,
      'personalizado': true,
    },
    <String, dynamic>{
      'evento': evento,
      'canal': 'telegram',
      'activo': false,
      'personalizado': true,
    },
  ],
];

void main() {
  test('construirPreferenciasSoloMovil activa móvil y desactiva correo en todos los eventos', () {
    final actuales = _preferenciasIniciales()
        .map(PreferenciaNotificacionDto.fromJson)
        .toList(growable: false);

    expect(debeOfrecerSoloMovil(actuales), isTrue);

    final lote = construirPreferenciasSoloMovil(actuales);
    expect(lote.length, equals(etiquetasEventoNotificacion.length * 2));
    for (final evento in etiquetasEventoNotificacion.keys) {
      expect(
        lote.any((p) => p.evento == evento && p.canal == 'movil' && p.activo),
        isTrue,
      );
      expect(
        lote.any((p) => p.evento == evento && p.canal == 'correo' && !p.activo),
        isTrue,
      );
    }
  });

  testWidgets(
    'ofrecerSoloMovilSiCorresponde pregunta una vez y guarda en PUT /notificaciones/preferencias',
    (WidgetTester tester) async {
      SharedPreferences.setMockInitialValues(<String, Object>{});
      final prefs = await SharedPreferences.getInstance();

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
        if (req.path == '/notificaciones/preferencias') {
          return (status: 200, body: _preferenciasIniciales());
        }
        return (status: 200, body: <String, dynamic>{});
      });
      apiClient.dio.httpClientAdapter = adaptador;
      final api = NotificacionesApi(apiClient: apiClient);

      late BuildContext ctx;
      await tester.pumpWidget(
        MaterialApp(
          theme: TemaApp.claro,
          home: Scaffold(
            body: Builder(
              builder: (context) {
                ctx = context;
                return const SizedBox.shrink();
              },
            ),
          ),
        ),
      );

      final futuro = ofrecerSoloMovilSiCorresponde(
        context: ctx,
        usuarioId: 7,
        notificacionesApi: api,
        prefs: prefs,
      );
      await tester.pumpAndSettle();

      expect(find.text('¿Recibir avisos solo en el móvil?'), findsOneWidget);
      await tester.tap(find.text('Usar solo móvil'));
      await tester.pumpAndSettle();
      await futuro;

      expect(
        adaptador.peticiones.any(
          (r) => r.method == 'PUT' && r.path == '/notificaciones/preferencias',
        ),
        isTrue,
      );
      expect(prefs.getBool('push_prompt_visto_7'), isTrue);

      // Segunda llamada: no vuelve a mostrar diálogo.
      await ofrecerSoloMovilSiCorresponde(
        context: ctx,
        usuarioId: 7,
        notificacionesApi: api,
        prefs: prefs,
      );
      await tester.pumpAndSettle();
      expect(find.text('¿Recibir avisos solo en el móvil?'), findsNothing);
    },
  );

  testWidgets(
    'NotificacionesPreferenciasPage muestra eventos, oculta canales no disponibles y guarda cambios',
    (WidgetTester tester) async {
      final sesion = SesionStore(
        almacenamientoSeguro: MemoriaAlmacenamientoSeguro(),
      );
      final apiClient = ApiClient(sesionStore: sesion);
      var estadoActual = _preferenciasIniciales();
      final adaptador = _AdaptadorMock((req) {
        if (req.path == '/notificaciones/movil') {
          return (
            status: 200,
            body: <String, dynamic>{'disponible': true, 'dispositivos': 1},
          );
        }
        if (req.path == '/notificaciones/telegram') {
          return (
            status: 200,
            body: <String, dynamic>{'disponible': false, 'vinculado': false},
          );
        }
        if (req.method == 'PUT' && req.path == '/notificaciones/preferencias') {
          final cambios = (req.data as List<dynamic>)
              .cast<Map<String, dynamic>>();
          estadoActual = estadoActual
              .map((item) {
                final c = cambios
                    .where(
                      (x) =>
                          x['evento'] == item['evento'] &&
                          x['canal'] == item['canal'],
                    )
                    .firstOrNull;
                return c != null
                    ? <String, dynamic>{...item, 'activo': c['activo']}
                    : item;
              })
              .toList(growable: false);
          return (status: 200, body: estadoActual);
        }
        return (status: 200, body: estadoActual);
      });
      apiClient.dio.httpClientAdapter = adaptador;

      await tester.pumpWidget(
        MaterialApp(
          theme: TemaApp.claro,
          home: NotificacionesPreferenciasPage(
            notificacionesApi: NotificacionesApi(apiClient: apiClient),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Notificaciones'), findsOneWidget);
      expect(find.text('Te asignan una tarea'), findsOneWidget);
      expect(find.text('Móvil'), findsWidgets);
      expect(find.text('Telegram'), findsNothing);

      await tester.tap(find.text('Móvil').first);
      await tester.pumpAndSettle();

      expect(
        adaptador.peticiones.any(
          (r) => r.method == 'PUT' && r.path == '/notificaciones/preferencias',
        ),
        isTrue,
      );
    },
  );
}
