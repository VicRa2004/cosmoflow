import 'dart:convert';
import 'dart:typed_data';

import 'package:cosmoflow_mobile/core/api/api_client.dart';
import 'package:cosmoflow_mobile/core/auth/sesion_store.dart';
import 'package:cosmoflow_mobile/core/auth/usuario_sesion.dart';
import 'package:cosmoflow_mobile/core/theme/tema_app.dart';
import 'package:cosmoflow_mobile/core/widgets/avatar_usuario.dart';
import 'package:cosmoflow_mobile/modules/organizaciones/api/organizaciones_api.dart';
import 'package:cosmoflow_mobile/modules/organizaciones/services/contexto_organizacion_cache.dart';
import 'package:cosmoflow_mobile/modules/tareas/acciones_tarea.dart';
import 'package:cosmoflow_mobile/modules/tareas/api/tareas_api.dart';
import 'package:cosmoflow_mobile/modules/tareas/models/tarea_model.dart';
import 'package:cosmoflow_mobile/modules/tareas/pages/tarea_detalle_page.dart';
import 'package:cosmoflow_mobile/modules/tareas/widgets/selector_destino_tarea_sheet.dart';
import 'package:cosmoflow_mobile/modules/tareas/widgets/tarea_fila.dart';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

class _FakeBackendAdapter implements HttpClientAdapter {
  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    ResponseBody okJson(Object data) => ResponseBody.fromString(
      jsonEncode(data),
      200,
      headers: <String, List<String>>{
        Headers.contentTypeHeader: <String>['application/json'],
      },
    );

    if (options.method == 'GET' && options.path == '/organizaciones') {
      return okJson(<String, dynamic>{
        'datos': <Map<String, dynamic>>[
          <String, dynamic>{
            'id': 10,
            'nombre': 'Acme Corp',
            'descripcion': 'Org principal',
            'isAdmin': true,
            'permisos': const <String>[],
          },
        ],
        'pagina': 1,
        'totalPaginas': 1,
        'totalElementos': 1,
      });
    }
    if (options.method == 'GET' && options.path == '/organizaciones/10') {
      return okJson(<String, dynamic>{
        'id': 10,
        'nombre': 'Acme Corp',
        'descripcion': 'Org principal',
        'isAdmin': true,
        'permisos': const <String>[],
      });
    }
    if (options.method == 'GET' &&
        options.path == '/organizaciones/10/equipos') {
      return okJson(<Map<String, dynamic>>[
        <String, dynamic>{
          'id': 20,
          'nombre': 'Backend',
          'descripcion': 'API',
          'liderId': 1,
          'miembros': <Map<String, dynamic>>[
            <String, dynamic>{'usuarioId': 1, 'puedeCrearTareas': false},
            <String, dynamic>{'usuarioId': 2, 'puedeCrearTareas': false},
          ],
          'tagIds': const <int>[],
        },
        <String, dynamic>{
          'id': 21,
          'nombre': 'Solo Lectura',
          'descripcion': 'Con otro líder',
          'liderId': 2,
          'miembros': <Map<String, dynamic>>[
            <String, dynamic>{'usuarioId': 1, 'puedeCrearTareas': false},
            <String, dynamic>{'usuarioId': 2, 'puedeCrearTareas': false},
          ],
          'tagIds': const <int>[],
        },
      ]);
    }
    if (options.method == 'GET' &&
        options.path == '/organizaciones/10/proyectos') {
      return okJson(<Map<String, dynamic>>[
        <String, dynamic>{
          'id': 30,
          'nombre': 'App Mobile',
          'descripcion': 'Flutter',
          'estado': 'activo',
          'equipoIds': <int>[20],
          'integranteIds': const <int>[],
        },
      ]);
    }
    if (options.method == 'GET' &&
        options.path == '/organizaciones/10/miembros') {
      return okJson(<Map<String, dynamic>>[
        <String, dynamic>{
          'usuarioId': 1,
          'nombre': 'Ana García',
          'email': 'ana@acme.com',
          'avatarUrl': '/api/avatares/1?v=abc',
          'isAdmin': true,
          'roles': const <Map<String, dynamic>>[],
        },
      ]);
    }
    if (options.method == 'GET' && options.path == '/tareas/99') {
      return okJson(<String, dynamic>{
        'id': 99,
        'titulo': 'Deploy v2',
        'contenido': 'Revisar migraciones',
        'estado': 'pendiente',
        'prioridad': 'alta',
        'organizacionId': 10,
        'equipoId': 20,
        'responsableIds': <int>[1],
        'tagIds': const <int>[],
        'subtareas': const <Map<String, dynamic>>[],
      });
    }
    return ResponseBody.fromString('{"error":"No encontrado"}', 404);
  }

  @override
  void close({bool force = false}) {}
}

Widget _envolver(Widget child) {
  return MaterialApp(
    theme: TemaApp.claro,
    home: Scaffold(body: child),
  );
}

void main() {
  test('resolverUrlMedia resuelve rutas relativas contra apiBaseUrl', () {
    expect(
      resolverUrlMedia(
        '/api/avatares/5?v=abc.png',
        baseUrl: 'https://cosmoflow.saasil.mx/api',
      ),
      'https://cosmoflow.saasil.mx/api/avatares/5?v=abc.png',
    );
    expect(
      resolverUrlMedia(
        'https://cdn.ejemplo.com/foto.png',
        baseUrl: 'https://cosmoflow.saasil.mx/api',
      ),
      'https://cdn.ejemplo.com/foto.png',
    );
    expect(resolverUrlMedia(null), isNull);
    expect(resolverUrlMedia('   '), isNull);
  });

  testWidgets('AvatarUsuario muestra inicial si no hay avatarUrl', (
    tester,
  ) async {
    await tester.pumpWidget(
      _envolver(const AvatarUsuario(nombre: 'María López')),
    );
    expect(find.text('M'), findsOneWidget);
    expect(find.byType(Image), findsNothing);
  });

  testWidgets(
    'SelectorDestinoTareaSheet muestra Personal, organización, equipos creables y proyectos',
    (tester) async {
      final dio = Dio(BaseOptions(baseUrl: 'http://localhost:3000/api'));
      dio.httpClientAdapter = _FakeBackendAdapter();
      final orgApi = OrganizacionesApi(
        apiClient: ApiClient(sesionStore: SesionStore(), dio: dio),
      );

      DestinoNuevaTarea? elegido;
      await tester.pumpWidget(
        MaterialApp(
          theme: TemaApp.claro,
          home: Builder(
            builder: (context) => Scaffold(
              body: Center(
                child: ElevatedButton(
                  onPressed: () async {
                    elegido = await mostrarSelectorDestinoTarea(
                      context,
                      organizacionesApi: orgApi,
                      usuarioId: 1,
                    );
                  },
                  child: const Text('Abrir'),
                ),
              ),
            ),
          ),
        ),
      );

      await tester.tap(find.text('Abrir'));
      await tester.pumpAndSettle();

      expect(find.text('Tarea personal'), findsOneWidget);
      expect(find.text('Acme Corp'), findsOneWidget);
      expect(find.text('Tarea de la organización'), findsOneWidget);
      expect(find.text('Tarea en Backend'), findsOneWidget);
      // RN-22: «Solo Lectura» tiene otro líder y el usuario 1 no es delegado.
      expect(find.text('Tarea en Solo Lectura'), findsNothing);
      expect(find.text('Tarea en App Mobile'), findsOneWidget);

      await tester.tap(find.text('Tarea en Backend'));
      await tester.pumpAndSettle();

      expect(elegido, isNotNull);
      expect(elegido!.organizacionId, 10);
      expect(elegido!.equipoId, 20);
      expect(elegido!.proyectoId, isNull);
      expect(elegido!.ubicacion?.etiquetaCorta, 'Acme Corp · Backend');
    },
  );

  testWidgets(
    'TareaFila muestra organización y equipo en lugar de «Compartida»',
    (tester) async {
      const tarea = TareaDto(
        id: 1,
        titulo: 'Revisar logs',
        contenido: '',
        estado: EstadoTarea.pendiente,
        prioridad: PrioridadTarea.media,
        organizacionId: 10,
        equipoId: 20,
      );
      const ubicacion = UbicacionTarea(
        organizacionId: 10,
        organizacionNombre: 'Acme Corp',
        equipoId: 20,
        equipoNombre: 'Backend',
      );

      await tester.pumpWidget(
        _envolver(
          TareaFila(tarea: tarea, ubicacion: ubicacion, onTap: () {}),
        ),
      );

      expect(find.text('Acme Corp · Backend'), findsOneWidget);
      expect(find.text('Compartida'), findsNothing);
      expect(find.byIcon(LucideIcons.users), findsOneWidget);
    },
  );

  testWidgets(
    'TareaDetallePage muestra de forma visible organización, equipo y responsables',
    (tester) async {
      final dio = Dio(BaseOptions(baseUrl: 'http://localhost:3000/api'));
      dio.httpClientAdapter = _FakeBackendAdapter();
      final sesionStore = SesionStore()
        ..entrarSinConexion(
          const UsuarioSesion(
            id: 1,
            nombre: 'Ana García',
            email: 'ana@acme.com',
            emailVerificado: true,
          ),
        );
      final apiClient = ApiClient(sesionStore: sesionStore, dio: dio);
      final tareasApi = TareasApi(apiClient: apiClient);
      final orgApi = OrganizacionesApi(apiClient: apiClient);

      await tester.pumpWidget(
        MaterialApp(
          theme: TemaApp.claro,
          home: TareaDetallePage(
            id: 99,
            organizacionesApi: orgApi,
            cargarComentarios: false,
            acciones: AccionesTarea(
              sesionStore: sesionStore,
              tareasApi: tareasApi,
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Insignias visibles arriba del título
      expect(find.text('Acme Corp'), findsOneWidget);
      expect(find.text('Equipo · Backend'), findsOneWidget);
      // Fila «Ubicación» dentro de Detalles
      expect(find.text('Ubicación'), findsOneWidget);
      expect(find.text('Acme Corp · Backend'), findsOneWidget);
      // Responsable resuelto con nombre real y AvatarUsuario
      expect(find.text('Ana García'), findsOneWidget);
      expect(find.byType(AvatarUsuario), findsOneWidget);
    },
  );
}
