import jwt from '@fastify/jwt';
import fp from 'fastify-plugin';
const authPlugin = async (fastify, options) => {
    const { jwtSecret } = options;
    // Register JWT plugin
    await fastify.register(jwt, {
        secret: jwtSecret,
    });
    // Add hook to verify JWT on protected routes
    fastify.addHook('onRequest', async (request, reply) => {
        // Skip auth for public routes
        const publicRoutes = ['/health', '/v1/auth/login', '/v1/auth/refresh'];
        if (publicRoutes.some(route => request.url.startsWith(route))) {
            return;
        }
        // Check for Authorization header
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return reply.code(401).send({ error: 'Unauthorized. Missing or invalid token.' });
        }
        const token = authHeader.substring(7);
        try {
            // Verify the token manually since jwtVerify expects token in header
            const decoded = await fastify.jwt.verify(token);
            // Store in request.user (Fastify JWT plugin provides this)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            request.user = decoded;
        }
        catch {
            return reply.code(401).send({ error: 'Unauthorized. Invalid or expired token.' });
        }
    });
};
export default fp(authPlugin, {
    name: 'auth',
});
export function generateAccessToken(fastify, payload) {
    return fastify.jwt.sign(payload, {
        expiresIn: process.env.BFF_JWT_ACCESS_EXPIRES || '15m',
    });
}
//# sourceMappingURL=auth.js.map