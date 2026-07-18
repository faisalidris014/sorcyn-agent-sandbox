import type { FastifyInstance, FastifyRequest } from 'fastify';
import { parseAcceptLanguage, type SupportedLocale } from '../i18n/index.js';

// Extend Fastify request with locale
declare module 'fastify' {
  interface FastifyRequest {
    locale: SupportedLocale;
    marketplaceContext: 'b2c' | 'b2b' | 'c2c';
  }
}

/**
 * Fastify plugin that extracts locale and marketplace context from requests.
 *
 * Locale resolution order:
 *   1. Accept-Language header
 *   2. Default: 'en'
 *
 * Marketplace context resolution order:
 *   1. X-Marketplace-Context header
 *   2. Default: 'b2c'
 */
// Widened generics — see authenticate.ts for the rationale.
export function registerRequestContext(app: FastifyInstance<any, any, any, any, any>): void {
  app.decorateRequest('locale', 'en');
  app.decorateRequest('marketplaceContext', 'b2c');

  app.addHook('onRequest', async (request: FastifyRequest) => {
    // Resolve locale from Accept-Language header
    const acceptLang = request.headers['accept-language'];
    request.locale = parseAcceptLanguage(acceptLang);

    // Resolve marketplace context from header
    const ctxHeader = request.headers['x-marketplace-context'] as string | undefined;
    if (ctxHeader && ['b2c', 'b2b', 'c2c'].includes(ctxHeader.toLowerCase())) {
      request.marketplaceContext = ctxHeader.toLowerCase() as 'b2c' | 'b2b' | 'c2c';
    }
  });
}
