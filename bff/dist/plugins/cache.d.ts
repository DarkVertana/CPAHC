import { FastifyPluginAsync } from 'fastify';
interface CachePluginOptions {
    redisUrl?: string;
}
declare module 'fastify' {
    interface FastifyInstance {
        cache: {
            get<T>(key: string): Promise<T | null>;
            set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
            invalidate(key: string): Promise<void>;
            invalidatePattern(pattern: string): Promise<void>;
            clear(): Promise<void>;
        };
    }
}
declare const _default: FastifyPluginAsync<CachePluginOptions>;
export default _default;
//# sourceMappingURL=cache.d.ts.map