import 'dart:convert';
import 'dart:typed_data';

import 'package:cosmoflow_mobile/core/api/adjuntos_api.dart';
import 'package:cosmoflow_mobile/core/api/api_client.dart';
import 'package:cosmoflow_mobile/core/auth/sesion_store.dart';
import 'package:cosmoflow_mobile/core/theme/tema_app.dart';
import 'package:cosmoflow_mobile/modules/tareas/models/tarea_model.dart';
import 'package:cosmoflow_mobile/modules/tareas/widgets/adjuntos_tarea_section.dart';
import 'package:cosmoflow_mobile/modules/tareas/widgets/tablero_tareas.dart';
import 'package:cosmoflow_mobile/modules/tareas/widgets/tarea_fila.dart';
import 'package:cosmoflow_mobile/modules/tareas/widgets/tarea_form.dart';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

/// PNG válido de 1×1 píxel transparente para probar renderizado de `Image.memory`.
final Uint8List _png1x1 = Uint8List.fromList(
  base64Decode(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  ),
);

class _FakeAdjuntosAdapter implements HttpClientAdapter {
  int subidas = 0;
  int descargas = 0;

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    if (options.method == 'POST' && options.path == '/adjuntos') {
      subidas++;
      return ResponseBody.fromString(
        jsonEncode(<String, dynamic>{
          'id': 42,
          'url': '/api/adjuntos/42',
          'tipo': 'image/png',
          'bytes': _png1x1.length,
        }),
        201,
        headers: <String, List<String>>{
          Headers.contentTypeHeader: <String>['application/json'],
        },
      );
    }
    if (options.method == 'GET' && options.path.startsWith('/adjuntos/')) {
      descargas++;
      return ResponseBody.fromBytes(
        _png1x1,
        200,
        headers: <String, List<String>>{
          Headers.contentTypeHeader: <String>['image/png'],
        },
      );
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
  test('TareaDto parsea fijada, dependencia, bloqueada y recurrencia', () {
    final tarea = TareaDto.fromJson(<String, dynamic>{
      'id': 10,
      'titulo': 'Publicar versión',
      'contenido': 'Notas',
      'estado': 'pendiente',
      'prioridad': 'alta',
      'isFijada': true,
      'dependeDeId': 4,
      'bloqueada': true,
      'recurrencia': 'semanal',
    });

    expect(tarea.isFijada, isTrue);
    expect(tarea.dependeDeId, 4);
    expect(tarea.bloqueada, isTrue);
    expect(tarea.recurrencia, RecurrenciaTarea.semanal);
  });

  test('helpers de Markdown extraen, añaden y quitan adjuntos', () {
    const adjunto = AdjuntoDto(
      id: 7,
      url: '/api/adjuntos/7',
      tipo: 'image/png',
      bytes: 120,
    );
    final conAdjunto = agregarAdjuntoAMarkdown(
      'Texto inicial',
      adjunto,
      alt: 'captura.png',
    );
    expect(conAdjunto, 'Texto inicial\n\n![captura.png](/api/adjuntos/7)');

    final extraidos = extraerAdjuntosMarkdown(conAdjunto);
    expect(extraidos, hasLength(1));
    expect(extraidos.first.id, 7);
    expect(extraidos.first.alt, 'captura.png');

    final sinAdjunto = quitarAdjuntoDeMarkdown(conAdjunto, '/api/adjuntos/7');
    expect(sinAdjunto, 'Texto inicial');
  });

  testWidgets(
    'TableroTareas muestra columnas, ordena fijadas primero y mueve tareas',
    (tester) async {
      final normal = const TareaDto(
        id: 1,
        titulo: 'Normal pendiente',
        contenido: '',
        estado: EstadoTarea.pendiente,
        prioridad: PrioridadTarea.media,
      );
      final fijada = const TareaDto(
        id: 2,
        titulo: 'Fijada pendiente',
        contenido: '',
        estado: EstadoTarea.pendiente,
        prioridad: PrioridadTarea.alta,
        isFijada: true,
        bloqueada: true,
        recurrencia: RecurrenciaTarea.diaria,
      );

      TareaDto? movida;
      EstadoTarea? destino;
      TareaDto? fijadaTocada;

      await tester.pumpWidget(
        _envolver(
          TableroTareas(
            tareas: <TareaDto>[normal, fijada],
            puedeActualizar: true,
            onAbrir: (_) {},
            onMoverEstado: (t, e) {
              movida = t;
              destino = e;
            },
            onAlternarFijada: (t) => fijadaTocada = t,
          ),
        ),
      );

      // Fijada debe aparecer por encima de normal en la columna Pendiente.
      final yFijada = tester.getTopLeft(find.text('Fijada pendiente')).dy;
      final yNormal = tester.getTopLeft(find.text('Normal pendiente')).dy;
      expect(yFijada, lessThan(yNormal));

      // Tocar el botón de desfijar en la fijada.
      await tester.tap(find.byTooltip('Desfijar tarea').first);
      await tester.pump();
      expect(fijadaTocada?.id, 2);

      // Mover la primera tarjeta a «En progreso» desde el bottom sheet.
      await tester.tap(find.byTooltip('Mover de columna').first);
      await tester.pumpAndSettle();
      await tester.tap(find.text('En progreso').last);
      await tester.pumpAndSettle();

      expect(movida?.id, 2);
      expect(destino, EstadoTarea.enProgreso);
    },
  );

  testWidgets('TareaFila muestra bloqueada, recurrencia y botón de fijar', (
    tester,
  ) async {
    var fijarTocado = false;
    await tester.pumpWidget(
      _envolver(
        TareaFila(
          tarea: const TareaDto(
            id: 3,
            titulo: 'Revisar deploy',
            contenido: '',
            estado: EstadoTarea.pendiente,
            prioridad: PrioridadTarea.alta,
            bloqueada: true,
            recurrencia: RecurrenciaTarea.mensual,
          ),
          onTap: () {},
          onAlternarFijada: () => fijarTocado = true,
        ),
      ),
    );

    expect(find.byIcon(Icons.lock_outline_rounded), findsOneWidget);
    expect(find.byIcon(Icons.repeat_rounded), findsOneWidget);

    await tester.tap(find.byTooltip('Fijar tarea'));
    await tester.pump();
    expect(fijarTocado, isTrue);
  });

  testWidgets(
    'TareaForm permite elegir recurrencia, dependencia y fijar tarea',
    (tester) async {
      tester.view.physicalSize = const Size(400, 1200);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.reset);

      final formKey = GlobalKey<TareaFormState>();
      const principal = TareaDto(
        id: 99,
        titulo: 'Preparar entorno',
        contenido: '',
        estado: EstadoTarea.pendiente,
        prioridad: PrioridadTarea.media,
      );

      await tester.pumpWidget(
        _envolver(
          TareaForm(
            key: formKey,
            tareasCandidatas: const <TareaDto>[principal],
          ),
        ),
      );

      await tester.enterText(
        find.widgetWithText(TextFormField, 'Título'),
        'Ejecutar pruebas',
      );
      await tester.pumpAndSettle();

      // Elegir recurrencia «Semanal».
      final dropdownRecurrencia = find.byType(
        DropdownButtonFormField<RecurrenciaTarea?>,
      );
      await tester.tap(dropdownRecurrencia);
      await tester.pumpAndSettle();
      await tester.tap(find.text('Semanal').last);
      await tester.pumpAndSettle();

      // Elegir dependencia «Preparar entorno».
      await tester.tap(find.text('Ninguna'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Preparar entorno'));
      await tester.pumpAndSettle();

      // Activar «Fijar tarea».
      await tester.tap(find.text('Fijar tarea'));
      await tester.pumpAndSettle();

      final valores = formKey.currentState!.validar();
      expect(valores, isNotNull);
      expect(valores!.recurrencia, RecurrenciaTarea.semanal);
      expect(valores.dependeDeId, 99);
      expect(valores.isFijada, isTrue);
    },
  );

  testWidgets(
    'AdjuntosTareaSection sube, previsualiza y elimina adjuntos con confirmación',
    (tester) async {
      final dio = Dio(BaseOptions(baseUrl: 'http://localhost:3000/api'));
      final adapter = _FakeAdjuntosAdapter();
      dio.httpClientAdapter = adapter;
      final apiClient = ApiClient(sesionStore: SesionStore(), dio: dio);
      final adjuntosApi = AdjuntosApi(apiClient: apiClient);

      String contenido = 'Descripción';
      await tester.pumpWidget(
        StatefulBuilder(
          builder: (context, setState) => _envolver(
            Padding(
              padding: const EdgeInsets.all(16),
              child: AdjuntosTareaSection(
                contenido: contenido,
                adjuntosApi: adjuntosApi,
                puedeEditar: true,
                selectorArchivo: (_) async =>
                    (nombre: 'foto.png', bytes: _png1x1),
                onAdjuntoSubido: (adjunto, alt) async {
                  setState(() {
                    contenido = agregarAdjuntoAMarkdown(
                      contenido,
                      adjunto,
                      alt: alt,
                    );
                  });
                },
                onEliminarAdjunto: (adjunto) async {
                  setState(() {
                    contenido = quitarAdjuntoDeMarkdown(contenido, adjunto.url);
                  });
                },
              ),
            ),
          ),
        ),
      );

      // Subir imagen.
      await tester.tap(find.text('Adjuntar'));
      await tester.pumpAndSettle();

      expect(adapter.subidas, 1);
      expect(adapter.descargas, 1);
      expect(find.text('Adjuntos (1)'), findsOneWidget);
      expect(find.byType(Image), findsOneWidget);

      // Eliminar con confirmación.
      await tester.tap(find.byTooltip('Eliminar adjunto'));
      await tester.pumpAndSettle();
      expect(find.text('¿Eliminar adjunto?'), findsOneWidget);
      await tester.tap(find.widgetWithText(TextButton, 'Eliminar'));
      await tester.pumpAndSettle();

      expect(find.text('Adjuntos'), findsOneWidget);
      expect(contenido, 'Descripción');
    },
  );
}
