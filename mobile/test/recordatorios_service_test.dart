import 'dart:convert';
import 'dart:typed_data';

import 'package:cosmoflow_mobile/core/api/api_client.dart';
import 'package:cosmoflow_mobile/core/auth/almacenamiento_seguro.dart';
import 'package:cosmoflow_mobile/core/auth/sesion_store.dart';
import 'package:cosmoflow_mobile/core/auth/usuario_sesion.dart';
import 'package:cosmoflow_mobile/core/notificaciones/recordatorios_service.dart';
import 'package:cosmoflow_mobile/modules/tareas/api/tareas_api.dart';
import 'package:cosmoflow_mobile/modules/tareas/models/tarea_model.dart';
import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';

class _AdaptadorMock implements HttpClientAdapter {
  _AdaptadorMock(this.handler);

  final ({int status, Object? body}) Function(RequestOptions options) handler;

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
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

SesionStore _sesionAutenticada() {
  final sesion = SesionStore(
    almacenamientoSeguro: MemoriaAlmacenamientoSeguro(),
  );
  sesion.establecerSesion(
    accessToken: 'jwt-prueba',
    usuario: const UsuarioSesion(
      id: 2,
      nombre: 'Marcos',
      email: 'marcos@ejemplo.com',
      emailVerificado: true,
      roles: <String>[],
    ),
  );
  return sesion;
}

TareaDto _tarea({
  int id = 10,
  String titulo = 'Entregar informe',
  EstadoTarea estado = EstadoTarea.pendiente,
  String? fechaInicio,
  String? fechaVencimiento,
}) {
  return TareaDto(
    id: id,
    titulo: titulo,
    contenido: '',
    estado: estado,
    prioridad: PrioridadTarea.media,
    fechaInicio: fechaInicio,
    fechaVencimiento: fechaVencimiento,
  );
}

void main() {
  group('construirRecordatoriosDeTarea', () {
    final ahora = DateTime(2026, 11, 21, 7, 30);

    test('genera avisos de inicio, vence mañana y vence hoy a las 8:00', () {
      final tarea = _tarea(
        id: 42,
        fechaInicio: '2026-11-22',
        fechaVencimiento: '2026-11-25',
      );

      final lista = RecordatoriosService.construirRecordatoriosDeTarea(
        tarea,
        ahora: ahora,
        incluirVencimiento: true,
      );

      expect(lista.length, 3);
      expect(lista[0].tipo, TipoRecordatorio.inicio);
      expect(lista[0].fechaLocal, DateTime(2026, 11, 22, 8, 0));
      expect(lista[0].payload, '/tareas/42');

      expect(lista[1].tipo, TipoRecordatorio.venceManana);
      expect(lista[1].fechaLocal, DateTime(2026, 11, 24, 8, 0));

      expect(lista[2].tipo, TipoRecordatorio.venceHoy);
      expect(lista[2].fechaLocal, DateTime(2026, 11, 25, 8, 0));
    });

    test('omite avisos de vencimiento cuando incluirVencimiento es false', () {
      final tarea = _tarea(
        id: 42,
        fechaInicio: '2026-11-22',
        fechaVencimiento: '2026-11-25',
      );

      final lista = RecordatoriosService.construirRecordatoriosDeTarea(
        tarea,
        ahora: ahora,
        incluirVencimiento: false,
      );

      expect(lista.length, 1);
      expect(lista.single.tipo, TipoRecordatorio.inicio);
    });

    test('evita duplicar inicio cuando coincide con el día de vencimiento', () {
      final tarea = _tarea(
        id: 5,
        fechaInicio: '2026-11-25',
        fechaVencimiento: '2026-11-25',
      );

      final lista = RecordatoriosService.construirRecordatoriosDeTarea(
        tarea,
        ahora: ahora,
        incluirVencimiento: true,
      );

      expect(lista.map((r) => r.tipo).toList(), <TipoRecordatorio>[
        TipoRecordatorio.venceManana,
        TipoRecordatorio.venceHoy,
      ]);
    });

    test(
      'ignora tareas completadas, canceladas, pasadas o fuera de 30 días',
      () {
        expect(
          RecordatoriosService.construirRecordatoriosDeTarea(
            _tarea(
              estado: EstadoTarea.completada,
              fechaVencimiento: '2026-11-25',
            ),
            ahora: ahora,
            incluirVencimiento: true,
          ),
          isEmpty,
        );
        expect(
          RecordatoriosService.construirRecordatoriosDeTarea(
            _tarea(
              estado: EstadoTarea.cancelada,
              fechaVencimiento: '2026-11-25',
            ),
            ahora: ahora,
            incluirVencimiento: true,
          ),
          isEmpty,
        );
        expect(
          RecordatoriosService.construirRecordatoriosDeTarea(
            _tarea(fechaVencimiento: '2026-11-20'),
            ahora: ahora,
            incluirVencimiento: true,
          ),
          isEmpty,
        );
        expect(
          RecordatoriosService.construirRecordatoriosDeTarea(
            _tarea(fechaVencimiento: '2027-02-01'),
            ahora: ahora,
            incluirVencimiento: true,
          ),
          isEmpty,
        );
      },
    );
  });

  group('RecordatoriosService.sincronizar', () {
    final ahora = DateTime(2026, 11, 21, 9, 0);

    test('con push móvil de vencimiento activo solo programa inicio y cancela obsoletos', () async {
      final sesion = _sesionAutenticada();
      final apiClient = ApiClient(sesionStore: sesion);
      apiClient.dio.httpClientAdapter = _AdaptadorMock((req) {
        if (req.path == '/notificaciones/movil') {
          return (
            status: 200,
            body: <String, dynamic>{'disponible': true, 'dispositivos': 1},
          );
        }
        if (req.path == '/notificaciones/preferencias') {
          return (
            status: 200,
            body: <Map<String, dynamic>>[
              <String, dynamic>{
                'evento': 'vencimiento',
                'canal': 'movil',
                'activo': true,
              },
            ],
          );
        }
        return (status: 200, body: <String, dynamic>{});
      });

      var permisosPedidos = 0;
      final programados = <RecordatorioProgramado>[];
      final cancelados = <int>[];

      final servicio = RecordatoriosService(
        apiClient: apiClient,
        ahora: () => ahora,
        solicitarPermiso: () async => permisosPedidos++,
        cargarPendientes: () async => <TareaDto>[
          _tarea(
            id: 10,
            fechaInicio: '2026-11-23',
            fechaVencimiento: '2026-11-25',
          ),
        ],
        // 42 es notificación push (< idBase): no debe cancelarse.
        // idPara(99, venceHoy) es recordatorio obsoleto: sí debe cancelarse.
        idsPendientes: () async => <int>[
          42,
          RecordatoriosService.idPara(99, TipoRecordatorio.venceHoy),
        ],
        programar: (r) async => programados.add(r),
        cancelar: (id) async => cancelados.add(id),
      );

      await servicio.sincronizar(forzar: true);

      expect(permisosPedidos, 1);
      expect(servicio.pushVencimientoActivo, isTrue);
      expect(cancelados, <int>[
        RecordatoriosService.idPara(99, TipoRecordatorio.venceHoy),
      ]);
      expect(programados.length, 1);
      expect(programados.single.tipo, TipoRecordatorio.inicio);
      expect(programados.single.tareaId, 10);
    });

    test(
      'sin push móvil de vencimiento programa inicio, vence mañana y vence hoy',
      () async {
        final sesion = _sesionAutenticada();
        final apiClient = ApiClient(sesionStore: sesion);
        apiClient.dio.httpClientAdapter = _AdaptadorMock((req) {
          if (req.path == '/notificaciones/movil') {
            return (
              status: 200,
              body: <String, dynamic>{'disponible': true, 'dispositivos': 1},
            );
          }
          if (req.path == '/notificaciones/preferencias') {
            return (
              status: 200,
              body: <Map<String, dynamic>>[
                <String, dynamic>{
                  'evento': 'vencimiento',
                  'canal': 'movil',
                  'activo': false,
                },
              ],
            );
          }
          return (status: 200, body: <String, dynamic>{});
        });

        final programados = <RecordatorioProgramado>[];
        final servicio = RecordatoriosService(
          apiClient: apiClient,
          ahora: () => ahora,
          solicitarPermiso: () async {},
          cargarPendientes: () async => <TareaDto>[
            _tarea(
              id: 7,
              fechaInicio: '2026-11-22',
              fechaVencimiento: '2026-11-24',
            ),
          ],
          idsPendientes: () async => const <int>[],
          programar: (r) async => programados.add(r),
          cancelar: (_) async {},
        );

        await servicio.sincronizar(forzar: true);

        expect(servicio.pushVencimientoActivo, isFalse);
        expect(programados.map((r) => r.tipo).toList(), <TipoRecordatorio>[
          TipoRecordatorio.inicio,
          TipoRecordatorio.venceManana,
          TipoRecordatorio.venceHoy,
        ]);
      },
    );
  });

  group('reprogramación al cambiar, completar o eliminar tarea', () {
    final ahora = DateTime(2026, 11, 21, 9, 0);

    test(
      'TareasApi reprograma al editar y cancela al completar o eliminar',
      () async {
        final sesion = _sesionAutenticada();
        final apiClient = ApiClient(sesionStore: sesion);
        apiClient.dio.httpClientAdapter = _AdaptadorMock((req) {
          if (req.method == 'PUT' && req.path == '/tareas/15') {
            final body = req.data as Map<String, dynamic>;
            return (
              status: 200,
              body: <String, dynamic>{
                'id': 15,
                'titulo': 'Revisar PR',
                'contenido': '',
                'estado': body['estado'] ?? 'pendiente',
                'prioridad': 'media',
                'fechaInicio': null,
                'fechaVencimiento': body['fechaVencimiento'] ?? '2026-11-26',
              },
            );
          }
          if (req.method == 'DELETE' && req.path == '/tareas/15') {
            return (status: 204, body: null);
          }
          return (status: 200, body: <String, dynamic>{});
        });

        final programados = <RecordatorioProgramado>[];
        final cancelados = <int>[];
        final servicio = RecordatoriosService(
          apiClient: apiClient,
          ahora: () => ahora,
          programar: (r) async => programados.add(r),
          cancelar: (id) async => cancelados.add(id),
          idsPendientes: () async => const <int>[],
        );
        final tareasApi = TareasApi(
          apiClient: apiClient,
          recordatorios: servicio,
        );

        // 1. Editar fecha: cancela los 3 previos y programa los 2 nuevos.
        final editada = await tareasApi.actualizar(15, <String, dynamic>{
          'fechaVencimiento': '2026-11-26',
        });
        await Future<void>.delayed(Duration.zero);

        expect(cancelados, RecordatoriosService.idsDeTarea(15));
        expect(programados.length, 2);
        expect(programados.map((r) => r.tipo).toList(), <TipoRecordatorio>[
          TipoRecordatorio.venceManana,
          TipoRecordatorio.venceHoy,
        ]);

        // 2. Completar tarea: cancela los 3 y no programa ninguno.
        programados.clear();
        cancelados.clear();
        await tareasApi.alternarCompletada(editada!);
        await Future<void>.delayed(Duration.zero);

        expect(cancelados, RecordatoriosService.idsDeTarea(15));
        expect(programados, isEmpty);

        // 3. Eliminar tarea: cancela los 3 IDs.
        cancelados.clear();
        await tareasApi.eliminar(15);
        await Future<void>.delayed(Duration.zero);

        expect(cancelados, RecordatoriosService.idsDeTarea(15));
      },
    );

    test('cancelarTodos solo borra IDs de recordatorios locales', () async {
      final sesion = _sesionAutenticada();
      final apiClient = ApiClient(sesionStore: sesion);
      final cancelados = <int>[];
      final servicio = RecordatoriosService(
        apiClient: apiClient,
        idsPendientes: () async => <int>[
          1,
          2,
          RecordatoriosService.idPara(3, TipoRecordatorio.inicio),
          RecordatoriosService.idPara(3, TipoRecordatorio.venceHoy),
        ],
        cancelar: (id) async => cancelados.add(id),
      );

      await servicio.cancelarTodos();

      expect(cancelados, <int>[
        RecordatoriosService.idPara(3, TipoRecordatorio.inicio),
        RecordatoriosService.idPara(3, TipoRecordatorio.venceHoy),
      ]);
    });
  });
}
