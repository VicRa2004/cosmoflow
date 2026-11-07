import 'package:go_router/go_router.dart';
import '../../modules/auth/api/auth_api.dart';
import '../../modules/auth/pages/login_page.dart';
import '../../modules/auth/pages/recuperar_password_page.dart';
import '../../modules/auth/pages/registro_page.dart';
import '../../modules/dashboard/pages/dashboard_page.dart';
import '../../modules/notas/api/notas_api.dart';
import '../../modules/notas/pages/notas_page.dart';
import '../../modules/perfil/pages/perfil_page.dart';
import '../../modules/tags/api/tags_api.dart';
import '../../modules/tags/pages/tags_page.dart';
import '../../modules/tareas/api/tareas_api.dart';
import '../../modules/tareas/pages/tareas_page.dart';
import '../auth/sesion_store.dart';
import '../layout/main_shell.dart';

const Set<String> _rutasPublicas = <String>{
  '/login',
  '/registro',
  '/recuperar-password',
};

/// Construye el enrutador de la aplicación conectado a `SesionStore`.
GoRouter crearAppRouter({
  required SesionStore sesionStore,
  required AuthApi authApi,
  required TareasApi tareasApi,
  required NotasApi notasApi,
  required TagsApi tagsApi,
  bool cargarDatosIniciales = true,
}) {
  return GoRouter(
    initialLocation: '/dashboard',
    refreshListenable: sesionStore,
    redirect: (context, state) {
      final isAutenticado = sesionStore.isAutenticado;
      final ubicacion = state.matchedLocation;
      final esRutaPublica = _rutasPublicas.contains(ubicacion);

      if (!isAutenticado && !esRutaPublica) {
        return '/login';
      }
      if (isAutenticado && esRutaPublica) {
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
        path: '/registro',
        builder: (context, state) => RegistroPage(authApi: authApi),
      ),
      GoRoute(
        path: '/recuperar-password',
        builder: (context, state) => RecuperarPasswordPage(authApi: authApi),
      ),
      ShellRoute(
        builder: (context, state, child) => MainShell(
          ubicacionActual: state.matchedLocation,
          sesionStore: sesionStore,
          authApi: authApi,
          child: child,
        ),
        routes: <RouteBase>[
          GoRoute(
            path: '/dashboard',
            builder: (context, state) => DashboardPage(
              sesionStore: sesionStore,
              tareasApi: tareasApi,
              cargarAlIniciar: cargarDatosIniciales,
            ),
          ),
          GoRoute(
            path: '/tareas',
            builder: (context, state) => TareasPage(
              sesionStore: sesionStore,
              tareasApi: tareasApi,
              cargarAlIniciar: cargarDatosIniciales,
            ),
          ),
          GoRoute(
            path: '/notas',
            builder: (context, state) => NotasPage(
              sesionStore: sesionStore,
              notasApi: notasApi,
              tagsApi: tagsApi,
              cargarAlIniciar: cargarDatosIniciales,
            ),
          ),
          GoRoute(
            path: '/tags',
            builder: (context, state) => TagsPage(
              sesionStore: sesionStore,
              tagsApi: tagsApi,
              cargarAlIniciar: cargarDatosIniciales,
            ),
          ),
          GoRoute(
            path: '/perfil',
            builder: (context, state) => PerfilPage(
              sesionStore: sesionStore,
              authApi: authApi,
            ),
          ),
        ],
      ),
    ],
  );
}
