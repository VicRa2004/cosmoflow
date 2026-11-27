import 'dart:convert';
import 'dart:typed_data';

import 'package:cosmoflow_mobile/core/api/api_client.dart';
import 'package:cosmoflow_mobile/core/auth/almacenamiento_seguro.dart';
import 'package:cosmoflow_mobile/core/auth/sesion_store.dart';
import 'package:cosmoflow_mobile/core/auth/usuario_sesion.dart';
import 'package:cosmoflow_mobile/core/theme/tema_app.dart';
import 'package:cosmoflow_mobile/modules/papelera/api/papelera_api.dart';
import 'package:cosmoflow_mobile/modules/papelera/pages/papelera_page.dart';
import 'package:cosmoflow_mobile/modules/tareas/acciones_tarea.dart';
import 'package:cosmoflow_mobile/modules/tareas/api/comentarios_api.dart';
import 'package:cosmoflow_mobile/modules/tareas/api/tareas_api.dart';
import 'package:cosmoflow_mobile/modules/tareas/models/tarea_model.dart';
import 'package:cosmoflow_mobile/modules/tareas/pages/tarea_detalle_page.dart';
import 'package:cosmoflow_mobile/modules/tareas/widgets/comentarios_tarea_section.dart';
import 'package:cosmoflow_mobile/modules/tareas/widgets/tarea_form.dart';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

class _FakeAdapter implements HttpClientAdapter {
  _FakeAdapter(this.handler);

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

ResponseBody _json(Object body, [int status = 200]) => ResponseBody.fromString(
  jsonEncode(body),
  status,
  headers: <String, List<String>>{
    Headers.contentTypeHeader: <String>['application/json'],
  },
);

SesionStore _sesionConPermisos() {
  final store = SesionStore(almacenamientoSeguro: MemoriaAlmacenamientoSeguro())
    ..establecerSesion(
      accessToken: 'jwt',
      usuario: const UsuarioSesion(
        id: 1,
        nombre: 'Marcos',
        email: 'marcos@cosmoflow.com',
        emailVerificado: true,
      ),
    )
    ..establecerPermisos(<String>{
      'tareas:leer',
      'tareas:crear',
      'tareas:actualizar',
      'tareas:eliminar',
      'notas:leer',
      'notas:eliminar',
    });
  return store;
}

ApiClient _api(
  SesionStore store,
  ResponseBody Function(RequestOptions) handler,
) {
  final dio = Dio(BaseOptions(baseUrl: 'http://api'))
    ..httpClientAdapter = _FakeAdapter(handler);
  return ApiClient(sesionStore: store, dio: dio);
}

void main() {
  testWidgets(
    'PapeleraPage lista tareas/notas, restaura y elimina definitivamente',
    (tester) async {
      final store = _sesionConPermisos();
      final llamadas = <String>[];
      final apiClient = _api(store, (o) {
        llamadas.add('${o.method} ${o.path}');
        if (o.method == 'GET' && o.path == '/tareas/papelera') {
          return _json(<String, dynamic>{
            'datos': <Map<String, dynamic>>[
              <String, dynamic>{'id': 10, 'titulo': 'Tarea vieja'},
              <String, dynamic>{'id': 11, 'titulo': 'Tarea basura'},
            ],
            'pagina': 1,
            'totalElementos': 2,
            'totalPaginas': 1,
          });
        }
        if (o.method == 'GET' && o.path == '/notas/papelera') {
          return _json(<String, dynamic>{
            'datos': <Map<String, dynamic>>[
              <String, dynamic>{'id': 20, 'titulo': 'Nota borrada'},
            ],
            'pagina': 1,
            'totalElementos': 1,
            'totalPaginas': 1,
          });
        }
        return ResponseBody.fromString('', 204);
      });

      await tester.pumpWidget(
        MaterialApp(
          theme: TemaApp.claro,
          home: PapeleraPage(
            sesionStore: store,
            papeleraApi: PapeleraApi(apiClient: apiClient),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Tarea vieja'), findsOneWidget);
      expect(find.text('Tarea basura'), findsOneWidget);

      // Restaurar primera tarea.
      await tester.tap(find.byTooltip('Restaurar').first);
      await tester.pumpAndSettle();
      expect(llamadas, contains('POST /tareas/papelera/10/restaurar'));
      expect(find.text('Tarea vieja'), findsNothing);

      // Eliminar definitivamente la segunda tarea con confirmación.
      await tester.tap(find.byTooltip('Borrar definitivamente').first);
      await tester.pumpAndSettle();
      await tester.tap(find.text('Borrar definitivamente'));
      await tester.pumpAndSettle();
      expect(llamadas, contains('DELETE /tareas/papelera/11'));
      expect(find.text('Tarea basura'), findsNothing);

      // Cambiar a pestaña Notas.
      await tester.tap(find.text('Notas'));
      await tester.pumpAndSettle();
      expect(find.text('Nota borrada'), findsOneWidget);
    },
  );

  testWidgets('TareaDetallePage permite marcar y desmarcar subtareas', (
    tester,
  ) async {
    final store = _sesionConPermisos();
    List<dynamic>? subtareasEnviadas;

    final apiClient = _api(store, (o) {
      if (o.method == 'GET' && o.path == '/tareas/5') {
        return _json(<String, dynamic>{
          'id': 5,
          'titulo': 'Lanzar app',
          'contenido': 'Detalle',
          'estado': 'en_progreso',
          'prioridad': 'alta',
          'subtareas': <Map<String, dynamic>>[
            <String, dynamic>{'titulo': 'Compilar', 'completada': true},
            <String, dynamic>{'titulo': 'Publicar', 'completada': false},
          ],
        });
      }
      if (o.method == 'PUT' && o.path == '/tareas/5') {
        subtareasEnviadas =
            (o.data as Map<String, dynamic>)['subtareas'] as List<dynamic>?;
        return _json(<String, dynamic>{
          'id': 5,
          'titulo': 'Lanzar app',
          'contenido': 'Detalle',
          'estado': 'en_progreso',
          'prioridad': 'alta',
          'subtareas': subtareasEnviadas,
        });
      }
      return _json(<String, dynamic>{
        'datos': const <dynamic>[],
        'pagina': 1,
        'totalElementos': 0,
        'totalPaginas': 1,
      });
    });

    final tareasApi = TareasApi(apiClient: apiClient);
    await tester.pumpWidget(
      MaterialApp(
        theme: TemaApp.claro,
        home: TareaDetallePage(
          id: 5,
          acciones: AccionesTarea(sesionStore: store, tareasApi: tareasApi),
          cargarComentarios: false,
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('1/2 (50%)'), findsOneWidget);

    // Marcar la segunda subtarea «Publicar».
    await tester.ensureVisible(find.text('Publicar'));
    await tester.tap(find.text('Publicar'));
    await tester.pumpAndSettle();

    expect(find.text('2/2 (100%)'), findsOneWidget);
    expect(subtareasEnviadas, hasLength(2));
    expect(
      (subtareasEnviadas![1] as Map<String, dynamic>)['completada'],
      isTrue,
    );
  });

  test('helpers de comentarios agrupan hilos e insertan menciones', () {
    final c1 = const ComentarioTareaDto(
      id: 1,
      tareaId: 5,
      autorId: 1,
      autorNombre: 'Marcos',
      contenido: 'Hola',
      createdAt: '2026-11-24T12:00:00Z',
    );
    final c2 = const ComentarioTareaDto(
      id: 2,
      tareaId: 5,
      autorId: 2,
      autorNombre: 'Ana',
      padreId: 1,
      contenido: 'Respuesta',
      createdAt: '2026-11-24T12:05:00Z',
    );
    final hilos = agruparHilosComentarios(<ComentarioTareaDto>[c1, c2]);
    expect(hilos.raices.map((c) => c.id), <int>[1]);
    expect(hilos.respuestasPorPadre[1]?.map((c) => c.id), <int>[2]);

    expect(consultaMencionActiva('Hola @an'), 'an');
    expect(consultaMencionActiva('Sin arroba'), isNull);
    expect(
      insertarMencionEnTexto('Hola @an', id: 7, nombre: 'Ana'),
      'Hola [@Ana](mencion:7) ',
    );
  });

  testWidgets(
    'ComentariosTareaSection muestra hilos, menciona con @ y crea comentarios',
    (tester) async {
      final store = _sesionConPermisos();
      final comentarios = <Map<String, dynamic>>[
        <String, dynamic>{
          'id': 1,
          'tareaId': 5,
          'autorId': 2,
          'autorNombre': 'Ana',
          'padreId': null,
          'contenido': 'Primer **comentario**',
          'createdAt': '2026-11-24T12:00:00Z',
          'editadoEn': null,
        },
      ];
      String? ultimoEnviado;

      final apiClient = _api(store, (o) {
        if (o.method == 'GET' && o.path == '/tareas/5/comentarios') {
          return _json(<String, dynamic>{
            'datos': comentarios,
            'pagina': 1,
            'totalElementos': comentarios.length,
            'totalPaginas': 1,
          });
        }
        if (o.method == 'POST' && o.path == '/tareas/5/comentarios') {
          final body = o.data as Map<String, dynamic>;
          ultimoEnviado = body['contenido'] as String;
          final nuevo = <String, dynamic>{
            'id': 2,
            'tareaId': 5,
            'autorId': 1,
            'autorNombre': 'Marcos',
            'padreId': body['padreId'],
            'contenido': ultimoEnviado,
            'createdAt': '2026-11-24T12:10:00Z',
            'editadoEn': null,
          };
          comentarios.add(nuevo);
          return _json(nuevo, 201);
        }
        return ResponseBody.fromString('', 204);
      });

      const tarea = TareaDto(
        id: 5,
        titulo: 'Demo',
        contenido: '',
        estado: EstadoTarea.pendiente,
        prioridad: PrioridadTarea.media,
        organizacionId: 3,
      );

      await tester.pumpWidget(
        MaterialApp(
          theme: TemaApp.claro,
          home: Scaffold(
            body: SingleChildScrollView(
              child: ComentariosTareaSection(
                tarea: tarea,
                comentariosApi: ComentariosApi(apiClient: apiClient),
                yoId: 1,
                miembros: const <ResponsableCandidato>[
                  (id: 2, nombre: 'Ana'),
                  (id: 3, nombre: 'Luis'),
                ],
              ),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Comentarios (1)'), findsOneWidget);

      // Escribir @An y elegir sugerencia de mención.
      await tester.enterText(find.byType(TextField), 'Revisado @An');
      await tester.pumpAndSettle();
      await tester.tap(find.widgetWithText(ActionChip, 'Ana'));
      await tester.pumpAndSettle();

      await tester.tap(find.byTooltip('Enviar comentario'));
      await tester.pumpAndSettle();

      expect(ultimoEnviado, 'Revisado [@Ana](mencion:2)');
      expect(find.text('Comentarios (2)'), findsOneWidget);
    },
  );
}
