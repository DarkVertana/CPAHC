import { FastifyPluginAsync } from 'fastify';
interface RequestLog {
    id: string;
    timestamp: string;
    method: string;
    path: string;
    userId?: string;
    statusCode: number;
    responseTime: number;
    requestBody?: any;
    responseBody?: any;
}
declare module 'fastify' {
    interface FastifyInstance {
        getRequestLogs: (limit?: number) => RequestLog[];
        getRequestLog: (id: string) => RequestLog | undefined;
    }
}
declare const _default: FastifyPluginAsync;
export default _default;
//# sourceMappingURL=logger.d.ts.map