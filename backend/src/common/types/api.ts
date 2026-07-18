// Standard API response envelope
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: PaginationMeta;
}

// RFC 7807 Problem Details
export interface ApiError {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  errors?: Record<string, string[]>;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}
