class ApiResponse<T> {
  final bool success;
  final T? data;
  final ApiError? error;
  final PaginationMeta? meta;

  ApiResponse({
    required this.success,
    this.data,
    this.error,
    this.meta,
  });

  factory ApiResponse.fromJson(
    Map<String, dynamic> json,
    T Function(dynamic)? fromJsonT,
  ) {
    return ApiResponse<T>(
      success: json['success'] as bool,
      data: json['data'] != null && fromJsonT != null
          ? fromJsonT(json['data'])
          : json['data'] as T?,
      error: json['error'] != null
          ? ApiError.fromJson(json['error'] as Map<String, dynamic>)
          : null,
      meta: json['meta'] != null
          ? PaginationMeta.fromJson(json['meta'] as Map<String, dynamic>)
          : null,
    );
  }
}

class ApiError {
  final String type;
  final String title;
  final int status;
  final String detail;
  final String? instance;
  final Map<String, List<String>>? errors;

  ApiError({
    required this.type,
    required this.title,
    required this.status,
    required this.detail,
    this.instance,
    this.errors,
  });

  factory ApiError.fromJson(Map<String, dynamic> json) {
    return ApiError(
      type: json['type'] as String? ?? 'about:blank',
      title: json['title'] as String? ?? 'Error',
      status: json['status'] as int? ?? 500,
      detail: json['detail'] as String? ?? 'An unexpected error occurred',
      instance: json['instance'] as String?,
      errors: json['errors'] != null
          ? (json['errors'] as Map<String, dynamic>).map(
              (key, value) => MapEntry(
                key,
                (value as List).map((e) => e.toString()).toList(),
              ),
            )
          : null,
    );
  }

  String get userMessage {
    if (errors != null && errors!.isNotEmpty) {
      return errors!.entries.first.value.first;
    }
    return detail;
  }
}

class PaginationMeta {
  final int page;
  final int limit;
  final int total;
  final int totalPages;

  PaginationMeta({
    required this.page,
    required this.limit,
    required this.total,
    required this.totalPages,
  });

  factory PaginationMeta.fromJson(Map<String, dynamic> json) {
    return PaginationMeta(
      page: json['page'] as int,
      limit: json['limit'] as int,
      total: json['total'] as int,
      totalPages: json['totalPages'] as int,
    );
  }
}
