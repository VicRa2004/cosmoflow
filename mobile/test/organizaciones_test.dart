import 'package:cosmoflow_mobile/core/api/api_client.dart';
import 'package:cosmoflow_mobile/core/auth/almacenamiento_seguro.dart';
import 'package:cosmoflow_mobile/core/auth/sesion_store.dart';
import 'package:cosmoflow_mobile/core/auth/usuario_sesion.dart';
import 'package:cosmoflow_mobile/core/theme/tema_app.dart';
import 'package:cosmoflow_mobile/modules/notas/api/notas_api.dart';
import 'package:cosmoflow_mobile/modules/organizaciones/api/organizaciones_api.dart';
import 'package:cosmoflow_mobile/modules/organizaciones/models/organizacion_models.dart';
import 'package:cosmoflow_mobile/modules/organizaciones/pages/equipo_detalle_page.dart';
import 'package:cosmoflow_mobile/modules/organizaciones/pages/organizacion_detalle_page.dart';
import 'package:cosmoflow_mobile/modules/organizaciones/pages/proyecto_detalle_page.dart';
import 'package:cosmoflow_mobile/modules/organizaciones/widgets/equipo_form.dart';
import 'package:cosmoflow_mobile/modules/organizaciones/widgets/estadisticas_tareas_card.dart';
import 'package:cosmoflow_mobile/modules/organizaciones/widgets/organizacion_form.dart';
import 'package:cosmoflow_mobile/modules/organizaciones/widgets/proyecto_form.dart';
import 'package:cosmoflow_mobile/modules/organizaciones/widgets/rol_organizacion_form.dart';
import 'package:cosmoflow_mobile/modules/tags/api/tags_api.dart';
import 'package:cosmoflow_mobile/modules/tags/models/tag_model.dart';
import 'package:cosmoflow_mobile/modules/tareas/api/tareas_api.dart';
import 'package:cosmoflow_mobile/modules/tareas/models/estadisticas_tareas_model.dart';
import 'package:cosmoflow_mobile/modules/tareas/widgets/tarea_form.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('Modelos de organización, equipo, proyecto y miembro parsean JSON y aplican RN-22/RN-23', () {
    final org = OrganizacionDto.fromJson(<String, dynamic>{
      'id': 10,
      'nombre': 'Saasil',
      'descripcion': 'Equipo de producto',
      'color': '#4F46E5',
      'isAdmin': false,
      'permisos': <String>['tags:gestionar'],
    });
    expect(org.id, equals(10));
    expect(org.puede('tags:gestionar'), isTrue);
    expect(org.puede('miembros:gestionar'), isFalse);

    final equipoSinLider = EquipoDto.fromJson(<String, dynamic>{
      'id': 1,
      'nombre': 'Mobile',
      'descripcion': 'App Flutter',
      'liderId': null,
      'miembros': <Map<String, dynamic>>[
        <String, dynamic>{'usuarioId': 5, 'puedeCrearTareas': false},
        <String, dynamic>{'usuarioId': 6, 'puedeCrearTareas': false},
      ],
      'tagIds': <int>[2],
    });
    expect(equipoSinLider.puedeCrearTareas(5), isTrue);
    expect(equipoSinLider.puedeCrearTareas(99), isFalse);

    final equipoConLider = EquipoDto.fromJson(<String, dynamic>{
      'id': 2,
      'nombre': 'Backend',
      'descripcion': 'API Hono',
      'liderId': 5,
      'miembros': <Map<String, dynamic>>[
        <String, dynamic>{'usuarioId': 5, 'puedeCrearTareas': true},
        <String, dynamic>{'usuarioId': 6, 'puedeCrearTareas': true},
        <String, dynamic>{'usuarioId': 7, 'puedeCrearTareas': false},
      ],
    });
    expect(equipoConLider.puedeCrearTareas(5), isTrue);
    expect(equipoConLider.puedeCrearTareas(6), isTrue);
    expect(equipoConLider.puedeCrearTareas(7), isFalse);

    final proyecto = ProyectoDto.fromJson(<String, dynamic>{
      'id': 20,
      'nombre': 'Lanzamiento v1',
      'descripcion': 'Hito Q4',
      'estado': 'activo',
      'progreso': <String, dynamic>{'tareas': 8, 'completadas': 5},
      'equipoIds': <int>[1],
      'integranteIds': <int>[7],
    });
    expect(proyecto.estado, equals(EstadoProyecto.activo));
    expect(proyecto.progreso.completadas, equals(5));

    final miembros = <MiembroDto>[
      const MiembroDto(usuarioId: 5, nombre: 'Ana', email: 'ana@test.com'),
      const MiembroDto(usuarioId: 6, nombre: 'Luis', email: 'luis@test.com'),
      const MiembroDto(usuarioId: 7, nombre: 'Sara', email: 'sara@test.com'),
      const MiembroDto(usuarioId: 8, nombre: 'Beto', email: 'beto@test.com'),
    ];

    final respOrg = filtrarMiembrosDestino(miembros: miembros);
    expect(respOrg.map((m) => m.id), equals(<int>[5, 6, 7, 8]));

    final respEquipo = filtrarMiembrosDestino(
      miembros: miembros,
      equipos: <EquipoDto>[equipoSinLider],
      equipoId: 1,
    );
    expect(respEquipo.map((m) => m.id), equals(<int>[5, 6]));

    final respProyecto = filtrarMiembrosDestino(
      miembros: miembros,
      equipos: <EquipoDto>[equipoSinLider, equipoConLider],
      proyectos: <ProyectoDto>[proyecto],
      proyectoId: 20,
    );
    expect(respProyecto.map((m) => m.id), equals(<int>[5, 6, 7]));
  });

  testWidgets(
    'OrganizacionDetallePage muestra pestañas Proyectos, Equipos, Tareas y Tags',
    (WidgetTester tester) async {
      final sesionStore = SesionStore(
        almacenamientoSeguro: MemoriaAlmacenamientoSeguro(),
      );
      sesionStore.establecerSesion(
        accessToken: 'jwt',
        usuario: const UsuarioSesion(
          id: 5,
          nombre: 'Ana',
          email: 'ana@test.com',
          emailVerificado: true,
        ),
      );
      final apiClient = ApiClient(sesionStore: sesionStore);

      await tester.pumpWidget(
        MaterialApp(
          theme: TemaApp.claro,
          home: OrganizacionDetallePage(
            id: 10,
            sesionStore: sesionStore,
            organizacionesApi: OrganizacionesApi(apiClient: apiClient),
            tareasApi: TareasApi(apiClient: apiClient),
            tagsApi: TagsApi(apiClient: apiClient),
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

      expect(find.text('Saasil'), findsOneWidget);
      expect(find.text('Proyectos'), findsOneWidget);
      expect(find.text('Equipos'), findsOneWidget);
      expect(find.text('Miembros'), findsOneWidget);
      expect(find.text('Tareas'), findsOneWidget);
      expect(find.text('Estadísticas'), findsOneWidget);
      expect(find.text('Tags'), findsOneWidget);
      expect(find.text('Roles'), findsOneWidget);
      expect(find.text('Ajustes'), findsOneWidget);
      expect(find.text('Sin proyectos'), findsOneWidget);

      await tester.tap(find.text('Equipos'));
      await tester.pumpAndSettle();
      expect(find.text('Sin equipos'), findsOneWidget);

      await tester.tap(find.text('Miembros'));
      await tester.pumpAndSettle();
      expect(find.text('Sin miembros'), findsOneWidget);

      await tester.ensureVisible(find.text('Ajustes'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Ajustes'));
      await tester.pumpAndSettle();
      expect(find.text('Eliminar organización'), findsWidgets);
    },
  );

  testWidgets(
    'EquipoDetallePage y ProyectoDetallePage renderizan su contenido',
    (WidgetTester tester) async {
      final sesionStore = SesionStore(
        almacenamientoSeguro: MemoriaAlmacenamientoSeguro(),
      );
      sesionStore.establecerSesion(
        accessToken: 'jwt',
        usuario: const UsuarioSesion(
          id: 5,
          nombre: 'Ana',
          email: 'ana@test.com',
          emailVerificado: true,
        ),
      );
      final apiClient = ApiClient(sesionStore: sesionStore);
      const miembros = <MiembroDto>[
        MiembroDto(usuarioId: 5, nombre: 'Ana', email: 'ana@test.com'),
      ];
      const equipo = EquipoDto(
        id: 1,
        nombre: 'Equipo Mobile',
        descripcion: 'Desarrollo Flutter',
        liderId: 5,
        miembros: <MiembroEquipoDto>[
          MiembroEquipoDto(usuarioId: 5, puedeCrearTareas: true),
        ],
      );

      await tester.pumpWidget(
        MaterialApp(
          theme: TemaApp.claro,
          home: EquipoDetallePage(
            organizacionId: 10,
            equipoId: 1,
            sesionStore: sesionStore,
            organizacionesApi: OrganizacionesApi(apiClient: apiClient),
            tareasApi: TareasApi(apiClient: apiClient),
            tagsApi: TagsApi(apiClient: apiClient),
            args: const EquipoDetalleArgs(equipo: equipo, miembros: miembros),
            cargarAlIniciar: false,
          ),
        ),
      );

      expect(find.text('Equipo Mobile'), findsOneWidget);
      expect(find.text('Ana · Líder'), findsOneWidget);
      expect(find.byTooltip('Nueva tarea'), findsOneWidget);

      const proyecto = ProyectoDto(
        id: 20,
        nombre: 'App v2',
        descripcion: 'Nueva versión móvil',
        estado: EstadoProyecto.activo,
        progreso: ProgresoProyectoDto(tareas: 4, completadas: 2),
        integranteIds: <int>[5],
      );

      await tester.pumpWidget(
        MaterialApp(
          theme: TemaApp.claro,
          home: ProyectoDetallePage(
            organizacionId: 10,
            proyectoId: 20,
            sesionStore: sesionStore,
            organizacionesApi: OrganizacionesApi(apiClient: apiClient),
            tareasApi: TareasApi(apiClient: apiClient),
            notasApi: NotasApi(apiClient: apiClient),
            tagsApi: TagsApi(apiClient: apiClient),
            args: const ProyectoDetalleArgs(
              proyecto: proyecto,
              miembros: miembros,
            ),
            cargarAlIniciar: false,
          ),
        ),
      );

      expect(find.text('App v2'), findsOneWidget);
      expect(find.text('Tareas'), findsOneWidget);
      expect(find.text('Notas'), findsOneWidget);
      expect(find.textContaining('2/4 completadas'), findsOneWidget);
    },
  );

  testWidgets(
    'TareaForm permite seleccionar responsables y tags de organización',
    (WidgetTester tester) async {
      final formKey = GlobalKey<TareaFormState>();

      await tester.pumpWidget(
        MaterialApp(
          theme: TemaApp.claro,
          home: Scaffold(
            body: TareaForm(
              key: formKey,
              responsablesDisponibles: const <ResponsableCandidato>[
                (id: 5, nombre: 'Ana'),
                (id: 6, nombre: 'Luis'),
              ],
              tagsDisponibles: const <TagDto>[
                TagDto(id: 11, nombre: 'Urgente'),
              ],
            ),
          ),
        ),
      );

      await tester.enterText(
        find.byType(TextFormField).first,
        'Tarea en equipo',
      );
      final listaScroll = find.byType(Scrollable).first;
      await tester.scrollUntilVisible(
        find.text('Ana'),
        200,
        scrollable: listaScroll,
      );
      await tester.tap(find.text('Ana'));
      await tester.scrollUntilVisible(
        find.text('Urgente'),
        200,
        scrollable: listaScroll,
      );
      await tester.tap(find.text('Urgente'));
      await tester.pump();

      final valores = formKey.currentState!.validar();
      expect(valores, isNotNull);
      expect(valores!.titulo, equals('Tarea en equipo'));
      expect(valores.responsableIds, equals(<int>[5]));
      expect(valores.tagIds, equals(<int>[11]));
    },
  );

  testWidgets('OrganizacionForm valida nombre obligatorio y devuelve valores', (
    WidgetTester tester,
  ) async {
    final formKey = GlobalKey<OrganizacionFormState>();

    await tester.pumpWidget(
      MaterialApp(
        theme: TemaApp.claro,
        home: Scaffold(body: OrganizacionForm(key: formKey)),
      ),
    );

    expect(formKey.currentState!.validar(), isNull);
    await tester.pump();
    expect(find.text('El nombre es obligatorio'), findsOneWidget);

    await tester.enterText(find.byType(TextFormField).first, 'Acme');
    final valores = formKey.currentState!.validar();
    expect(valores, isNotNull);
    expect(valores!.nombre, equals('Acme'));
    expect(valores.color, startsWith('#'));
  });

  testWidgets('EquipoForm exige al menos 2 miembros (RN-20)', (
    WidgetTester tester,
  ) async {
    final formKey = GlobalKey<EquipoFormState>();
    const miembros = <MiembroDto>[
      MiembroDto(usuarioId: 5, nombre: 'Ana', email: 'ana@test.com'),
      MiembroDto(usuarioId: 6, nombre: 'Luis', email: 'luis@test.com'),
    ];

    await tester.pumpWidget(
      MaterialApp(
        theme: TemaApp.claro,
        home: Scaffold(
          body: EquipoForm(key: formKey, miembros: miembros),
        ),
      ),
    );

    await tester.enterText(find.byType(TextFormField).first, 'Backend');
    expect(formKey.currentState!.validar(), isNull);
    await tester.pump();
    expect(
      find.text('Elige al menos 2 miembros para el equipo'),
      findsOneWidget,
    );

    await tester.tap(find.text('Ana'));
    await tester.tap(find.text('Luis'));
    await tester.pump();

    final valores = formKey.currentState!.validar();
    expect(valores, isNotNull);
    expect(valores!.nombre, equals('Backend'));
    expect(valores.miembroIds, containsAll(<int>[5, 6]));
  });

  testWidgets('ProyectoForm exige al menos un equipo o persona (RN-31)', (
    WidgetTester tester,
  ) async {
    final formKey = GlobalKey<ProyectoFormState>();
    const miembros = <MiembroDto>[
      MiembroDto(usuarioId: 5, nombre: 'Ana', email: 'ana@test.com'),
    ];

    await tester.pumpWidget(
      MaterialApp(
        theme: TemaApp.claro,
        home: Scaffold(
          body: ProyectoForm(
            key: formKey,
            equipos: const <EquipoDto>[],
            miembros: miembros,
          ),
        ),
      ),
    );

    await tester.enterText(find.byType(TextFormField).first, 'Lanzamiento');
    expect(formKey.currentState!.validar(), isNull);
    await tester.pump();

    final listaScroll = find.byType(Scrollable).first;
    await tester.scrollUntilVisible(
      find.text('Ana'),
      200,
      scrollable: listaScroll,
    );
    await tester.tap(find.text('Ana'));
    await tester.pump();

    final valores = formKey.currentState!.validar();
    expect(valores, isNotNull);
    expect(valores!.nombre, equals('Lanzamiento'));
    expect(valores.integranteIds, equals(<int>[5]));
  });

  test(
    'Modelos de miembro con roles, invitación, rol y catálogo parsean JSON',
    () {
      final miembro = MiembroDto.fromJson(<String, dynamic>{
        'usuarioId': 7,
        'nombre': 'Beto',
        'email': 'beto@test.com',
        'isAdmin': false,
        'roles': <Map<String, dynamic>>[
          <String, dynamic>{'id': 2, 'nombre': 'Coordinación'},
        ],
      });
      expect(miembro.roles.length, equals(1));
      expect(miembro.roles.first.nombre, equals('Coordinación'));

      final inv = InvitacionDto.fromJson(<String, dynamic>{
        'id': 3,
        'email': 'nuevo@test.com',
        'expiraEn': '2026-12-01T00:00:00.000Z',
        'isCaducada': false,
      });
      expect(inv.email, equals('nuevo@test.com'));
      expect(inv.isCaducada, isFalse);

      final rol = RolOrganizacionDto.fromJson(<String, dynamic>{
        'id': 2,
        'nombre': 'Coordinación',
        'permisos': <String>['equipos:crear', 'proyectos:crear'],
        'totalMiembros': 4,
      });
      expect(rol.permisos, contains('equipos:crear'));
      expect(rol.totalMiembros, equals(4));

      final catalogo = CatalogoPermisosOrganizacionDto.fromJson(
        <String, dynamic>{
          'permisos': <String>['equipos:crear', 'proyectos:crear'],
          'plantillas': <Map<String, dynamic>>[
            <String, dynamic>{
              'nombre': 'Gestor',
              'permisos': <String>['equipos:crear'],
            },
          ],
        },
      );
      expect(catalogo.plantillas.first.nombre, equals('Gestor'));
    },
  );

  testWidgets('RolOrganizacionForm valida nombre y permite elegir permisos', (
    WidgetTester tester,
  ) async {
    final formKey = GlobalKey<RolOrganizacionFormState>();
    const catalogo = CatalogoPermisosOrganizacionDto(
      permisos: <String>['equipos:crear', 'proyectos:crear'],
      plantillas: <PlantillaRolDto>[
        PlantillaRolDto(nombre: 'Gestor', permisos: <String>['equipos:crear']),
      ],
    );

    await tester.pumpWidget(
      MaterialApp(
        theme: TemaApp.claro,
        home: Scaffold(
          body: RolOrganizacionForm(key: formKey, catalogo: catalogo),
        ),
      ),
    );

    expect(formKey.currentState!.validar(), isNull);
    await tester.pump();
    expect(find.text('El nombre es obligatorio'), findsOneWidget);

    await tester.enterText(find.byType(TextFormField).first, 'Coordinador');
    await tester.tap(find.text('Crear equipos'));
    await tester.pump();

    final valores = formKey.currentState!.validar();
    expect(valores, isNotNull);
    expect(valores!.nombre, equals('Coordinador'));
    expect(valores.permisos, equals(<String>['equipos:crear']));
  });

  testWidgets('EstadisticasTareasCard parsea y muestra cifras y responsables', (
    WidgetTester tester,
  ) async {
    final dto = EstadisticasTareasDto.fromJson(<String, dynamic>{
      'total': 10,
      'porEstado': <String, dynamic>{
        'pendiente': 3,
        'en_progreso': 2,
        'completada': 4,
        'cancelada': 1,
      },
      'abiertasPorPrioridad': <String, dynamic>{
        'alta': 2,
        'media': 2,
        'baja': 1,
      },
      'vencidas': 1,
      'porResponsable': <Map<String, dynamic>>[
        <String, dynamic>{'usuarioId': 5, 'abiertas': 3, 'completadas': 2},
      ],
    });

    expect(dto.abiertas, equals(5));
    expect(dto.cerradas, equals(5));
    expect(dto.porcentajeAvance, equals(80));

    await tester.pumpWidget(
      MaterialApp(
        theme: TemaApp.claro,
        home: Scaffold(
          body: SingleChildScrollView(
            child: EstadisticasTareasCard(
              estadisticas: dto,
              nombres: const <int, String>{5: 'Ana'},
              titulo: 'Tareas del equipo',
            ),
          ),
        ),
      ),
    );

    expect(find.text('Tareas del equipo'), findsOneWidget);
    expect(find.text('10 tareas en total.'), findsOneWidget);
    expect(find.text('80%'), findsOneWidget);
    expect(find.text('Ana'), findsOneWidget);
    expect(find.text('3 / 2'), findsOneWidget);
  });
}
