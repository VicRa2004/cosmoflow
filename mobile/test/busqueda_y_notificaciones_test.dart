import 'dart:convert';
import 'dart:typed_data';

import 'package:cosmoflow_mobile/core/api/api_client.dart';
import 'package:cosmoflow_mobile/core/auth/sesion_store.dart';
import 'package:cosmoflow_mobile/core/theme/tema_app.dart';
import 'package:cosmoflow_mobile/modules/busqueda/api/busqueda_api.dart';
import 'package:cosmoflow_mobile/modules/busqueda/models/busqueda_models.dart';
import 'package:cosmoflow_mobile/modules/busqueda/pages/busqueda_page.dart';
import 'package:cosmoflow_mobile/modules/notificaciones/api/notificaciones_api.dart';
import 'package:cosmoflow_mobile/modules/notificaciones/models/bandeja_notificacion_models.dart';
import 'package:cosmoflow_mobile/modules/notificaciones/pages/notificaciones_page.dart';
import 'package:cosmoflow_mobile/modules/notificaciones/utils/describir_notificacion.dart';
import 'package:cosmoflow_mobile/modules/notificaciones/widgets/boton_notificaciones.dart';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

class _FakeApiAdapter implements HttpClientAdapter {
  _FakeApiAdapter(this.handler);

  final ResponseBody Function(RequestOptions options) handler;

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async => handler(options);

  @override
  void close({bool force = false}) {}
}

ResponseBody _json(Object body, [int status = 200]) {
  return ResponseBody.fromString(
    jsonEncode(body),
    status,
    headers: <String, List<String>>{
      Headers.contentTypeHeader: <String>['application/json'],
    },
  );
}

ApiClient _crearApiClient(ResponseBody Function(RequestOptions) handler) {
  final dio = Dio(BaseOptions(baseUrl: 'http://localhost:3000/api'));
  dio.httpClientAdapter = _FakeApiAdapter(handler);
  return ApiClient(sesionStore: SesionStore(), dio: dio);
}

void main() {
  test('ResultadosBusquedaDto parsea tareas, notas, proyectos y equipos', () {
    final res = ResultadosBusquedaDto.fromJson(<String, dynamic>{
      'tareas': <Map<String, dynamic>>[
        <String, dynamic>{'id': 1, 'titulo': 'Preparar demo'},
      ],
      'notas': <Map<String, dynamic>>[
        <String, dynamic>{'id': 2, 'titulo': 'Minuta'},
      ],
      'proyectos': <Map<String, dynamic>>[
        <String, dynamic>{'id': 3, 'nombre': 'App móvil', 'organizacionId': 9},
      ],
      'equipos': <Map<String, dynamic>>[
        <String, dynamic>{'id': 4, 'nombre': 'Core', 'organizacionId': 9},
      ],
    });

    expect(res.isEmpty, isFalse);
    expect(res.total, 4);
    expect(res.tareas.first.titulo, 'Preparar demo');
    expect(res.proyectos.first.organizacionId, 9);
    expect(res.equipos.first.nombre, 'Core');
  });

  testWidgets('BusquedaPage exige 2+ caracteres, muestra grupos y navega', (
    tester,
  ) async {
    final consultas = <String>[];
    String? rutaAbierta;

    final apiClient = _crearApiClient((options) {
      if (options.path == '/busqueda') {
        consultas.add(options.queryParameters['q']?.toString() ?? '');
        return _json(<String, dynamic>{
          'tareas': <Map<String, dynamic>>[
            <String, dynamic>{'id': 12, 'titulo': 'Lanzar beta'},
          ],
          'notas': <Map<String, dynamic>>[
            <String, dynamic>{'id': 5, 'titulo': 'Notas beta'},
          ],
          'proyectos': <Map<String, dynamic>>[
            <String, dynamic>{
              'id': 8,
              'nombre': 'Beta móvil',
              'organizacionId': 3,
            },
          ],
          'equipos': <Map<String, dynamic>>[],
        });
      }
      return _json(<String, dynamic>{'error': 'No encontrado'}, 404);
    });

    final router = GoRouter(
      initialLocation: '/buscar',
      routes: <RouteBase>[
        GoRoute(
          path: '/buscar',
          builder: (_, _) => BusquedaPage(
            busquedaApi: BusquedaApi(apiClient: apiClient),
            debounce: Duration.zero,
          ),
        ),
        GoRoute(
          path: '/tareas/:id',
          builder: (_, state) {
            rutaAbierta = '/tareas/${state.pathParameters['id']}';
            return const Scaffold(body: Text('Detalle tarea'));
          },
        ),
      ],
    );

    await tester.pumpWidget(
      MaterialApp.router(theme: TemaApp.claro, routerConfig: router),
    );

    // Con 1 carácter no consulta al servidor.
    await tester.enterText(find.byType(TextField), 'b');
    await tester.pumpAndSettle();
    expect(consultas, isEmpty);

    // Con 2+ caracteres busca y muestra las secciones encontradas.
    await tester.enterText(find.byType(TextField), 'beta');
    await tester.pumpAndSettle();

    expect(consultas, <String>['beta']);
    expect(find.text('Tareas'), findsOneWidget);
    expect(find.text('Lanzar beta'), findsOneWidget);
    expect(find.text('Notas'), findsOneWidget);
    expect(find.text('Proyectos'), findsOneWidget);
    expect(find.text('Equipos'), findsNothing);

    await tester.tap(find.text('Lanzar beta'));
    await tester.pumpAndSettle();
    expect(rutaAbierta, '/tareas/12');
  });

  test('NotificacionAppDto y describirResponsablesNotificacion', () {
    const notifTarea = NotificacionAppDto(
      id: 1,
      asunto: 'Asunto',
      texto: 'Texto',
      enlace: 'https://app.cosmoflow.dev/tareas/77',
      tipo: 'tarea',
      recursoId: 77,
      leida: false,
      createdAt: '2026-11-24T12:00:00Z',
    );
    expect(notifTarea.rutaDestino(), '/tareas/77');

    const notifNota = NotificacionAppDto(
      id: 2,
      asunto: 'Nota',
      texto: '',
      enlace: 'https://app.cosmoflow.dev/notas/15',
      tipo: 'nota',
      recursoId: 15,
      leida: true,
      createdAt: '2026-11-24T12:00:00Z',
    );
    expect(notifNota.rutaDestino(), '/notas/15');

    final desc = describirResponsablesNotificacion(const <ResponsableAvisoDto>[
      ResponsableAvisoDto(
        id: 10,
        nombre: 'Marcos',
        asignadoPor: PersonaAvisoDto(id: 20, nombre: 'Ana'),
      ),
    ], yoId: 10);
    expect(desc.encargado, 'tú');
    expect(desc.asigno, 'Ana');
  });

  testWidgets(
    'NotificacionesPage lista, marca una como leída al abrir y marca todas',
    (tester) async {
      final leidas = <int>[];
      var marcoTodas = false;
      String? rutaAbierta;

      final apiClient = _crearApiClient((options) {
        if (options.method == 'GET' && options.path == '/notificaciones') {
          return _json(<String, dynamic>{
            'datos': <Map<String, dynamic>>[
              <String, dynamic>{
                'id': 101,
                'asunto': 'Te asignaron una tarea',
                'texto': 'Ana te asignó «Cerrar sprint»',
                'enlace': 'https://app.cosmoflow.dev/tareas/55',
                'tipo': 'tarea',
                'recursoId': 55,
                'evento': 'tareaAsignada',
                'actor': <String, dynamic>{'id': 2, 'nombre': 'Ana'},
                'tarea': <String, dynamic>{
                  'titulo': 'Cerrar sprint',
                  'responsables': <Map<String, dynamic>>[
                    <String, dynamic>{
                      'id': 1,
                      'nombre': 'Marcos',
                      'asignadoPor': <String, dynamic>{
                        'id': 2,
                        'nombre': 'Ana',
                      },
                    },
                  ],
                },
                'leida': false,
                'createdAt': DateTime.now().toIso8601String(),
              },
              <String, dynamic>{
                'id': 102,
                'asunto': 'Nuevo comentario',
                'texto': 'Revisar notas',
                'enlace': 'https://app.cosmoflow.dev/notas/9',
                'tipo': 'nota',
                'recursoId': 9,
                'evento': 'comentario',
                'leida': false,
                'createdAt': DateTime.now().toIso8601String(),
              },
            ],
            'pagina': 1,
            'totalElementos': 2,
            'totalPaginas': 1,
            'noLeidas': 2,
          });
        }
        if (options.method == 'PUT' &&
            options.path.startsWith('/notificaciones/')) {
          final id = int.parse(options.path.split('/')[2]);
          leidas.add(id);
          return ResponseBody.fromString('', 204);
        }
        if (options.method == 'POST' &&
            options.path == '/notificaciones/leer-todas') {
          marcoTodas = true;
          return ResponseBody.fromString('', 204);
        }
        return _json(<String, dynamic>{'error': 'No encontrado'}, 404);
      });

      final notifApi = NotificacionesApi(apiClient: apiClient);
      final router = GoRouter(
        initialLocation: '/notificaciones',
        routes: <RouteBase>[
          GoRoute(
            path: '/notificaciones',
            builder: (_, _) => NotificacionesPage(
              sesionStore: SesionStore(),
              notificacionesApi: notifApi,
            ),
          ),
          GoRoute(
            path: '/tareas/:id',
            builder: (_, state) {
              rutaAbierta = '/tareas/${state.pathParameters['id']}';
              return Scaffold(
                appBar: AppBar(title: const Text('Detalle tarea')),
                body: const SizedBox.shrink(),
              );
            },
          ),
        ],
      );

      await tester.pumpWidget(
        MaterialApp.router(theme: TemaApp.claro, routerConfig: router),
      );
      await tester.pumpAndSettle();

      expect(find.text('Cerrar sprint'), findsOneWidget);
      expect(find.text('Sin leer (2)'), findsOneWidget);

      // Abrir notificación no leída -> marca leída y navega.
      await tester.tap(find.text('Cerrar sprint'));
      await tester.pumpAndSettle();
      expect(leidas, <int>[101]);
      expect(rutaAbierta, '/tareas/55');

      // Volver a la bandeja y marcar todas como leídas.
      router.pop();
      await tester.pumpAndSettle();
      expect(find.text('Sin leer (1)'), findsOneWidget);

      await tester.tap(find.byTooltip('Marcar todas como leídas'));
      await tester.pumpAndSettle();
      expect(marcoTodas, isTrue);
      expect(find.text('Sin leer'), findsOneWidget);
    },
  );

  testWidgets('BotonNotificaciones muestra badge con 99+ cuando supera 99', (
    tester,
  ) async {
    final apiClient = _crearApiClient((options) {
      return _json(<String, dynamic>{
        'datos': const <dynamic>[],
        'pagina': 1,
        'totalElementos': 120,
        'totalPaginas': 120,
        'noLeidas': 120,
      });
    });

    await tester.pumpWidget(
      MaterialApp(
        theme: TemaApp.claro,
        home: Scaffold(
          appBar: AppBar(
            actions: <Widget>[
              BotonNotificaciones(
                notificacionesApi: NotificacionesApi(apiClient: apiClient),
              ),
            ],
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('99+'), findsOneWidget);
  });
}
