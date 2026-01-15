import { FastifyPluginAsync } from 'fastify';
import { getOrderTreatment, getOrdersWithTreatments } from '../services/treatments.service.js';
import { AccessTokenPayload } from '../types/index.js';

const treatmentsRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /v1/me/treatments
  fastify.get<{
    Querystring: {
      page?: string;
      per_page?: string;
    };
  }>('/treatments', async (request, reply) => {
    const user = request.user as AccessTokenPayload | undefined;
    if (!user) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const page = parseInt(request.query.page || '1', 10);
    const perPage = Math.min(parseInt(request.query.per_page || '20', 10), 100);

    try {
      const result = await getOrdersWithTreatments(
        fastify,
        user.wooCustomerId,
        page,
        perPage
      );

      return reply.code(200).send({
        treatments: result.orders,
        pagination: {
          page,
          per_page: perPage,
          total: result.total,
          pages: result.pages,
        },
      });
    } catch (error: unknown) {
      fastify.log.error({ err: error }, 'Error fetching treatments');
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return reply.code(500).send({ 
        error: 'Failed to fetch treatments',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      });
    }
  });

  // GET /v1/me/treatments/:orderId
  fastify.get<{
    Params: {
      orderId: string;
    };
  }>('/treatments/:orderId', async (request, reply) => {
    const user = request.user as AccessTokenPayload | undefined;
    if (!user) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const orderId = parseInt(request.params.orderId, 10);
    if (isNaN(orderId)) {
      return reply.code(400).send({ error: 'Invalid order ID' });
    }

    try {
      const treatment = await getOrderTreatment(fastify, orderId);

      if (!treatment) {
        return reply.code(404).send({ error: 'Treatment not found for this order' });
      }

      return reply.code(200).send(treatment);
    } catch (error: unknown) {
      fastify.log.error({ err: error }, 'Error fetching treatment');
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return reply.code(500).send({ 
        error: 'Failed to fetch treatment',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      });
    }
  });
};

export default treatmentsRoutes;
