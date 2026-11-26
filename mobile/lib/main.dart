import 'dart:async';

import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'core/api/api_client.dart';
import 'core/auth/sesion_store.dart';
import 'core/notificaciones/notificaciones_locales.dart';
import 'core/notificaciones/recordatorios_service.dart';
import 'core/offline/cola_sin_conexion.dart';
import 'core/push/push_service.dart';
import 'core/router/app_router.dart';
import 'core/theme/tema_app.dart';
import 'modules/auth/api/auth_api.dart';
import 'modules/auth/services/oauth_google_service.dart';
import 'modules/notas/api/notas_api.dart';
import 'modules/organizaciones/api/organizaciones_api.dart';
import 'modules/plantillas/api/plantillas_api.dart';
import 'modules/tags/api/tags_api.dart';
import 'modules/tareas/api/tareas_api.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final sesionStore = SesionStore();
  final apiClient = ApiClient(sesionStore: sesionStore);
  final notificacionesLocales = NotificacionesLocales(sesionStore: sesionStore);
  final push = await _iniciarPush(apiClient, notificacionesLocales);
  final recordatorios = RecordatoriosService(
    apiClient: apiClient,
    notificacionesLocales: notificacionesLocales,
  )..iniciar();
  final authApi = AuthApi(
    apiClient: apiClient,
    push: push,
    recordatorios: recordatorios,
  );
  final cola = ColaSinConexion(apiClient: apiClient);
  final tareasApi = TareasApi(
    apiClient: apiClient,
    cola: cola,
    recordatorios: recordatorios,
  );
  final notasApi = NotasApi(apiClient: apiClient, cola: cola);
  final tagsApi = TagsApi(apiClient: apiClient);
  final organizacionesApi = OrganizacionesApi(apiClient: apiClient);
  final plantillasApi = PlantillasApi(apiClient: apiClient);

  runApp(
    CosmoflowMobileApp(
      sesionStore: sesionStore,
      authApi: authApi,
      tareasApi: tareasApi,
      notasApi: notasApi,
      tagsApi: tagsApi,
      organizacionesApi: organizacionesApi,
      plantillasApi: plantillasApi,
      cola: cola,
      push: push,
      notificacionesLocales: notificacionesLocales,
      recordatorios: recordatorios,
    ),
  );
}

/// Sin configuración de Firebase (p. ej. iOS sin GoogleService-Info.plist) la app
/// funciona igual, solo sin notificaciones push.
Future<PushService?> _iniciarPush(
  ApiClient apiClient,
  NotificacionesLocales notificacionesLocales,
) async {
  try {
    await Firebase.initializeApp();
  } catch (e) {
    debugPrint('Firebase no configurado, push desactivado: $e');
    return null;
  }
  return PushService(
    apiClient: apiClient,
    notificacionesLocales: notificacionesLocales,
  )..iniciar();
}

/// Raíz de la aplicación móvil Cosmoflow.
class CosmoflowMobileApp extends StatefulWidget {
  const CosmoflowMobileApp({
    super.key,
    required this.sesionStore,
    required this.authApi,
    this.tareasApi,
    this.notasApi,
    this.tagsApi,
    this.organizacionesApi,
    this.plantillasApi,
    this.cola,
    this.push,
    this.notificacionesLocales,
    this.recordatorios,
    this.oauthGoogleService,
    this.restaurarAlIniciar = true,
  });

  final SesionStore sesionStore;
  final AuthApi authApi;
  final TareasApi? tareasApi;
  final NotasApi? notasApi;
  final TagsApi? tagsApi;
  final OrganizacionesApi? organizacionesApi;
  final PlantillasApi? plantillasApi;
  final OAuthGoogleService? oauthGoogleService;

  /// Notas y tareas creadas sin conexión; sin ella no hay modo offline.
  final ColaSinConexion? cola;
  final PushService? push;
  final NotificacionesLocales? notificacionesLocales;
  final RecordatoriosService? recordatorios;
  final bool restaurarAlIniciar;

  @override
  State<CosmoflowMobileApp> createState() => _CosmoflowMobileAppState();
}

class _CosmoflowMobileAppState extends State<CosmoflowMobileApp>
    with WidgetsBindingObserver {
  late final GoRouter _router;
  late final OAuthGoogleService _oauthGoogleService;
  Timer? _reintentos;
  bool _sincronizando = false;

  @override
  void initState() {
    super.initState();
    _oauthGoogleService = widget.oauthGoogleService ?? OAuthGoogleService();
    _oauthGoogleService.iniciarListenerGlobal(authApi: widget.authApi);

    final apiClient = widget.authApi.apiClient;
    final tareasApi = widget.tareasApi ?? TareasApi(apiClient: apiClient);
    final notasApi = widget.notasApi ?? NotasApi(apiClient: apiClient);
    final tagsApi = widget.tagsApi ?? TagsApi(apiClient: apiClient);
    final organizacionesApi =
        widget.organizacionesApi ?? OrganizacionesApi(apiClient: apiClient);
    final plantillasApi =
        widget.plantillasApi ?? PlantillasApi(apiClient: apiClient);

    // Antes de crear el router: arranca en `/cargando` y no muestra el login.
    if (widget.restaurarAlIniciar) widget.sesionStore.restaurando = true;
    _router = crearAppRouter(
      sesionStore: widget.sesionStore,
      authApi: widget.authApi,
      tareasApi: tareasApi,
      notasApi: notasApi,
      tagsApi: tagsApi,
      organizacionesApi: organizacionesApi,
      plantillasApi: plantillasApi,
      push: widget.push,
      recordatorios: widget.recordatorios,
      cargarDatosIniciales: widget.restaurarAlIniciar,
    );
    widget.push?.vincularNavegador(_abrirDesdeNotificacion);
    widget.notificacionesLocales?.vincularNavegador(_abrirDesdeNotificacion);
    if (widget.restaurarAlIniciar) {
      widget.authApi
          .restaurarSesion()
          .whenComplete(() => widget.sesionStore.restaurando = false)
          .then((_) => _sincronizar(forzarRecordatorios: true));
    }
    final cola = widget.cola;
    if (cola != null) {
      cola.cargar();
      WidgetsBinding.instance.addObserver(this);
      _reintentos = Timer.periodic(
        const Duration(seconds: 30),
        (_) => _sincronizar(),
      );
    }
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _sincronizar(forzarRecordatorios: true);
    }
  }

  /// Si se entró sin conexión, primero recupera la sesión real; luego envía la cola
  /// y sincroniza los recordatorios locales de inicio y vencimiento.
  /// De una en una: dos refresh en paralelo revocarían la sesión (el backend rota el token).
  Future<void> _sincronizar({bool forzarRecordatorios = false}) async {
    final cola = widget.cola;
    final sesion = widget.sesionStore;
    if (cola == null || !sesion.isAutenticado || _sincronizando) return;
    _sincronizando = true;
    try {
      if (sesion.sinConexion && !await widget.authApi.restaurarSesion()) return;
      final enviadas = await cola.sincronizar();
      await widget.recordatorios?.sincronizar(
        forzar: forzarRecordatorios || enviadas > 0,
      );
    } finally {
      _sincronizando = false;
    }
  }

  /// Al terminar de restaurar la sesión, el redirect `/cargando → /dashboard`
  /// reemplaza la pila: empujar la ruta en el siguiente frame, cuando ese
  /// redirect ya se aplicó, para que no se pierda.
  void _abrirDesdeNotificacion(String ruta) {
    WidgetsBinding.instance
      ..addPostFrameCallback((_) {
        if (mounted) _router.push(ruta);
      })
      ..scheduleFrame();
  }

  @override
  void dispose() {
    _oauthGoogleService.dispose();
    _reintentos?.cancel();
    WidgetsBinding.instance.removeObserver(this);
    _router.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: widget.sesionStore,
      builder: (context, _) {
        return MaterialApp.router(
          title: 'Cosmoflow',
          debugShowCheckedModeBanner: false,
          theme: TemaApp.claro,
          darkTheme: TemaApp.oscuro,
          themeMode: widget.sesionStore.modoTema,
          routerConfig: _router,
        );
      },
    );
  }
}
