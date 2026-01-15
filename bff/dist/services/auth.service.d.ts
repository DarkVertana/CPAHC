interface WordPressUser {
    id: number;
    email: string;
    name?: string;
    displayName?: string;
}
/**
 * Validate user credentials against WordPress using JWT Auth plugin
 * Calls WordPress JWT endpoint to authenticate and get user data
 */
export declare function validateWordPressCredentials(usernameOrEmail: string, password: string, wpBaseUrl: string): Promise<WordPressUser | null>;
/**
 * Get or create WooCommerce customer ID for a user
 */
export declare function getWooCommerceCustomerId(email: string, wooClient: {
    get: (endpoint: string, params?: Record<string, string | number>) => Promise<any>;
}): Promise<number | null>;
/**
 * Upsert AppUser from WordPress user data
 */
export declare function upsertAppUser(wpUserId: string, email: string, name?: string, displayName?: string, _wooCustomerId?: number): Promise<{
    age: number | null;
    name: string | null;
    email: string;
    phone: string | null;
    id: string;
    displayName: string | null;
    wpUserId: string;
    height: string | null;
    feet: string | null;
    weight: string | null;
    goal: string | null;
    initialWeight: string | null;
    weightSet: boolean;
    tasksToday: number;
    totalWorkouts: number;
    totalCalories: number;
    streak: number;
    taskStatus: import(".prisma/client/runtime/library").JsonValue | null;
    status: string;
    lastLoginAt: Date | null;
    lastLoginIp: string | null;
    loginCount: number;
    fcmToken: string | null;
    createdAt: Date;
    updatedAt: Date;
}>;
export {};
//# sourceMappingURL=auth.service.d.ts.map