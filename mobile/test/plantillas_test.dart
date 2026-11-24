import 'dart:convert';
import 'dart:typed_data';

import 'package:cosmoflow_mobile/core/api/api_client.dart';
import 'package:cosmoflow_mobile/core/auth/almacenamiento_seguro.dart';
import 'package:cosmoflow_mobile/core/auth/sesion_store.dart';
import 'package:cosmoflow_mobile/core/auth/usuario_sesion.dart';
import 'package:cosmoflow_mobile/core/theme/tema_app.dart';
import 'package:cosmoflow_mobile/modules/organizaciones/api/organizaciones_api.dart';
import 'package:cosmoflow_mobile/modules/organizaciones/models/organizacion_models.dart';
import 'package:cosmoflow_mobile/modules/organizaciones/pages/organizacion_detalle_page.dart';
import 'package:cosmoflow_mobile/modules/plantillas/api/plantillas_api.dart';
import 'package:cosmoflow_mobile/modules/plantillas/models/plantilla_model.dart';
import 'package:cosmoflow_mobile/modules/plantillas/pages/plantillas_page.dart';
import 'package:cosmoflow_mobile/modules/plantillas/widgets/guardar_plantilla_sheet.dart';
import 'package:cosmoflow_mobile/modules/plantillas/widgets/plantilla_form.dart';
import 'package:cosmoflow_mobile/modules/tags/api/tags_api.dart';
import 'package:cosmoflow_mobile/modules/tags/models/tag_model.dart';
import 'package:cosmoflow_mobile/modules/tareas/api/tareas_api.dart';
import 'package:cosmoflow_mobile/modules/tareas/models/tarea_model.dart';
import 'package:cosmoflow_mobile/modules/tareas/widgets/tarea_form.dart';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
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

SesionStore _crearSesion({
  List<String> permisos = const <String>['tareas:leer', 'tareas:crear'],
}) {
  final store = SesionStore(
    almacenamientoSeguro: MemoriaAlmacenamientoSeguro(),
  );
  store.establecerSesion(
    accessToken: 'jwt',
    usuario: const UsuarioSesion(
      id: 1,
      nombre: 'Ana',
      email: 'ana@test.com',
      emailVerificado: true,
    ),
  );
  store.establecerPermisos(permisos.toSet());
  return store;
}

void main() {
  test(
    'Modelos y helpers de plantilla normalizan subtareas y respetan RN-60',
    () {
      final plantilla = PlantillaTareaDto.fromJson(<String, dynamic>{
        'id': 3,
        'nombre': 'Release semanal',
        'titulo': 'Publicar versión',
        'contenido': 'Pasos de release',
        'prioridad': 'alta',
        'color': '#4F46E5',
        'subtareas': <String>['  Compilar  ', '', '   ', 'Probar'],
      });
      expect(plantilla.id, equals(3));
      expect(plantilla.prioridad, equals(PrioridadTarea.alta));
      expect(plantilla.color, equals('#4F46E5'));
      expect(plantilla.subtareas, equals(<String>['Compilar', 'Probar']));

      final largas = List<String>.generate(105, (i) => 'Paso $i');
      expect(normalizarSubtareasPlantilla(largas).length, equals(100));

      const tarea = TareaDto(
        id: 40,
        titulo: '  Preparar entrega  ',
        contenido: 'Detalle',
        estado: EstadoTarea.enProgreso,
        prioridad: PrioridadTarea.alta,
        fechaInicio: '2026-11-23',
        fechaVencimiento: '2026-11-27',
        color: '#059669',
        tagIds: <int>[10, 20],
        responsableIds: <int>[5, 6],
        subtareas: <SubtareaDto>[
          SubtareaDto(titulo: '  Revisar PR  ', completada: true),
          SubtareaDto(titulo: '   ', completada: false),
          SubtareaDto(titulo: 'Etiquetar', completada: false),
        ],
        organizacionId: 7,
      );

      final payload = construirPayloadPlantillaDesdeTarea(
        tarea,
        nombre: '  Plantilla entrega  ',
      );
      expect(payload['nombre'], equals('Plantilla entrega'));
      expect(payload['titulo'], equals('Preparar entrega'));
      expect(payload['contenido'], equals('Detalle'));
      expect(payload['prioridad'], equals('alta'));
      expect(payload['color'], equals('#059669'));
      expect(payload['subtareas'], equals(<String>['Revisar PR', 'Etiquetar']));
      expect(payload.containsKey('tagIds'), isFalse);
      expect(payload.containsKey('fechaInicio'), isFalse);
      expect(payload.containsKey('fechaVencimiento'), isFalse);
      expect(payload.containsKey('responsableIds'), isFalse);
    },
  );

  test('PlantillasApi usa endpoints personales y de organización para CRUD completo', () async {
    final adaptador = _AdaptadorMock((options) {
      if (options.method == 'GET') {
        return (
          status: 200,
          body: <Map<String, dynamic>>[
            <String, dynamic>{
              'id': 1,
              'nombre': 'Sprint',
              'titulo': 'Planear sprint',
              'contenido': '',
              'prioridad': 'media',
              'color': null,
              'subtareas': <String>['Revisar backlog'],
            },
          ],
        );
      }
      if (options.method == 'DELETE') {
        return (status: 204, body: null);
      }
      return (
        status: options.method == 'POST' ? 201 : 200,
        body: <String, dynamic>{
          'id': 9,
          'nombre': 'Checklist',
          'titulo': 'Hacer QA',
          'contenido': 'Notas',
          'prioridad': 'alta',
          'color': '#4F46E5',
          'subtareas': <String>['Paso 1'],
        },
      );
    });

    final apiClient = ApiClient(sesionStore: _crearSesion());
    apiClient.dio.httpClientAdapter = adaptador;
    final api = PlantillasApi(apiClient: apiClient);

    final personales = await api.obtenerTodas();
    expect(personales.single.nombre, equals('Sprint'));
    expect(adaptador.peticiones.last.path, equals('/plantillas'));

    final deOrg = await api.obtenerTodas(organizacionId: 7);
    expect(deOrg.length, equals(1));
    expect(
      adaptador.peticiones.last.path,
      equals('/organizaciones/7/plantillas'),
    );

    await api.crear(
      nombre: 'Checklist',
      titulo: 'Hacer QA',
      prioridad: PrioridadTarea.alta,
      color: '#4F46E5',
      subtareas: <String>['  Paso 1 ', ''],
      organizacionId: 7,
    );
    expect(
      adaptador.peticiones.last.path,
      equals('/organizaciones/7/plantillas'),
    );
    expect(
      adaptador.peticiones.last.data['subtareas'],
      equals(<String>['Paso 1']),
    );

    await api.actualizar(
      9,
      nombre: 'Checklist v2',
      titulo: 'Hacer QA',
      contenido: '',
      prioridad: PrioridadTarea.baja,
      color: '',
      subtareas: const <String>[],
    );
    expect(adaptador.peticiones.last.path, equals('/plantillas/9'));
    expect(adaptador.peticiones.last.data['color'], isNull);

    await api.eliminar(9, organizacionId: 7);
    expect(adaptador.peticiones.last.method, equals('DELETE'));
    expect(
      adaptador.peticiones.last.path,
      equals('/organizaciones/7/plantillas/9'),
    );
  });

  testWidgets(
    'PlantillasPage muestra Editar/Eliminar solo cuando puedeGestionar es true',
    (WidgetTester tester) async {
      final adaptador = _AdaptadorMock(
        (_) => (
          status: 200,
          body: <Map<String, dynamic>>[
            <String, dynamic>{
              'id': 1,
              'nombre': 'Revisión semanal',
              'titulo': 'Revisar pendientes',
              'contenido': '',
              'prioridad': 'alta',
              'color': '#4F46E5',
              'subtareas': <String>['Leer correos', 'Actualizar tablero'],
            },
          ],
        ),
      );
      final sesion = _crearSesion();
      final apiClient = ApiClient(sesionStore: sesion);
      apiClient.dio.httpClientAdapter = adaptador;
      final plantillasApi = PlantillasApi(apiClient: apiClient);

      await tester.pumpWidget(
        MaterialApp(
          theme: TemaApp.claro,
          home: PlantillasPage(
            sesionStore: sesion,
            plantillasApi: plantillasApi,
            organizacionId: 7,
            puedeGestionar: false,
            mostrarAppBar: false,
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Revisión semanal'), findsOneWidget);
      expect(
        find.text('Revisar pendientes · Prioridad alta · 2 subtareas'),
        findsOneWidget,
      );
      expect(find.byTooltip('Usar plantilla'), findsOneWidget);
      expect(find.byType(PopupMenuButton<String>), findsNothing);

      await tester.pumpWidget(
        MaterialApp(
          theme: TemaApp.claro,
          home: PlantillasPage(
            sesionStore: sesion,
            plantillasApi: plantillasApi,
            organizacionId: 7,
            puedeGestionar: true,
            mostrarAppBar: false,
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.byType(PopupMenuButton<String>), findsOneWidget);
      await tester.tap(find.byType(PopupMenuButton<String>));
      await tester.pumpAndSettle();
      expect(find.text('Usar'), findsOneWidget);
      expect(find.text('Editar'), findsOneWidget);
      expect(find.text('Eliminar'), findsOneWidget);
    },
  );

  testWidgets(
    'PlantillaForm valida campos obligatorios, agrega/quita subtareas y limpia color',
    (WidgetTester tester) async {
      final formKey = GlobalKey<PlantillaFormState>();
      const plantilla = PlantillaTareaDto(
        id: 2,
        nombre: 'Plantilla base',
        titulo: 'Título base',
        contenido: 'Cuerpo',
        prioridad: PrioridadTarea.media,
        color: '#4F46E5',
        subtareas: <String>['Uno'],
      );

      await tester.pumpWidget(
        MaterialApp(
          theme: TemaApp.claro,
          home: Scaffold(
            body: PlantillaForm(key: formKey, plantillaInicial: plantilla),
          ),
        ),
      );

      await tester.enterText(
        find.widgetWithText(TextFormField, 'Nombre'),
        '   ',
      );
      expect(formKey.currentState!.validar(), isNull);

      await tester.enterText(
        find.widgetWithText(TextFormField, 'Nombre'),
        '  Nueva plantilla  ',
      );
      await tester.tap(find.text('Sin color'));
      await tester.pump();

      await tester.enterText(
        find.widgetWithText(TextField, 'Añadir elemento al checklist'),
        '  Dos  ',
      );
      await tester.tap(find.byTooltip('Añadir subtarea'));
      await tester.pump();

      final valores = formKey.currentState!.validar();
      expect(valores, isNotNull);
      expect(valores!.nombre, equals('Nueva plantilla'));
      expect(valores.color, isNull);
      expect(valores.subtareas, equals(<String>['Uno', 'Dos']));
    },
  );

  testWidgets(
    'TareaForm con plantillaInicial precarga propiedades y deja tagIds vacío (RN-60)',
    (WidgetTester tester) async {
      final formKey = GlobalKey<TareaFormState>();
      const plantilla = PlantillaTareaDto(
        id: 5,
        nombre: 'Deploy',
        titulo: 'Desplegar producción',
        contenido: 'Pasos de despliegue',
        prioridad: PrioridadTarea.alta,
        color: '#059669',
        subtareas: <String>['Correr tests', 'Subir tag'],
      );
      const tags = <TagDto>[
        TagDto(id: 1, nombre: 'Backend'),
        TagDto(id: 2, nombre: 'Urgente'),
      ];

      await tester.pumpWidget(
        MaterialApp(
          theme: TemaApp.claro,
          home: Scaffold(
            body: TareaForm(
              key: formKey,
              plantillaInicial: plantilla,
              tagsDisponibles: tags,
            ),
          ),
        ),
      );

      final valores = formKey.currentState!.validar();
      expect(valores, isNotNull);
      expect(valores!.titulo, equals('Desplegar producción'));
      expect(valores.contenido, equals('Pasos de despliegue'));
      expect(valores.prioridad, equals(PrioridadTarea.alta));
      expect(valores.color, equals('#059669'));
      expect(valores.tagIds, isEmpty);
      expect(
        valores.subtareas.map((s) => (s.titulo, s.completada)).toList(),
        equals(<(String, bool)>[('Correr tests', false), ('Subir tag', false)]),
      );
    },
  );

  testWidgets(
    'GuardarPlantillaSheet muestra destino de organización solo con plantillas:gestionar y envía sin tags',
    (WidgetTester tester) async {
      final adaptador = _AdaptadorMock((options) {
        if (options.method == 'GET' && options.path == '/organizaciones/7') {
          return (
            status: 200,
            body: <String, dynamic>{
              'id': 7,
              'nombre': 'Acme',
              'descripcion': '',
              'isAdmin': false,
              'permisos': <String>['plantillas:gestionar'],
            },
          );
        }
        return (
          status: 201,
          body: <String, dynamic>{
            'id': 15,
            'nombre': 'Mi plantilla org',
            'titulo': 'Tarea compartida',
            'contenido': 'Texto',
            'prioridad': 'alta',
            'color': null,
            'subtareas': <String>['Paso A'],
          },
        );
      });

      final apiClient = ApiClient(sesionStore: _crearSesion());
      apiClient.dio.httpClientAdapter = adaptador;
      final plantillasApi = PlantillasApi(apiClient: apiClient);
      final organizacionesApi = OrganizacionesApi(apiClient: apiClient);

      const tarea = TareaDto(
        id: 12,
        titulo: 'Tarea compartida',
        contenido: 'Texto',
        estado: EstadoTarea.pendiente,
        prioridad: PrioridadTarea.alta,
        tagIds: <int>[99],
        subtareas: <SubtareaDto>[
          SubtareaDto(titulo: 'Paso A', completada: true),
        ],
        organizacionId: 7,
      );

      await tester.pumpWidget(
        MaterialApp(
          theme: TemaApp.claro,
          home: Scaffold(
            body: GuardarPlantillaSheet(
              tarea: tarea,
              plantillasApi: plantillasApi,
              organizacionesApi: organizacionesApi,
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Mis plantillas'), findsOneWidget);
      await tester.tap(find.text('Mis plantillas'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Acme (para todos sus miembros)').last);
      await tester.pumpAndSettle();

      await tester.enterText(
        find.widgetWithText(TextFormField, 'Nombre'),
        'Mi plantilla org',
      );
      await tester.tap(find.text('Guardar plantilla'));
      await tester.pumpAndSettle();

      final post = adaptador.peticiones.lastWhere((r) => r.method == 'POST');
      expect(post.path, equals('/organizaciones/7/plantillas'));
      expect(
        (post.data as Map<String, dynamic>).containsKey('tagIds'),
        isFalse,
      );
      expect(post.data['subtareas'], equals(<String>['Paso A']));
    },
  );

  testWidgets('OrganizacionDetallePage incluye la pestaña Plantillas', (
    WidgetTester tester,
  ) async {
    final sesion = _crearSesion();
    final apiClient = ApiClient(sesionStore: sesion);

    await tester.pumpWidget(
      MaterialApp(
        theme: TemaApp.claro,
        home: OrganizacionDetallePage(
          id: 10,
          sesionStore: sesion,
          organizacionesApi: OrganizacionesApi(apiClient: apiClient),
          tareasApi: TareasApi(apiClient: apiClient),
          tagsApi: TagsApi(apiClient: apiClient),
          plantillasApi: PlantillasApi(apiClient: apiClient),
          organizacion: const OrganizacionDto(
            id: 10,
            nombre: 'Saasil',
            descripcion: 'Producto',
            isAdmin: true,
          ),
          cargarAlIniciar: false,
        ),
      ),
    );

    expect(find.text('Plantillas'), findsOneWidget);
  });
}
