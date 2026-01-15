import { FastifyPluginAsync } from 'fastify';
import { prisma } from '../lib/prisma';
import { AccessTokenPayload } from '../types';

const meRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /v1/me
  fastify.get('/me', async (request, reply) => {
    const user = request.user as AccessTokenPayload | undefined;
    if (!user) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    try {
      const appUser = await prisma.appUser.findUnique({
        where: { id: user.sub },
        select: {
          id: true,
          email: true,
          name: true,
          displayName: true,
        },
      });

      if (!appUser) {
        return reply.code(404).send({ error: 'User not found' });
      }

      return reply.code(200).send({
        id: appUser.id,
        email: appUser.email,
        name: appUser.name || undefined,
        displayName: appUser.displayName || undefined,
      });
    } catch (error: unknown) {
      fastify.log.error({ err: error }, 'Error fetching user profile');
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return reply.code(500).send({ 
        error: 'Failed to fetch user profile',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      });
    }
  });
};

export default meRoutes;
