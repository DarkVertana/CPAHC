const adminRoutes = async (fastify) => {
    // GET /v1/admin/requests
    fastify.get('/requests', async (request, reply) => {
        // In production, add admin authentication here
        const limit = parseInt(request.query.limit || '200', 10);
        const logs = fastify.getRequestLogs(limit);
        return reply.code(200).send({
            logs,
            count: logs.length,
        });
    });
    // GET /v1/admin/requests/:requestId
    fastify.get('/requests/:requestId', async (request, reply) => {
        // In production, add admin authentication here
        const log = fastify.getRequestLog(request.params.requestId);
        if (!log) {
            return reply.code(404).send({ error: 'Request log not found' });
        }
        return reply.code(200).send(log);
    });
};
export default adminRoutes;
//# sourceMappingURL=admin.js.map