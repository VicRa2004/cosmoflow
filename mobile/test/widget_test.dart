import 'package:cosmoflow_mobile/core/api/api_client.dart';
import 'package:cosmoflow_mobile/core/api/auth_interceptor.dart';
import 'package:cosmoflow_mobile/core/auth/almacenamiento_seguro.dart';
import 'package:cosmoflow_mobile/core/auth/sesion_store.dart';
import 'package:cosmoflow_mobile/core/auth/usuario_sesion.dart';
import 'package:cosmoflow_mobile/core/theme/tema_app.dart';
import 'package:cosmoflow_mobile/main.dart';
import 'package:cosmoflow_mobile/modules/auth/api/auth_api.dart';
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

  test('TareaDto.fromJson parsea estados, prioridades y fechas del backend', () {
    final dto = TareaDto.fromJson(<String, dynamic>{
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

    expect(dto.id, equals(42));
    expect(dto.estado, equals(EstadoTarea.enProgreso));
    expect(dto.prioridad, equals(PrioridadTarea.alta));
    expect(dto.tagIds, equals(<int>[1, 2]));
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
    'Navega entre Login, Registro, Recuperar contraseña y el MainShell autenticado',
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

      await tester.tap(find.text('Crear cuenta'));
      await tester.pumpAndSettle();
      expect(
        find.text('Completa tus datos para comenzar a organizar tu trabajo.'),
        findsOneWidget,
      );

      await tester.tap(find.text('Iniciar sesión'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('¿Olvidaste tu contraseña?'));
      await tester.pumpAndSettle();
      expect(find.text('Recuperar contraseña'), findsOneWidget);

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

      await tester.tap(find.text('Tareas'));
      await tester.pumpAndSettle();
      expect(find.text('Asignadas a mí'), findsOneWidget);
    },
  );
}
