import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { OffersService } from './offers.service.js';
import {
  createOfferSchema,
  updateOfferSchema,
  counterOfferSchema,
  offerIdParamsSchema,
  postIdParamsSchema,
  listMyOffersQuerySchema,
  listPostOffersQuerySchema,
} from './offers.schemas.js';

const offersRoutes: FastifyPluginAsync = async (app) => {
  const offersService = new OffersService();
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  // POST / — Submit offer (seller, auth required)
  typedApp.post(
    '/',
    {
      schema: { body: createOfferSchema, tags: ['Offers'], description: 'Submit an offer', security: [{ bearerAuth: [] }] },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const offer = await offersService.submitOffer(request.user.sub, request.body);
      return reply.status(201).send({ success: true, data: offer });
    },
  );

  // GET /my-offers — Seller's own offers (auth required)
  typedApp.get(
    '/my-offers',
    {
      schema: { querystring: listMyOffersQuerySchema, tags: ['Offers'], description: 'List my offers', security: [{ bearerAuth: [] }] },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const result = await offersService.getMyOffers(request.user.sub, request.query);
      return reply.send({ success: true, data: result.offers, meta: result.meta });
    },
  );

  // GET /post/:postId — All offers on a post (buyer only, auth required)
  typedApp.get(
    '/post/:postId',
    {
      schema: { params: postIdParamsSchema, querystring: listPostOffersQuerySchema, tags: ['Offers'], description: 'List offers on a post', security: [{ bearerAuth: [] }] },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const result = await offersService.getPostOffers(request.user.sub, request.params.postId, request.query);
      return reply.send({ success: true, data: result.offers, meta: result.meta });
    },
  );

  // GET /:offerId — Offer detail (seller owner or post buyer, auth required)
  typedApp.get(
    '/:offerId',
    {
      schema: { params: offerIdParamsSchema, tags: ['Offers'], description: 'Get offer details', security: [{ bearerAuth: [] }] },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const offer = await offersService.getOfferById(request.user.sub, request.params.offerId);
      return reply.send({ success: true, data: offer });
    },
  );

  // PUT /:offerId — Edit offer (seller, pending only, auth required)
  typedApp.put(
    '/:offerId',
    {
      schema: { params: offerIdParamsSchema, body: updateOfferSchema, tags: ['Offers'], description: 'Update offer', security: [{ bearerAuth: [] }] },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const offer = await offersService.updateOffer(request.user.sub, request.params.offerId, request.body);
      return reply.send({ success: true, data: offer });
    },
  );

  // DELETE /:offerId — Withdraw offer (seller, auth required)
  typedApp.delete(
    '/:offerId',
    {
      schema: { params: offerIdParamsSchema, tags: ['Offers'], description: 'Withdraw offer', security: [{ bearerAuth: [] }] },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      await offersService.withdrawOffer(request.user.sub, request.params.offerId);
      return reply.status(204).send();
    },
  );

  // POST /:offerId/accept — Accept offer (buyer, auth required)
  typedApp.post(
    '/:offerId/accept',
    {
      schema: { params: offerIdParamsSchema, tags: ['Offers'], description: 'Accept offer', security: [{ bearerAuth: [] }] },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const result = await offersService.acceptOffer(request.user.sub, request.params.offerId);
      return reply.status(201).send({ success: true, data: result });
    },
  );

  // POST /:offerId/decline — Decline offer (buyer, auth required)
  typedApp.post(
    '/:offerId/decline',
    {
      schema: { params: offerIdParamsSchema, tags: ['Offers'], description: 'Decline an offer without accepting another', security: [{ bearerAuth: [] }] },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      await offersService.declineOffer(request.user.sub, request.params.offerId);
      return reply.status(204).send();
    },
  );

  // POST /:offerId/counter — Counter an offer (buyer, auth required)
  typedApp.post(
    '/:offerId/counter',
    {
      schema: { params: offerIdParamsSchema, body: counterOfferSchema, tags: ['Offers'], description: 'Counter an offer with new terms', security: [{ bearerAuth: [] }] },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const result = await offersService.counterOffer(request.user.sub, request.params.offerId, request.body);
      return reply.status(201).send({ success: true, data: result });
    },
  );

  // POST /:offerId/reconfirm — Reconfirm offer after post edit (seller, auth required)
  typedApp.post(
    '/:offerId/reconfirm',
    {
      schema: { params: offerIdParamsSchema, tags: ['Offers'], description: 'Reconfirm offer after post was edited', security: [{ bearerAuth: [] }] },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const result = await offersService.reconfirmOffer(request.user.sub, request.params.offerId);
      return reply.send({ success: true, data: result });
    },
  );
};

export default offersRoutes;
