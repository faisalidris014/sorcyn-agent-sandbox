import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { AppError } from '../utils/errors.js';
import { ZodError } from 'zod';
import { env } from '../../config/env.js';
import { captureException } from '../../config/sentry.js';

export function errorHandler(
  error: FastifyError | Error,
  request: FastifyRequest,
  reply: FastifyReply,
): void {
  // App-level errors
  if (error instanceof AppError) {
    reply.status(error.statusCode).send({
      success: false,
      error: {
        ...error.toResponse(),
        ...(request.requestId && { requestId: request.requestId }),
      },
    });
    return;
  }

  // Zod validation errors (from manual .parse() or type provider)
  if (error instanceof ZodError) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of error.issues) {
      const path = issue.path.join('.');
      if (!fieldErrors[path]) fieldErrors[path] = [];
      fieldErrors[path].push(issue.message);
    }
    reply.status(400).send({
      success: false,
      error: {
        type: 'about:blank',
        title: 'ValidationError',
        status: 400,
        detail: 'Request validation failed',
        errors: fieldErrors,
      },
    });
    return;
  }

  // Fastify validation errors (from type provider schema validation)
  if ('validation' in error && Array.isArray((error as any).validation)) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of (error as any).validation) {
      const path = issue.instancePath?.replace(/^\//, '').replace(/\//g, '.') || '';
      if (!fieldErrors[path]) fieldErrors[path] = [];
      fieldErrors[path].push(issue.message || 'Invalid value');
    }
    reply.status(400).send({
      success: false,
      error: {
        type: 'about:blank',
        title: 'ValidationError',
        status: 400,
        detail: 'Request validation failed',
        errors: fieldErrors,
      },
    });
    return;
  }

  // Fastify built-in errors (rate limit, etc.)
  if ('statusCode' in error && typeof error.statusCode === 'number') {
    reply.status(error.statusCode).send({
      success: false,
      error: {
        type: 'about:blank',
        title: error.name || 'Error',
        status: error.statusCode,
        detail: error.message,
      },
    });
    return;
  }

  // Unknown errors — report to Sentry
  captureException(error, {
    requestId: request.requestId,
    method: request.method,
    url: request.url,
    userId: (request as any).user?.sub,
  });

  request.log.error({
    err: error,
    requestId: request.requestId,
    method: request.method,
    url: request.url,
  }, 'Unhandled error');

  const detail =
    env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : error instanceof Error
        ? error.message
        : String(error);
  reply.status(500).send({
    success: false,
    error: {
      type: 'about:blank',
      title: 'InternalServerError',
      status: 500,
      detail,
      ...(request.requestId && { requestId: request.requestId }),
    },
  });
}
