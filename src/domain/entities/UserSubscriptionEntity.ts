export interface UserSubscriptionEntity {
  userId: string;
  productId: string;
  originalTransactionId: string;
  expiresAt: number;
  isActive: boolean;
  autoRenewStatus?: boolean;
  isInBillingRetry?: boolean;
  environment?: string;
  createdAt?: number;
  updatedAt?: number;
}
