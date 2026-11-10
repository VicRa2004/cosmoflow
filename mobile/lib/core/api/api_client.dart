import 'package:dio/dio.dart';
import '../auth/sesion_store.dart';
import '../config/entorno.dart';
import 'auth_interceptor.dart';

/// Cliente HTTP centralizado para comunicarse con el backend de Cosmoflow.
class ApiClient {
  ApiClient({
    required this.sesionStore,
    String? baseUrl,
    Dio? dio,
    Dio? dioRefresh,
  }) : dio =
           dio ??
           Dio(
             BaseOptions(
               baseUrl: baseUrl ?? Entorno.apiBaseUrl,
               connectTimeout: const Duration(seconds: 15),
               receiveTimeout: const Duration(seconds: 15),
               headers: <String, dynamic>{
                 'Content-Type': 'application/json',
                 'Accept': 'application/json',
                 // El backend devuelve el refresh token en el cuerpo, no en cookie.
                 'X-Client-Platform': 'mobile',
               },
             ),
           ) {
    authInterceptor = AuthInterceptor(
      sesionStore: sesionStore,
      dioPrincipal: this.dio,
      dioRefresh: dioRefresh,
    );
    this.dio.interceptors.add(authInterceptor);
  }

  final SesionStore sesionStore;
  final Dio dio;
  late final AuthInterceptor authInterceptor;
}
