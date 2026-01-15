// Stable treatment schema for mobile apps
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
