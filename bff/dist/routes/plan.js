import { getActivePlan } from '../services/plan.service.js';
const planRoutes = async (fastify) => {
    // GET /v1/me/plan
    fastify.get('/plan', async (request, reply) => {
        const user = request.user;
        if (!user) {
            return reply.code(401).send({ error: 'Unauthorized' });
        }
        try {
            const plan = await getActivePlan(fastify, user.wooCustomerId);
            return reply.code(200).send({
                plan,
                count: plan.length,
            });
        }
        catch (error) {
            fastify.log.error({ err: error }, 'Error fetching plan');
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return reply.code(500).send({
                error: 'Failed to fetch plan',
                details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
            });
        }
    });
};
export default planRoutes;
//# sourceMappingURL=plan.js.map