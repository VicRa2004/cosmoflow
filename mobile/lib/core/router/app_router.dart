import 'dart:async';

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
import '../../modules/notificaciones/api/notificaciones_api.dart';
import '../../modules/notificaciones/pages/notificaciones_preferencias_page.dart';
import '../../modules/organizaciones/api/organizaciones_api.dart';
import '../../modules/organizaciones/models/organizacion_models.dart';
import '../../modules/organizaciones/pages/equipo_detalle_page.dart';
import '../../modules/organizaciones/pages/equipo_editor_page.dart';
import '../../modules/organizaciones/pages/organizacion_detalle_page.dart';
import '../../modules/organizaciones/pages/organizacion_editor_page.dart';
import '../../modules/organizaciones/pages/organizaciones_page.dart';
import '../../modules/organizaciones/pages/proyecto_detalle_page.dart';
import '../../modules/organizaciones/pages/proyecto_editor_page.dart';
import '../../modules/organizaciones/pages/rol_organizacion_editor_page.dart';
import '../../modules/papelera/api/papelera_api.dart';
import '../../modules/papelera/pages/papelera_page.dart';
import '../../modules/perfil/pages/perfil_page.dart';
import '../../modules/plantillas/api/plantillas_api.dart';
import '../../modules/plantillas/pages/plantilla_editor_page.dart';
import '../../modules/plantillas/pages/plantillas_page.dart';
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
import '../notificaciones/recordatorios_service.dart';
import '../push/push_service.dart';

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
  PlantillasApi? plantillasApi,
  NotificacionesApi? notificacionesApi,
  PapeleraApi? papeleraApi,
  PushService? push,
  RecordatoriosService? recordatorios,
  bool cargarDatosIniciales = true,
}) {
  final plantillas =
      plantillasApi ?? PlantillasApi(apiClient: authApi.apiClient);
  final notifApi =
      notificacionesApi ?? NotificacionesApi(apiClient: authApi.apiClient);
  final papelera = papeleraApi ?? PapeleraApi(apiClient: authApi.apiClient);
  void resincronizarRecordatorios() {
    if (recordatorios != null) {
      unawaited(recordatorios.sincronizar(forzar: true));
    }
  }

  return GoRouter(
    initialLocation: '/dashboard',
    refreshListenable: sesionStore,
    redirect: (context, state) {
      final isAutenticado = sesionStore.isAutenticado;
      // Los deep links del esquema propio (`cosmoflow://login-callback?...`)
      // los procesa `OAuthGoogleService`; el router solo redirige a una ruta válida.
      if (state.uri.scheme == 'cosmoflow' || state.error != null) {
        return isAutenticado ? '/dashboard' : '/login';
      }
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
        path: '/organizaciones/nueva',
        builder: (context, state) =>
            OrganizacionEditorPage(organizacionesApi: organizacionesApi),
      ),
      GoRoute(
        path: '/organizaciones/:id',
        builder: (context, state) => OrganizacionDetallePage(
          id: int.parse(state.pathParameters['id']!),
          sesionStore: sesionStore,
          organizacionesApi: organizacionesApi,
          tareasApi: tareasApi,
          tagsApi: tagsApi,
          plantillasApi: plantillas,
          organizacion: state.extra is OrganizacionDto
              ? state.extra as OrganizacionDto
              : null,
          cargarAlIniciar: cargarDatosIniciales,
        ),
      ),
      GoRoute(
        path: '/organizaciones/:id/editar',
        builder: (context, state) => OrganizacionEditorPage(
          organizacionesApi: organizacionesApi,
          organizacion: state.extra is OrganizacionDto
              ? state.extra as OrganizacionDto
              : null,
        ),
      ),
      GoRoute(
        path: '/organizaciones/:id/equipos/nuevo',
        builder: (context, state) => EquipoEditorPage(
          organizacionId: int.parse(state.pathParameters['id']!),
          organizacionesApi: organizacionesApi,
          tagsApi: tagsApi,
          args: EquipoEditorArgs.fromExtra(state.extra),
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
        path: '/organizaciones/:id/equipos/:equipoId/editar',
        builder: (context, state) => EquipoEditorPage(
          organizacionId: int.parse(state.pathParameters['id']!),
          organizacionesApi: organizacionesApi,
          tagsApi: tagsApi,
          args: EquipoEditorArgs.fromExtra(state.extra),
        ),
      ),
      GoRoute(
        path: '/organizaciones/:id/proyectos/nuevo',
        builder: (context, state) => ProyectoEditorPage(
          organizacionId: int.parse(state.pathParameters['id']!),
          organizacionesApi: organizacionesApi,
          args: ProyectoEditorArgs.fromExtra(state.extra),
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
        path: '/organizaciones/:id/proyectos/:proyectoId/editar',
        builder: (context, state) => ProyectoEditorPage(
          organizacionId: int.parse(state.pathParameters['id']!),
          organizacionesApi: organizacionesApi,
          args: ProyectoEditorArgs.fromExtra(state.extra),
        ),
      ),
      GoRoute(
        path: '/organizaciones/:id/roles/nuevo',
        builder: (context, state) => RolOrganizacionEditorPage(
          organizacionId: int.parse(state.pathParameters['id']!),
          organizacionesApi: organizacionesApi,
        ),
      ),
      GoRoute(
        path: '/organizaciones/:id/roles/:rolId/editar',
        builder: (context, state) => RolOrganizacionEditorPage(
          organizacionId: int.parse(state.pathParameters['id']!),
          organizacionesApi: organizacionesApi,
          rol: state.extra is RolOrganizacionDto
              ? state.extra as RolOrganizacionDto
              : null,
        ),
      ),
      GoRoute(
        path: '/perfil/notificaciones',
        builder: (context, state) => NotificacionesPreferenciasPage(
          notificacionesApi: notifApi,
          cargarAlIniciar: cargarDatosIniciales,
          onPreferenciasActualizadas: resincronizarRecordatorios,
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
        path: '/papelera',
        builder: (context, state) => PapeleraPage(
          sesionStore: sesionStore,
          papeleraApi: papelera,
          cargarAlIniciar: cargarDatosIniciales,
        ),
      ),
      GoRoute(
        path: '/plantillas',
        builder: (context, state) => PlantillasPage(
          sesionStore: sesionStore,
          plantillasApi: plantillas,
          cargarAlIniciar: cargarDatosIniciales,
        ),
      ),
      GoRoute(
        path: '/plantillas/:id/editar',
        builder: (context, state) => PlantillaEditorPage(
          plantillaId: int.parse(state.pathParameters['id']!),
          plantillasApi: plantillas,
          args: PlantillaEditorArgs.fromExtra(state.extra),
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
          plantillasApi: plantillas,
          args: TareaEditorArgs.fromExtra(state.extra),
          cargarPlantillas: cargarDatosIniciales,
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
            plantillasApi: plantillas,
            organizacionesApi: organizacionesApi,
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
            plantillasApi: plantillas,
            tarea: args.tarea,
            args: args,
            cargarPlantillas: cargarDatosIniciales,
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
          notificacionesApi: notifApi,
          push: push,
          ofrecerPromptPush: cargarDatosIniciales,
          onPreferenciasActualizadas: resincronizarRecordatorios,
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
            path: '/organizaciones',
            builder: (context, state) => OrganizacionesPage(
              organizacionesApi: organizacionesApi,
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
