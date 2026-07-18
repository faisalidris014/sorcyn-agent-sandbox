import { buildApp } from './app.js';
import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { redis } from './config/redis.js';
import { startWorkers, registerScheduledJobs, closeWorkers } from './config/bullmq.js';
import { initSocketIO, getIO } from './config/socket.js';
import { registerMessagesGateway } from './modules/messages/messages.gateway.js';
import { initSentry } from './config/sentry.js';
import type { Server as SocketIOServer } from 'socket.io';

const SHUTDOWN_TIMEOUT_MS = 15_000;

async function start() {
  // Initialize Sentry before anything else for maximum coverage
  initSentry();

  const app = await buildApp();
  let io: SocketIOServer | null = null;

  try {
    await connectDatabase();
    app.log.info('Database connected');

    await redis.connect();
    app.log.info('Redis connected');

    await app.listen({ port: env.PORT, host: env.HOST });
    app.log.info(`Server running at http://${env.HOST}:${env.PORT}`);
    app.log.info(`API docs at http://${env.HOST}:${env.PORT}/docs`);

    // Initialize Socket.IO on the underlying HTTP server
    io = initSocketIO(app.server);
    registerMessagesGateway(io);
    app.log.info('Socket.IO initialized');

    startWorkers();
    await registerScheduledJobs();
    app.log.info('BullMQ workers and scheduled jobs started');
  } catch (err) {
    app.log.error(err);
    await disconnectDatabase();
    redis.disconnect();
    process.exit(1);
  }

  // Graceful shutdown
  let shuttingDown = false;
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
  for (const signal of signals) {
    process.on(signal, async () => {
      if (shuttingDown) return; // prevent double-shutdown
      shuttingDown = true;
      app.log.info(`Received ${signal}, shutting down gracefully...`);

      // Force exit if graceful shutdown takes too long
      const forceTimer = setTimeout(() => {
        console.error(`Graceful shutdown timed out after ${SHUTDOWN_TIMEOUT_MS}ms, forcing exit`);
        process.exit(1);
      }, SHUTDOWN_TIMEOUT_MS);
      forceTimer.unref();

      try {
        const socketIO = io ?? getIO();
        if (socketIO) socketIO.close();
      } catch { /* socket may not be initialized */ }

      try { await closeWorkers(); } catch (err) {
        app.log.error({ err }, 'Error closing BullMQ workers');
      }

      try { await app.close(); } catch (err) {
        app.log.error({ err }, 'Error closing Fastify');
      }

      try { await disconnectDatabase(); } catch (err) {
        app.log.error({ err }, 'Error disconnecting database');
      }

      try { redis.disconnect(); } catch (err) {
        app.log.error({ err }, 'Error disconnecting Redis');
      }

      app.log.info('Shutdown complete');
      process.exit(0);
    });
  }
}

start();
