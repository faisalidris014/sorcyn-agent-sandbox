import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { AuthService } from './auth.service.js';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './auth.schemas.js';

const authRoutes: FastifyPluginAsync = async (app) => {
  const authService = new AuthService(app);
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  // POST /register
  typedApp.post(
    '/register',
    {
      schema: {
        body: registerSchema,
        tags: ['Authentication'],
        description: 'Register a new user account',
      },
      config: { rateLimit: { max: 20, timeWindow: '1 hour' } },
    },
    async (request, reply) => {
      const result = await authService.register(request.body, request.ip);
      return reply.status(201).send({ success: true, data: result });
    },
  );

  // POST /login
  typedApp.post(
    '/login',
    {
      schema: {
        body: loginSchema,
        tags: ['Authentication'],
        description: 'Log in with email and password',
      },
      config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
    },
    async (request, reply) => {
      const result = await authService.login(
        request.body,
        request.ip,
        request.headers['user-agent'] ?? 'unknown',
      );
      return reply.send({ success: true, data: result });
    },
  );

  // POST /refresh
  typedApp.post(
    '/refresh',
    {
      schema: {
        body: refreshSchema,
        tags: ['Authentication'],
        description: 'Refresh access token using a refresh token',
      },
    },
    async (request, reply) => {
      const tokens = await authService.refresh(request.body);
      return reply.send({ success: true, data: tokens });
    },
  );

  // POST /logout (requires authentication)
  typedApp.post(
    '/logout',
    {
      schema: {
        body: refreshSchema,
        tags: ['Authentication'],
        description: 'Log out and invalidate tokens',
        security: [{ bearerAuth: [] }],
      },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const { refreshToken } = request.body;
      await authService.logout(
        request.user.sub,
        request.user.jti,
        refreshToken,
      );
      return reply.send({
        success: true,
        data: { message: 'Logged out successfully' },
      });
    },
  );

  // GET /verify-email?token=xxx
  typedApp.get(
    '/verify-email',
    {
      schema: {
        querystring: verifyEmailSchema,
        tags: ['Authentication'],
        description: 'Verify email address using token from email link',
      },
    },
    async (request, reply) => {
      const { token } = request.query;
      await authService.verifyEmail(token);
      return reply.send({
        success: true,
        data: { message: 'Email verified successfully' },
      });
    },
  );

  // POST /resend-verification
  typedApp.post(
    '/resend-verification',
    {
      schema: {
        body: resendVerificationSchema,
        tags: ['Authentication'],
        description: 'Resend email verification link',
      },
      config: { rateLimit: { max: 1, timeWindow: '5 minutes' } },
    },
    async (request, reply) => {
      const { email } = request.body;
      await authService.resendVerification(email);
      return reply.send({
        success: true,
        data: {
          message:
            'If an account exists with this email, a verification email has been sent',
        },
      });
    },
  );

  // POST /forgot-password
  typedApp.post(
    '/forgot-password',
    {
      schema: {
        body: forgotPasswordSchema,
        tags: ['Authentication'],
        description: 'Request a password reset link via email',
      },
      config: { rateLimit: { max: 3, timeWindow: '1 hour' } },
    },
    async (request, reply) => {
      const { email } = request.body;
      await authService.forgotPassword(email);
      return reply.send({
        success: true,
        data: {
          message:
            'If an account exists with this email, a password reset link has been sent',
        },
      });
    },
  );

  // POST /reset-password
  typedApp.post(
    '/reset-password',
    {
      schema: {
        body: resetPasswordSchema,
        tags: ['Authentication'],
        description: 'Reset password using token from email link',
      },
    },
    async (request, reply) => {
      await authService.resetPassword(request.body.token, request.body.newPassword);
      return reply.send({
        success: true,
        data: {
          message:
            'Password reset successfully. Please log in with your new password.',
        },
      });
    },
  );
};

export default authRoutes;
