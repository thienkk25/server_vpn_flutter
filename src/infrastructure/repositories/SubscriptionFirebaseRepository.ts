import { ISubscriptionRepository } from '../../domain/repositories/ISubscriptionRepository';
import { UserSubscriptionEntity } from '../../domain/entities/UserSubscriptionEntity';
import { db } from '../config/firebase';

export class SubscriptionFirebaseRepository implements ISubscriptionRepository {
  private get subscriptions() {
    if (!db) return null;
    return db.collection('subscriptions');
  }

  private get users() {
    if (!db) return null;
    return db.collection('users');
  }

  async getSubscriptionByUserId(userId: string): Promise<UserSubscriptionEntity | null> {
    if (!this.users || !this.subscriptions) throw new Error("Firebase DB not initialized");
    
    // According to new schema, users/{userId} has subscriptionId
    const userDoc = await this.users.doc(userId).get();
    if (!userDoc.exists) return null;
    
    const userData = userDoc.data();
    if (!userData?.subscriptionId) return null;

    const subDoc = await this.subscriptions.doc(userData.subscriptionId).get();
    if (!subDoc.exists) return null;

    return subDoc.data() as UserSubscriptionEntity;
  }

  async getSubscriptionByTransactionId(transactionId: string): Promise<UserSubscriptionEntity | null> {
    if (!this.subscriptions) throw new Error("Firebase DB not initialized");
    const subDoc = await this.subscriptions.doc(transactionId).get();
    if (!subDoc.exists) return null;
    return subDoc.data() as UserSubscriptionEntity;
  }

  async saveSubscription(subscription: UserSubscriptionEntity): Promise<void> {
    if (!this.subscriptions || !this.users || !db) throw new Error("Firebase DB not initialized");
    
    const batch = db.batch();
    
    if (subscription.originalTransactionId) {
      // Save subscription document
      const subRef = this.subscriptions.doc(subscription.originalTransactionId);
      batch.set(subRef, { ...subscription, updatedAt: Date.now() }, { merge: true });

      // Update user document
      const userRef = this.users.doc(subscription.userId);
      batch.set(userRef, {
        isPremium: subscription.isActive,
        subscriptionId: subscription.originalTransactionId,
        activeProductId: subscription.productId, // Added so flutter can read which plan is active
        platform: 'ios'
      }, { merge: true });
    }

    await batch.commit();
  }

  async revokeSubscriptionsOlderThan(timestamp: number): Promise<void> {
    if (!this.subscriptions || !this.users || !db) throw new Error("Firebase DB not initialized");
    const snapshot = await this.subscriptions
      .where('isActive', '==', true)
      .where('expiresAt', '<=', timestamp)
      .get();

    if (snapshot.empty) return;

    const batch = db.batch();
    for (const doc of snapshot.docs) {
      batch.update(doc.ref, { isActive: false, updatedAt: Date.now() });
      const userId = doc.data().userId;
      if (userId) {
        const userRef = this.users.doc(userId);
        batch.update(userRef, { isPremium: false, activeProductId: null });
      }
    }

  }
}
