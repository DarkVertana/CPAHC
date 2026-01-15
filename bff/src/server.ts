import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import plugins
import woocommercePlugin from './plugins/woocommerce.js';
import authPlugin from './plugins/auth.js';
import cachePlugin from './plugins/cache.js';
import loggerPlugin from './plugins/logger.js';

// Import routes
import authRoutes from './routes/auth.js';
import meRoutes from './routes/me.js';
import addressesRoutes from './routes/addresses.js';
import ordersRoutes from './routes/orders.js';
import subscriptionsRoutes from './routes/subscriptions.js';
import planRoutes from './routes/plan.js';
import treatmentsRoutes from './routes/treatments.js';
import webhooksRoutes from './routes/webhooks.js';
import adminRoutes from './routes/admin.js';

const PORT = parseInt(process.env.BFF_PORT || '3001', 10);
const HOST = process.env.BFF_HOST || '127.0.0.1';

const fastify = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  },
});

// Register plugins and routes
async function buildServer() {
  // Security headers
  await fastify.register(helmet, {
    contentSecurityPolicy: false, // Allow API responses
  });

  // CORS
  await fastify.register(cors, {
    origin: true, // Allow all origins for mobile apps
    credentials: true,
  });

  // Logger (register early to capture all requests)
  await fastify.register(loggerPlugin);

  // Cache plugin
  await fastify.register(cachePlugin, {
    redisUrl: process.env.REDIS_URL,
  });

  // WooCommerce plugin
  await fastify.register(woocommercePlugin, {
    baseUrl: process.env.WP_BASE_URL || '',
    consumerKey: process.env.WC_CONSUMER_KEY || '',
    consumerSecret: process.env.WC_CONSUMER_SECRET || '',
  });

  // Auth plugin (JWT)
  await fastify.register(authPlugin, {
    jwtSecret: process.env.BFF_JWT_SECRET || 'change-me-in-production',
    accessTokenExpiresIn: process.env.BFF_JWT_ACCESS_EXPIRES || '15m',
  });

  // Health check route (before auth to allow unauthenticated access)
  fastify.get('/health', async (_request, _reply) => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'fastify-bff',
    };
  });

  // Register routes
  await fastify.register(authRoutes, { prefix: '/v1/auth' });
  await fastify.register(meRoutes, { prefix: '/v1/me' });
  await fastify.register(addressesRoutes, { prefix: '/v1/me' });
  await fastify.register(ordersRoutes, { prefix: '/v1/me' });
  await fastify.register(subscriptionsRoutes, { prefix: '/v1/me' });
  await fastify.register(planRoutes, { prefix: '/v1/me' });
  await fastify.register(treatmentsRoutes, { prefix: '/v1/me' });
  await fastify.register(webhooksRoutes, { prefix: '/v1/webhooks' });
  await fastify.register(adminRoutes, { prefix: '/v1/admin' });

  return fastify;
}

// Start server
buildServer()
  .then((server) => {
    server.listen({ port: PORT, host: HOST }, (err, address) => {
      if (err) {
        server.log.error(err);
        process.exit(1);
      }
      server.log.info(`Fastify BFF server listening on ${address}`);
    });
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Error starting server:', err);
    process.exit(1);
  });
