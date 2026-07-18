import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'node:crypto';

declare module 'fastify' {
  interface FastifyRequest {
    requestId: string;
  }
}

// Widened generics — see authenticate.ts for the rationale.
export function registerRequestId(app: FastifyInstance<any, any, any, any, any>): void {
  app.decorateRequest('requestId', '');

  app.addHook('onRequest', async (request, reply) => {
    const requestId = (request.headers['x-request-id'] as string) || randomUUID();
    request.requestId = requestId;
    reply.header('x-request-id', requestId);
  });
}
