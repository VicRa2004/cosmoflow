import 'package:cosmoflow_mobile/modules/notas/models/carpeta_model.dart';
import 'package:cosmoflow_mobile/modules/notas/models/nota_model.dart';
import 'package:cosmoflow_mobile/modules/perfil/models/perfil_models.dart';
import 'package:cosmoflow_mobile/modules/tareas/models/actividad_tarea_model.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('rutaDeCarpeta y descendientesDeCarpeta resuelven jerarquías', () {
    const carpetas = <CarpetaDto>[
      CarpetaDto(id: 1, nombre: 'Trabajo'),
      CarpetaDto(id: 2, nombre: 'Clientes', padreId: 1),
      CarpetaDto(id: 3, nombre: 'Acme', padreId: 2),
      CarpetaDto(id: 4, nombre: 'Personal'),
    ];

    final ruta = rutaDeCarpeta(3, carpetas);
    expect(
      ruta.map((c) => c.nombre),
      equals(<String>['Trabajo', 'Clientes', 'Acme']),
    );

    final descendientes = descendientesDeCarpeta(1, carpetas);
    expect(descendientes, equals(<int>{1, 2, 3}));

    final arbolSinTrabajo = carpetasEnArbol(
      carpetas,
      excluirIds: descendientes,
    );
    expect(arbolSinTrabajo.map((n) => n.carpeta.id), equals(<int>[4]));
  });

  test('ordenarNotas mantiene siempre las fijadas arriba', () {
    final notas = <NotaDto>[
      NotaDto(
        id: 1,
        titulo: 'Alpha',
        contenido: '',
        createdAt: DateTime(2026, 1, 1),
      ),
      NotaDto(
        id: 2,
        titulo: 'Zeta',
        contenido: '',
        isFijada: true,
        createdAt: DateTime(2026, 1, 1),
      ),
      NotaDto(
        id: 3,
        titulo: 'Beta',
        contenido: '',
        createdAt: DateTime(2026, 2, 1),
      ),
    ];

    final porNombre = ordenarNotas(notas, OrdenNotas.nombre);
    expect(porNombre.map((n) => n.id), equals(<int>[2, 1, 3]));

    final porCreada = ordenarNotas(notas, OrdenNotas.creada);
    expect(porCreada.map((n) => n.id), equals(<int>[2, 3, 1]));
  });

  test('describirActividad formatea eventos de tarea en español', () {
    final pagina = PaginaActividadTarea.fromJson(<String, dynamic>{
      'datos': <Map<String, dynamic>>[
        <String, dynamic>{
          'id': 10,
          'evento': 'tarea.estadoCambiado',
          'datos': <String, dynamic>{
            'anterior': 'pendiente',
            'nuevo': 'completada',
          },
          'actorId': 7,
          'ocurridoEn': '2026-11-27T12:00:00.000Z',
        },
      ],
      'nombres': <String, dynamic>{'7': 'Ana'},
      'hayMas': false,
    });

    expect(pagina.datos.length, 1);
    expect(
      describirActividad(pagina.datos.first, pagina.nombres),
      equals('Ana cambió el estado a «Completada»'),
    );
  });

  test('modelos de perfil parsean sesiones, 2FA y suscripción iCalendar', () {
    final sesion = SesionActivaDto.fromJson(<String, dynamic>{
      'id': 5,
      'createdAt': '2026-11-20T10:00:00.000Z',
      'expiraEn': '2026-11-27T10:00:00.000Z',
      'isActual': true,
    });
    expect(sesion.isActual, isTrue);

    final dosPasos = EstadoDosPasosDto.fromJson(<String, dynamic>{
      'isActivo': true,
      'codigosRestantes': 8,
    });
    expect(dosPasos.isActivo, isTrue);
    expect(dosPasos.codigosRestantes, 8);

    final cal = SuscripcionCalendarioDto.fromJson(<String, dynamic>{
      'activa': true,
      'creadaEn': '2026-11-27T10:00:00.000Z',
    });
    expect(cal.activa, isTrue);
    expect(cal.creadaEn, isNotNull);
  });
}
