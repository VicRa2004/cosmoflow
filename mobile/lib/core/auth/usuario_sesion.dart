/// Modelo del usuario autenticado devuelto por `/api/auth/login` y `/api/auth/refresh`.
class UsuarioSesion {
  const UsuarioSesion({
    required this.id,
    required this.nombre,
    required this.email,
    required this.emailVerificado,
    this.avatarUrl,
    this.roles = const <String>[],
  });

  final int id;
  final String nombre;
  final String email;
  final bool emailVerificado;
  final String? avatarUrl;
  final List<String> roles;

  factory UsuarioSesion.fromJson(Map<String, dynamic> json) {
    final rolesRaw = json['roles'];
    final rolesLista = rolesRaw is List
        ? rolesRaw.whereType<String>().toList(growable: false)
        : const <String>[];

    return UsuarioSesion(
      id: (json['id'] as num).toInt(),
      nombre: json['nombre'] as String? ?? '',
      email: json['email'] as String? ?? '',
      emailVerificado: json['emailVerificado'] as bool? ?? false,
      avatarUrl: json['avatarUrl'] as String?,
      roles: rolesLista,
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'nombre': nombre,
        'email': email,
        'emailVerificado': emailVerificado,
        'avatarUrl': avatarUrl,
        'roles': roles,
      };
}
