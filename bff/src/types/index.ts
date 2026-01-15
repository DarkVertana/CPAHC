// Type definitions for the BFF API

export interface AccessTokenPayload {
  sub: string; // AppUser.id
  email: string;
  wooCustomerId: number;
  iat: number;
  exp: number;
}

export interface UserSummary {
  id: string;
  email: string;
  name?: string;
  displayName?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: UserSummary;
}

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
