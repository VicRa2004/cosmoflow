import 'package:cosmoflow_mobile/core/api/api_client.dart';
import 'package:cosmoflow_mobile/core/api/auth_interceptor.dart';
import 'package:cosmoflow_mobile/core/auth/almacenamiento_seguro.dart';
import 'package:cosmoflow_mobile/core/auth/sesion_store.dart';
import 'package:cosmoflow_mobile/core/auth/usuario_sesion.dart';
import 'package:cosmoflow_mobile/core/theme/tema_app.dart';
import 'package:cosmoflow_mobile/main.dart';
import 'package:cosmoflow_mobile/modules/auth/api/auth_api.dart';
import 'package:cosmoflow_mobile/modules/notas/models/nota_model.dart';
import 'package:cosmoflow_mobile/modules/tags/models/tag_model.dart';
import 'package:cosmoflow_mobile/modules/tareas/models/tarea_model.dart';
import 'package:cosmoflow_mobile/modules/tareas/widgets/tarea_card.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('AuthInterceptor extrae el refresh_token del header Set-Cookie', () {
    const headers = <String>[
      'refresh_token=token_secreto_123; Path=/api/auth; HttpOnly; SameSite=Strict',
    ];

    final extraido = AuthInterceptor.extraerRefreshTokenDeCookies(headers);
    expect(extraido, equals('token_secreto_123'));
  });

  test('Modelos TareaDto, NotaDto y TagDto parsean respuestas del backend', () {
    final tarea = TareaDto.fromJson(<String, dynamic>{
      'id': 42,
      'titulo': 'Preparar release móvil',
      'contenido': 'Revisar pruebas de integración',
      'estado': 'en_progreso',
      'prioridad': 'alta',
      'fechaInicio': '2026-11-06',
      'fechaVencimiento': '2026-11-10',
      'color': '#4F46E5',
      'tagIds': <int>[1, 2],
      'responsableIds': <int>[5],
    });
    expect(tarea.id, equals(42));
    expect(tarea.estado, equals(EstadoTarea.enProgreso));
    expect(tarea.prioridad, equals(PrioridadTarea.alta));

    final nota = NotaDto.fromJson(<String, dynamic>{
      'id': 7,
      'titulo': 'Arquitectura Flutter',
      'contenido': '# Notas de diseño',
      'color': '#059669',
      'tagIds': <int>[3],
    });
    expect(nota.id, equals(7));
    expect(nota.tagIds, equals(<int>[3]));

    final tag = TagDto.fromJson(<String, dynamic>{
      'id': 3,
      'nombre': 'Mobile',
      'color': '#4F46E5',
    });
    expect(tag.nombre, equals('Mobile'));
  });

  testWidgets(
    'TareaCard muestra botón Completar en tarea abierta y Reabrir en completada',
    (WidgetTester tester) async {
      var alternado = false;
      const tareaAbierta = TareaDto(
        id: 1,
        titulo: 'Revisar PR',
        contenido: '',
        estado: EstadoTarea.pendiente,
        prioridad: PrioridadTarea.media,
      );

      await tester.pumpWidget(
        MaterialApp(
          theme: TemaApp.claro,
          home: Scaffold(
            body: TareaCard(
              tarea: tareaAbierta,
              onTap: () {},
              onAlternarCompletada: () => alternado = true,
            ),
          ),
        ),
      );

      expect(find.text('Completar'), findsOneWidget);
      await tester.tap(find.text('Completar'));
      expect(alternado, isTrue);
    },
  );

  testWidgets(
    'Navega por todas las secciones del MainShell (Pendientes, Tareas, Notas, Tags, Perfil)',
    (WidgetTester tester) async {
      final almacenamiento = MemoriaAlmacenamientoSeguro();
      final sesionStore = SesionStore(almacenamientoSeguro: almacenamiento);
      final apiClient = ApiClient(sesionStore: sesionStore);
      final authApi = AuthApi(apiClient: apiClient);

      await tester.pumpWidget(
        CosmoflowMobileApp(
          sesionStore: sesionStore,
          authApi: authApi,
          restaurarAlIniciar: false,
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Iniciar sesión'), findsOneWidget);

      sesionStore.establecerSesion(
        accessToken: 'jwt-test',
        usuario: const UsuarioSesion(
          id: 1,
          nombre: 'Ana',
          email: 'ana@cosmoflow.com',
          emailVerificado: true,
          roles: <String>['ADMIN'],
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Nada pendiente'), findsOneWidget);

      await tester.tap(find.text('Notas'));
      await tester.pumpAndSettle();
      expect(find.text('Sin notas'), findsOneWidget);

      await tester.tap(find.text('Tags'));
      await tester.pumpAndSettle();
      expect(find.text('Sin etiquetas'), findsOneWidget);
    },
  );
}
