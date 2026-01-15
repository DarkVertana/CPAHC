import fp from 'fastify-plugin';
// Fields to NEVER log in full
const SENSITIVE_FIELDS = [
    'password',
    'accessToken',
    'refreshToken',
    'token',
    'address_1',
    'address_2',
    'postcode',
    'postalcode',
    'phone',
    'billing',
    'shipping',
    'meta_data',
    'metaData',
];
// Mask sensitive values
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function maskSensitiveData(obj, depth = 0) {
    if (depth > 5)
        return '[Max Depth]'; // Prevent infinite recursion
    if (obj === null || obj === undefined) {
        return obj;
    }
    if (typeof obj === 'string') {
        return '[String]';
    }
    if (typeof obj !== 'object') {
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(item => maskSensitiveData(item, depth + 1));
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const masked = {};
    for (const [key, value] of Object.entries(obj)) {
        const keyLower = key.toLowerCase();
        // Check if this key should be masked
        if (SENSITIVE_FIELDS.some(field => keyLower.includes(field.toLowerCase()))) {
            masked[key] = '[MASKED]';
        }
        else if (typeof value === 'object' && value !== null) {
            masked[key] = maskSensitiveData(value, depth + 1);
        }
        else {
            masked[key] = value;
        }
    }
    return masked;
}
// In-memory log store (can be moved to DB later)
const requestLogs = [];
const MAX_LOGS = 200;
const loggerPlugin = async (fastify) => {
    fastify.addHook('onRequest', async (request, _reply) => {
        // Store start time
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        request.startTime = Date.now();
    });
    fastify.addHook('onResponse', async (request, reply) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const startTime = request.startTime || Date.now();
        const responseTime = Date.now() - startTime;
        // Skip logging for health checks
        if (request.url === '/health') {
            return;
        }
        // Get user ID if authenticated
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const userId = request.user?.sub;
        // Mask request body
        let requestBody = undefined;
        if (request.body) {
            try {
                requestBody = maskSensitiveData(JSON.parse(JSON.stringify(request.body)));
            }
            catch {
                requestBody = '[Unable to parse]';
            }
        }
        // Mask response body (we'll need to capture it)
        let responseBody = undefined;
        const originalSend = reply.send.bind(reply);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        reply.send = function (payload) {
            try {
                responseBody = maskSensitiveData(JSON.parse(JSON.stringify(payload)));
            }
            catch {
                responseBody = '[Unable to parse]';
            }
            return originalSend(payload);
        };
        const log = {
            id: `req_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            timestamp: new Date().toISOString(),
            method: request.method,
            path: request.url,
            userId,
            statusCode: reply.statusCode,
            responseTime,
            requestBody,
            responseBody,
        };
        // Add to in-memory store
        requestLogs.push(log);
        // Keep only last MAX_LOGS
        if (requestLogs.length > MAX_LOGS) {
            requestLogs.shift();
        }
        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
            fastify.log.info({
                method: log.method,
                path: log.path,
                statusCode: log.statusCode,
                responseTime: `${log.responseTime}ms`,
                userId: log.userId,
            });
        }
    });
    // Decorate with method to get logs
    fastify.decorate('getRequestLogs', (limit = 200) => {
        return requestLogs.slice(-limit).reverse();
    });
    fastify.decorate('getRequestLog', (id) => {
        return requestLogs.find(log => log.id === id);
    });
};
export default fp(loggerPlugin, {
    name: 'logger',
});
//# sourceMappingURL=logger.js.map