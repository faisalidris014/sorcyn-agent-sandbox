import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { UsersService } from './users.service.js';
import {
  updateProfileSchema,
  changePasswordSchema,
  updateFcmTokenSchema,
  switchAccountTypeSchema,
  switchMarketplaceContextSchema,
  getUserByIdParamsSchema,
  upgradeToBusinessSchema,
  updateBusinessProfileSchema,
} from './users.schemas.js';
import { z } from 'zod';
import { t } from '../../common/i18n/index.js';

const photoUrlSchema = z.object({ photoUrl: z.string().url('Invalid photo URL') });
const deleteAccountSchema = z.object({ password: z.string().min(1, 'Password is required') });

const usersRoutes: FastifyPluginAsync = async (app) => {
  const usersService = new UsersService();
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  // GET /me — Get current user profile
  typedApp.get(
    '/me',
    {
      schema: { tags: ['Users'], description: 'Get current user profile', security: [{ bearerAuth: [] }] },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const profile = await usersService.getMe(request.user.sub, request.locale);
      return reply.send({ success: true, data: profile });
    },
  );

  // PATCH /me — Update current user profile
  typedApp.patch(
    '/me',
    {
      schema: { body: updateProfileSchema, tags: ['Users'], description: 'Update current user profile', security: [{ bearerAuth: [] }] },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const profile = await usersService.updateProfile(request.user.sub, request.body, request.locale);
      return reply.send({ success: true, data: profile });
    },
  );

  // PATCH /me/photo — Update profile photo URL
  typedApp.patch(
    '/me/photo',
    {
      schema: { body: photoUrlSchema, tags: ['Users'], description: 'Update profile photo URL', security: [{ bearerAuth: [] }] },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const profile = await usersService.updateProfilePhoto(
        request.user.sub,
        request.body.photoUrl,
        request.locale,
      );
      return reply.send({ success: true, data: profile });
    },
  );

  // POST /me/change-password — Change password
  typedApp.post(
    '/me/change-password',
    {
      schema: { body: changePasswordSchema, tags: ['Users'], description: 'Change password', security: [{ bearerAuth: [] }] },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      await usersService.changePassword(
        request.user.sub,
        request.body.currentPassword,
        request.body.newPassword,
        request.locale,
      );
      return reply.send({
        success: true,
        data: { message: t('success.passwordChanged', request.locale) },
      });
    },
  );

  // PATCH /me/account-type — Switch account type
  typedApp.patch(
    '/me/account-type',
    {
      schema: { body: switchAccountTypeSchema, tags: ['Users'], description: 'Switch account type', security: [{ bearerAuth: [] }] },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const profile = await usersService.switchAccountType(
        request.user.sub,
        request.body.accountType,
        request.locale,
      );
      return reply.send({ success: true, data: profile });
    },
  );

  // PUT /me/marketplace-context — Switch marketplace context
  typedApp.put(
    '/me/marketplace-context',
    {
      schema: { body: switchMarketplaceContextSchema, tags: ['Users'], description: 'Switch active marketplace context (B2C, B2B, C2C)', security: [{ bearerAuth: [] }] },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const profile = await usersService.switchMarketplaceContext(
        request.user.sub,
        request.body.context,
        request.locale,
      );
      return reply.send({ success: true, data: profile });
    },
  );

  // POST /me/upgrade-to-business — Upgrade classic account to business (v2.2)
  typedApp.post(
    '/me/upgrade-to-business',
    {
      schema: { body: upgradeToBusinessSchema, tags: ['Users'], description: 'Upgrade classic account to business — adds EIN, business name/type, sales-tax certificate', security: [{ bearerAuth: [] }] },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const profile = await usersService.upgradeToBusiness(
        request.user.sub,
        request.body,
        request.locale,
      );
      return reply.send({ success: true, data: profile });
    },
  );

  // PATCH /me/business-profile — Attach/update sales-tax cert for an account that is
  // already a business (issue #3 post-registration completion path)
  typedApp.patch(
    '/me/business-profile',
    {
      schema: { body: updateBusinessProfileSchema, tags: ['Users'], description: 'Attach or update the sales-tax certificate (and optionally name/type/EIN) for an existing business account — used to complete business registration after the upload endpoint becomes reachable (auth in hand)', security: [{ bearerAuth: [] }] },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const profile = await usersService.updateBusinessProfile(
        request.user.sub,
        request.body,
        request.locale,
      );
      return reply.send({ success: true, data: profile });
    },
  );

  // PUT /me/fcm-token — Update FCM push token
  typedApp.put(
    '/me/fcm-token',
    {
      schema: { body: updateFcmTokenSchema, tags: ['Users'], description: 'Update FCM push token', security: [{ bearerAuth: [] }] },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      await usersService.updateFcmToken(request.user.sub, request.body.fcmToken);
      return reply.send({
        success: true,
        data: { message: t('success.fcmUpdated', request.locale) },
      });
    },
  );

  // DELETE /me — Soft delete account (requires password confirmation)
  typedApp.delete(
    '/me',
    {
      schema: { body: deleteAccountSchema, tags: ['Users'], description: 'Delete account (requires password confirmation)', security: [{ bearerAuth: [] }] },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      await usersService.deleteAccount(request.user.sub, request.body.password, request.locale);
      return reply.send({
        success: true,
        data: { message: t('success.accountDeleted', request.locale) },
      });
    },
  );

  // GET /:userId — Get public user profile
  typedApp.get(
    '/:userId',
    {
      schema: { params: getUserByIdParamsSchema, tags: ['Users'], description: 'Get public user profile' },
    },
    async (request, reply) => {
      const profile = await usersService.getUserById(request.params.userId, request.locale);
      return reply.send({ success: true, data: profile });
    },
  );
};

export default usersRoutes;
