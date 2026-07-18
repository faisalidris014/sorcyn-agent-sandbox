import 'dart:io';

import 'package:crypto/crypto.dart';
import 'package:dio/dio.dart';
import 'package:mime/mime.dart';
import 'package:path/path.dart' as p;

import '../network/dio_client.dart';

class UploadResult {
  final String key;
  final String publicUrl;
  final bool isDuplicate;

  UploadResult({required this.key, required this.publicUrl, this.isDuplicate = false});
}

class UploadService {
  Dio get _dio => DioClient.instance;

  /// Full upload flow:
  /// 1. Compute SHA-256 of file bytes for server-side dedup
  /// 2. POST /uploads — if isDuplicate, return existing URL immediately
  /// 3. PUT the file bytes directly to Cloudflare R2 via the presigned URL
  /// 4. Return the permanent public URL
  Future<UploadResult> uploadFile({
    required File file,
    required String category,
    String? contentHash,
  }) async {
    final filename = p.basename(file.path);
    final contentType = lookupMimeType(filename) ?? 'application/octet-stream';

    final fileBytes = await file.readAsBytes();
    final hash = contentHash ?? sha256.convert(fileBytes).toString();

    // Step 1: Get presigned upload URL from backend (with dedup check).
    // contentLength is signed into the presigned URL, so the PUT below MUST
    // send a body of exactly this size or R2 rejects it (SEC-M5 #265). Dio
    // sets an exact Content-Length from the same fileBytes, so they match.
    final response = await _dio.post('/uploads', data: {
      'filename': filename,
      'contentType': contentType,
      'category': category,
      'contentLength': fileBytes.length,
      'contentHash': hash,
    });

    final data = response.data['data'] as Map<String, dynamic>;
    final isDuplicate = data['isDuplicate'] as bool? ?? false;
    final key = data['key'] as String;
    final publicUrl = data['publicUrl'] as String;

    if (isDuplicate) {
      return UploadResult(key: key, publicUrl: publicUrl, isDuplicate: true);
    }

    // Step 2: PUT file directly to R2 (fresh Dio — no auth interceptor).
    // Send the raw bytes (Uint8List) so Dio sets an exact Content-Length and
    // does NOT fall back to chunked transfer encoding. MinIO/R2 presigned PUTs
    // reject chunked bodies, which caused concurrent uploads to fail
    // intermittently with the Retry overlay (#192). A single-subscription
    // Stream also broke retries, since it can only be read once.
    final uploadUrl = data['uploadUrl'] as String;
    final uploadDio = Dio();
    await uploadDio.put(
      uploadUrl,
      data: fileBytes,
      options: Options(contentType: contentType),
    );

    return UploadResult(key: key, publicUrl: publicUrl);
  }

  /// Delete a previously uploaded file by its R2 key.
  Future<void> deleteFile(String key) async {
    await _dio.delete('/uploads', queryParameters: {'key': key});
  }
}
