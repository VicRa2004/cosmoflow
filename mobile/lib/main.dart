import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'core/api/api_client.dart';
import 'core/auth/sesion_store.dart';
import 'core/offline/cola_sin_conexion.dart';
import 'core/router/app_router.dart';
import 'core/theme/tema_app.dart';
import 'modules/auth/api/auth_api.dart';
import 'modules/notas/api/notas_api.dart';
import 'modules/tags/api/tags_api.dart';
import 'modules/tareas/api/tareas_api.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();

  final sesionStore = SesionStore();
  final apiClient = ApiClient(sesionStore: sesionStore);
  final authApi = AuthApi(apiClient: apiClient);
  final cola = ColaSinConexion(apiClient: apiClient);
  final tareasApi = TareasApi(apiClient: apiClient, cola: cola);
  final notasApi = NotasApi(apiClient: apiClient, cola: cola);
  final tagsApi = TagsApi(apiClient: apiClient);

  runApp(
    CosmoflowMobileApp(
      sesionStore: sesionStore,
      authApi: authApi,
      tareasApi: tareasApi,
      notasApi: notasApi,
      tagsApi: tagsApi,
      cola: cola,
    ),
  );
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
    this.cola,
    this.restaurarAlIniciar = true,
  });

  final SesionStore sesionStore;
  final AuthApi authApi;
  final TareasApi? tareasApi;
  final NotasApi? notasApi;
  final TagsApi? tagsApi;

  /// Notas y tareas creadas sin conexión; sin ella no hay modo offline.
  final ColaSinConexion? cola;
  final bool restaurarAlIniciar;

  @override
  State<CosmoflowMobileApp> createState() => _CosmoflowMobileAppState();
}

class _CosmoflowMobileAppState extends State<CosmoflowMobileApp>
    with WidgetsBindingObserver {
  late final GoRouter _router;
  Timer? _reintentos;
  bool _sincronizando = false;

  @override
  void initState() {
    super.initState();
    final apiClient = widget.authApi.apiClient;
    final tareasApi = widget.tareasApi ?? TareasApi(apiClient: apiClient);
    final notasApi = widget.notasApi ?? NotasApi(apiClient: apiClient);
    final tagsApi = widget.tagsApi ?? TagsApi(apiClient: apiClient);

    _router = crearAppRouter(
      sesionStore: widget.sesionStore,
      authApi: widget.authApi,
      tareasApi: tareasApi,
      notasApi: notasApi,
      tagsApi: tagsApi,
      cargarDatosIniciales: widget.restaurarAlIniciar,
    );
    if (widget.restaurarAlIniciar) {
      widget.authApi.restaurarSesion().then((_) => _sincronizar());
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
    if (state == AppLifecycleState.resumed) _sincronizar();
  }

  /// Si se entró sin conexión, primero recupera la sesión real; luego envía la cola.
  /// De una en una: dos refresh en paralelo revocarían la sesión (el backend rota el token).
  Future<void> _sincronizar() async {
    final cola = widget.cola;
    final sesion = widget.sesionStore;
    if (cola == null || !sesion.isAutenticado || _sincronizando) return;
    _sincronizando = true;
    try {
      if (sesion.sinConexion && !await widget.authApi.restaurarSesion()) return;
      await cola.sincronizar();
    } finally {
      _sincronizando = false;
    }
  }

  @override
  void dispose() {
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
