import 'package:go_router/go_router.dart';
import '../../modules/auth/api/auth_api.dart';
import '../../modules/auth/pages/login_page.dart';
import '../../modules/dashboard/pages/dashboard_page.dart';
import '../auth/sesion_store.dart';

/// Construye el enrutador de la aplicación conectado a `SesionStore`.
GoRouter crearAppRouter({
  required SesionStore sesionStore,
  required AuthApi authApi,
}) {
  return GoRouter(
    initialLocation: '/dashboard',
    refreshListenable: sesionStore,
    redirect: (context, state) {
      final isAutenticado = sesionStore.isAutenticado;
      final enRutaLogin = state.matchedLocation == '/login';

      if (!isAutenticado && !enRutaLogin) {
        return '/login';
      }
      if (isAutenticado && enRutaLogin) {
        return '/dashboard';
      }
      return null;
    },
    routes: <RouteBase>[
      GoRoute(
        path: '/login',
        builder: (context, state) => LoginPage(authApi: authApi),
      ),
      GoRoute(
        path: '/dashboard',
        builder: (context, state) => DashboardPage(
          sesionStore: sesionStore,
          authApi: authApi,
        ),
      ),
    ],
  );
}
