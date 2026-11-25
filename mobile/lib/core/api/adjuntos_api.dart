import 'dart:typed_data';

import 'package:dio/dio.dart';

import 'api_client.dart';

/// Límite de tamaño de imagen aceptado por el backend (`POST /api/adjuntos`).
const int adjuntoMaxBytes = 5 * 1024 * 1024;

/// DTO de respuesta de `POST /api/adjuntos`.
class AdjuntoDto {
  const AdjuntoDto({
    required this.id,
    required this.url,
    required this.tipo,
    required this.bytes,
  });

  final int id;
  final String url;
  final String tipo;
  final int bytes;

  factory AdjuntoDto.fromJson(Map<String, dynamic> json) {
    return AdjuntoDto(
      id: (json['id'] as num).toInt(),
      url: json['url'] as String? ?? '',
      tipo: json['tipo'] as String? ?? 'image/png',
      bytes: (json['bytes'] as num?)?.toInt() ?? 0,
    );
  }
}

/// Referencia a un adjunto embebido en Markdown (`![alt](/api/adjuntos/12)`).
class AdjuntoReferencia {
  const AdjuntoReferencia({
    required this.id,
    required this.url,
    required this.alt,
  });

  final int id;
  final String url;
  final String alt;
}

final RegExp _patronAdjuntoMarkdown = RegExp(
  r'!\[([^\]]*)\]\((/api/adjuntos/(\d+))\)',
);

/// Extrae todas las referencias a `/api/adjuntos/{id}` de un texto Markdown.
List<AdjuntoReferencia> extraerAdjuntosMarkdown(String markdown) {
  final encontrados = <AdjuntoReferencia>[];
  final vistos = <String>{};
  for (final m in _patronAdjuntoMarkdown.allMatches(markdown)) {
    final alt = m.group(1) ?? '';
    final url = m.group(2)!;
    final id = int.tryParse(m.group(3) ?? '');
    if (id == null || !vistos.add(url)) continue;
    encontrados.add(AdjuntoReferencia(id: id, url: url, alt: alt));
  }
  return encontrados;
}

/// Añade la referencia Markdown de un adjunto al final del contenido.
String agregarAdjuntoAMarkdown(
  String contenido,
  AdjuntoDto adjunto, {
  String alt = 'Imagen',
}) {
  final limpioAlt = alt.replaceAll('[', '').replaceAll(']', '').trim();
  final etiqueta = limpioAlt.isEmpty ? 'Imagen' : limpioAlt;
  final linea = '![$etiqueta](${adjunto.url})';
  final base = contenido.trimRight();
  if (base.isEmpty) return linea;
  return '$base\n\n$linea';
}

/// Elimina del contenido Markdown las referencias al adjunto con [url].
/// Al guardar la tarea, el backend limpia los adjuntos huérfanos.
String quitarAdjuntoDeMarkdown(String contenido, String url) {
  final escapada = RegExp.escape(url);
  final patron = RegExp(r'!\[[^\]]*\]\(' + escapada + r'\)[ \t]*\n?');
  return contenido
      .replaceAll(patron, '')
      .replaceAll(RegExp(r'\n{3,}'), '\n\n')
      .trim();
}

/// Cliente de API para `/api/adjuntos`.
class AdjuntosApi {
  AdjuntosApi({required this.apiClient});

  final ApiClient apiClient;
  final Map<String, Future<Uint8List>> _cacheDescargas =
      <String, Future<Uint8List>>{};

  /// Sube una imagen (PNG, JPEG o WebP, máx. 5 MB) a `POST /api/adjuntos`.
  Future<AdjuntoDto> subir({
    required Uint8List bytes,
    required String nombreArchivo,
    int? organizacionId,
    int? equipoId,
    int? proyectoId,
  }) async {
    final query = <String, dynamic>{
      if (proyectoId != null)
        'proyectoId': proyectoId
      else if (equipoId != null)
        'equipoId': equipoId
      else
        'organizacionId': ?organizacionId,
    };
    final formData = FormData.fromMap(<String, dynamic>{
      'archivo': MultipartFile.fromBytes(bytes, filename: nombreArchivo),
    });
    final response = await apiClient.dio.post<Map<String, dynamic>>(
      '/adjuntos',
      data: formData,
      queryParameters: query.isEmpty ? null : query,
      options: Options(contentType: 'multipart/form-data'),
    );
    return AdjuntoDto.fromJson(response.data!);
  }

  /// Descarga los bytes de un adjunto privado (`/api/adjuntos/{id}`) con Bearer.
  Future<Uint8List> descargar(String url) {
    return _cacheDescargas.putIfAbsent(url, () async {
      final ruta = url.replaceFirst(RegExp(r'^/api'), '');
      try {
        final response = await apiClient.dio.get<List<int>>(
          ruta,
          options: Options(responseType: ResponseType.bytes),
        );
        return Uint8List.fromList(response.data ?? const <int>[]);
      } catch (_) {
        _cacheDescargas.remove(url);
        rethrow;
      }
    });
  }
}
