export type SubscriptionTier = 'Free' | 'Pro' | 'Team';
export type SubscriptionStatus = 'Active' | 'Cancelled' | 'Expired' | 'PastDue';
export type PaymentStatus = 'Pending' | 'Success' | 'Failed' | 'Refunded';

export interface PlanDto {
  tier: SubscriptionTier;
  name: string;
  description: string | null;
  priceMonthly: number;
  currency: string;
  features: string[];
}

export interface SubscriptionStatusDto {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  expiresAt: string | null;
  isActive: boolean;
  canCancel: boolean;
}

export interface CreateCheckoutRequest {
  tier: SubscriptionTier;
}

export interface CheckoutResponse {
  preapprovalId: string;
  initPoint: string;
}

export interface PaymentHistoryItemDto {
  amount: number;
  currency: string;
  status: PaymentStatus;
  description: string | null;
  createdAt: string;
}
