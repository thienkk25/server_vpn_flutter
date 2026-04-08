import { ISubscriptionRepository } from '../../domain/repositories/ISubscriptionRepository';
import { UserSubscriptionEntity } from '../../domain/entities/UserSubscriptionEntity';
import { db } from '../config/firebase';

export class SubscriptionFirebaseRepository implements ISubscriptionRepository {
  private get collection() {
    if (!db) return null;
    return db.collection('subscriptions');
  }

  async getSubscriptionByUserId(userId: string): Promise<UserSubscriptionEntity | null> {
    if (!this.collection) throw new Error("Firebase DB not initialized");
    const doc = await this.collection.doc(userId).get();
    if (!doc.exists) {
      return null;
    }
    return doc.data() as UserSubscriptionEntity;
  }

  async saveSubscription(subscription: UserSubscriptionEntity): Promise<void> {
    if (!this.collection || !db) throw new Error("Firebase DB not initialized");
    
    const batch = db.batch();

    // If the subscription is premium and tied to an Apple ID, automatically revoke 
    // it from any other user who used this exact same transaction ID before.
    if (subscription.originalTransactionId && subscription.isPremium) {
      const existingDocs = await this.collection
        .where('originalTransactionId', '==', subscription.originalTransactionId)
        .where('isPremium', '==', true)
        .get();

      existingDocs.forEach((doc) => {
        if (doc.id !== subscription.userId) {
          batch.update(doc.ref, { 
            isPremium: false,
            revokedAt: Date.now(),
            revokedReason: 'transferred_to_another_account' 
          });
        }
      });
    }

    // Save/update the subscription for the current user
    const userRef = this.collection.doc(subscription.userId);
    batch.set(userRef, subscription, { merge: true });

    await batch.commit();
  }

  async revokeSubscriptionsOlderThan(timestamp: number): Promise<void> {
    if (!this.collection || !db) throw new Error("Firebase DB not initialized");
    const snapshot = await this.collection
      .where('isPremium', '==', true)
      .where('expiredAt', '<=', timestamp)
      .get();

    if (snapshot.empty) {
      return;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { isPremium: false });
    });

    await batch.commit();
  }
}
