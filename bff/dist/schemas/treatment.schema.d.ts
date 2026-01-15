export interface Treatment {
    orderId: number;
    orderDate: string;
    medications: Array<{
        name: string;
        dosage: string;
        frequency: string;
        instructions?: string;
    }>;
    nextRefillDate?: string;
    notes?: string;
}
//# sourceMappingURL=treatment.schema.d.ts.map