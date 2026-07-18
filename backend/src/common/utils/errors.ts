import type { ApiError } from '../types/api.js';
import { t, type SupportedLocale } from '../i18n/index.js';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly type: string;
  public readonly errors?: Record<string, string[]>;

  constructor(statusCode: number, message: string, type?: string, errors?: Record<string, string[]>) {
    super(message);
    this.statusCode = statusCode;
    this.type = type ?? 'about:blank';
    this.errors = errors;
    this.name = 'AppError';
  }

  toResponse(): ApiError {
    return {
      type: this.type,
      title: this.name,
      status: this.statusCode,
      detail: this.message,
      errors: this.errors,
    };
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string, locale?: SupportedLocale) {
    const message = id
      ? t('errors.notFoundWithId', locale, { resource, id })
      : t('errors.notFound', locale, { resource });
    super(404, message);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message?: string, locale?: SupportedLocale) {
    super(401, message ?? t('errors.unauthorized', locale));
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message?: string, locale?: SupportedLocale) {
    super(403, message ?? t('errors.forbidden', locale));
    this.name = 'ForbiddenError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, errors?: Record<string, string[]>) {
    super(400, message, 'about:blank', errors);
    this.name = 'ValidationError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message);
    this.name = 'ConflictError';
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message: string, type?: string) {
    super(503, message, type);
    this.name = 'ServiceUnavailableError';
  }
}
