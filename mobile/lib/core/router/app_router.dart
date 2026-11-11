import 'package:go_router/go_router.dart';

import '../../modules/auth/api/auth_api.dart';
import '../../modules/auth/pages/login_page.dart';
import '../../modules/auth/pages/recuperar_password_page.dart';
import '../../modules/auth/pages/registro_page.dart';
import '../../modules/dashboard/pages/dashboard_page.dart';
import '../../modules/notas/api/notas_api.dart';
import '../../modules/notas/pages/nota_detalle_page.dart';
import '../../modules/notas/pages/nota_editor_page.dart';
import '../../modules/notas/pages/notas_page.dart';
import '../../modules/organizaciones/api/organizaciones_api.dart';
import '../../modules/organizaciones/models/organizacion_models.dart';
import '../../modules/organizaciones/pages/equipo_detalle_page.dart';
import '../../modules/organizaciones/pages/organizacion_detalle_page.dart';
import '../../modules/organizaciones/pages/organizaciones_page.dart';
import '../../modules/organizaciones/pages/proyecto_detalle_page.dart';
import '../../modules/perfil/pages/perfil_page.dart';
import '../../modules/tags/api/tags_api.dart';
import '../../modules/tags/pages/tags_page.dart';
import '../../modules/tareas/api/tareas_api.dart';
import '../../modules/tareas/acciones_tarea.dart';
import '../../modules/tareas/pages/calendario_page.dart';
import '../../modules/tareas/pages/tarea_detalle_page.dart';
import '../../modules/tareas/pages/tarea_editor_page.dart';
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
  required OrganizacionesApi organizacionesApi,
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
      // Fuera del shell: pantallas completas apiladas sobre la pestaña (con «atrás»).
      // shortcut: los editores reciben la entidad por `extra`; sin él (deep link) editar
      // abriría un alta vacía. Cargarla por `:id` si algún día hay enlaces profundos.
      GoRoute(
        path: '/organizaciones',
        builder: (context, state) => OrganizacionesPage(
          organizacionesApi: organizacionesApi,
          cargarAlIniciar: cargarDatosIniciales,
        ),
      ),
      GoRoute(
        path: '/organizaciones/:id',
        builder: (context, state) => OrganizacionDetallePage(
          id: int.parse(state.pathParameters['id']!),
          sesionStore: sesionStore,
          organizacionesApi: organizacionesApi,
          tareasApi: tareasApi,
          tagsApi: tagsApi,
          organizacion: state.extra is OrganizacionDto
              ? state.extra as OrganizacionDto
              : null,
          cargarAlIniciar: cargarDatosIniciales,
        ),
      ),
      GoRoute(
        path: '/organizaciones/:id/equipos/:equipoId',
        builder: (context, state) => EquipoDetallePage(
          organizacionId: int.parse(state.pathParameters['id']!),
          equipoId: int.parse(state.pathParameters['equipoId']!),
          sesionStore: sesionStore,
          organizacionesApi: organizacionesApi,
          tareasApi: tareasApi,
          tagsApi: tagsApi,
          args: EquipoDetalleArgs.fromExtra(state.extra),
          cargarAlIniciar: cargarDatosIniciales,
        ),
      ),
      GoRoute(
        path: '/organizaciones/:id/proyectos/:proyectoId',
        builder: (context, state) => ProyectoDetallePage(
          organizacionId: int.parse(state.pathParameters['id']!),
          proyectoId: int.parse(state.pathParameters['proyectoId']!),
          sesionStore: sesionStore,
          organizacionesApi: organizacionesApi,
          tareasApi: tareasApi,
          notasApi: notasApi,
          tagsApi: tagsApi,
          args: ProyectoDetalleArgs.fromExtra(state.extra),
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
        path: '/calendario',
        builder: (context, state) => CalendarioPage(
          acciones: AccionesTarea(
            sesionStore: sesionStore,
            tareasApi: tareasApi,
          ),
          tareasApi: tareasApi,
        ),
      ),
      GoRoute(
        path: '/tareas/nueva',
        builder: (context, state) => TareaEditorPage(
          tareasApi: tareasApi,
          args: TareaEditorArgs.fromExtra(state.extra),
        ),
      ),
      GoRoute(
        path: '/tareas/:id',
        builder: (context, state) {
          final args = TareaEditorArgs.fromExtra(state.extra);
          return TareaDetallePage(
            id: int.parse(state.pathParameters['id']!),
            tarea: args.tarea,
            args: args,
            acciones: AccionesTarea(
              sesionStore: sesionStore,
              tareasApi: tareasApi,
              organizacionId: args.organizacionId,
              equipoId: args.equipoId,
              proyectoId: args.proyectoId,
              tags: args.tags,
              responsables: args.responsables,
            ),
          );
        },
      ),
      GoRoute(
        path: '/tareas/:id/editar',
        builder: (context, state) {
          final args = TareaEditorArgs.fromExtra(state.extra);
          return TareaEditorPage(
            tareasApi: tareasApi,
            tarea: args.tarea,
            args: args,
          );
        },
      ),
      GoRoute(
        path: '/notas/nueva',
        builder: (context, state) => NotaEditorPage(
          notasApi: notasApi,
          args: state.extra as NotaEditorArgs? ?? const NotaEditorArgs(),
        ),
      ),
      GoRoute(
        path: '/notas/:id',
        builder: (context, state) => NotaDetallePage(
          id: int.parse(state.pathParameters['id']!),
          sesionStore: sesionStore,
          notasApi: notasApi,
          args: state.extra as NotaEditorArgs? ?? const NotaEditorArgs(),
        ),
      ),
      GoRoute(
        path: '/notas/:id/editar',
        builder: (context, state) => NotaEditorPage(
          notasApi: notasApi,
          args: state.extra as NotaEditorArgs? ?? const NotaEditorArgs(),
        ),
      ),
      ShellRoute(
        builder: (context, state, child) => MainShell(
          ubicacionActual: state.matchedLocation,
          sesionStore: sesionStore,
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
            path: '/perfil',
            builder: (context, state) =>
                PerfilPage(sesionStore: sesionStore, authApi: authApi),
          ),
        ],
      ),
    ],
  );
}
