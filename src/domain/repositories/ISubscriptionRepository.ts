import { UserSubscriptionEntity } from '../entities/UserSubscriptionEntity';

export interface ISubscriptionRepository {
  getSubscriptionByUserId(userId: string): Promise<UserSubscriptionEntity | null>;
  saveSubscription(subscription: UserSubscriptionEntity): Promise<void>;
  revokeSubscriptionsOlderThan(timestamp: number): Promise<void>;
}
