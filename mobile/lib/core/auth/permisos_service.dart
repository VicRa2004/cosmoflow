import 'package:dio/dio.dart';
import '../api/api_client.dart';

/// Consulta `GET /api/permisos/mios` y sincroniza los permisos efectivos en `SesionStore`.
class PermisosService {
  const PermisosService({required this.apiClient});

  final ApiClient apiClient;

  Future<void> cargarPermisosMios() async {
    if (!apiClient.sesionStore.isAutenticado) return;

    try {
      final response = await apiClient.dio.get<List<dynamic>>('/permisos/mios');
      final lista = response.data ?? const <dynamic>[];
      final conjunto = <String>{};

      for (final item in lista) {
        if (item is Map<String, dynamic>) {
          final recurso = item['recurso'] as String?;
          final accion = item['accion'] as String?;
          if (recurso != null && accion != null) {
            conjunto.add('$recurso:$accion');
          }
        }
      }

      apiClient.sesionStore.establecerPermisos(conjunto);
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) {
        // Sin el módulo `autorizacion`, cualquier usuario autenticado tiene acceso.
        apiClient.sesionStore.establecerPermisos(
          const <String>{},
          permitirTodos: true,
        );
      }
    }
  }
}
