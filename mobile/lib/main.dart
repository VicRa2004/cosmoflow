import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'core/api/api_client.dart';
import 'core/auth/sesion_store.dart';
import 'core/router/app_router.dart';
import 'core/theme/tema_app.dart';
import 'modules/auth/api/auth_api.dart';
import 'modules/tareas/api/tareas_api.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();

  final sesionStore = SesionStore();
  final apiClient = ApiClient(sesionStore: sesionStore);
  final authApi = AuthApi(apiClient: apiClient);
  final tareasApi = TareasApi(apiClient: apiClient);

  runApp(
    CosmoflowMobileApp(
      sesionStore: sesionStore,
      authApi: authApi,
      tareasApi: tareasApi,
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
    this.restaurarAlIniciar = true,
  });

  final SesionStore sesionStore;
  final AuthApi authApi;
  final TareasApi? tareasApi;
  final bool restaurarAlIniciar;

  @override
  State<CosmoflowMobileApp> createState() => _CosmoflowMobileAppState();
}

class _CosmoflowMobileAppState extends State<CosmoflowMobileApp> {
  late final GoRouter _router;

  @override
  void initState() {
    super.initState();
    final tareasApi =
        widget.tareasApi ?? TareasApi(apiClient: widget.authApi.apiClient);
    _router = crearAppRouter(
      sesionStore: widget.sesionStore,
      authApi: widget.authApi,
      tareasApi: tareasApi,
      cargarDatosIniciales: widget.restaurarAlIniciar,
    );
    if (widget.restaurarAlIniciar) {
      widget.authApi.restaurarSesion();
    }
  }

  @override
  void dispose() {
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
