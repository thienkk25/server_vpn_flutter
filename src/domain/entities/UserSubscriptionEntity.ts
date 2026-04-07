export interface UserSubscriptionEntity {
  userId: string;
  isPremium: boolean;
  expiredAt: number; // Timestamp in milliseconds
  productId: string;
  originalTransactionId?: string;
}
