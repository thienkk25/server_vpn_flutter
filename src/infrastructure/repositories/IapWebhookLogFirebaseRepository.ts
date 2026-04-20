import { db } from '../config/firebase';

export class IapWebhookLogFirebaseRepository {
  private get collection() {
    if (!db) throw new Error("Firebase DB not initialized");
    return db.collection('iap_webhooks');
  }

  async logWebhook(notificationId: string, payload: any): Promise<void> {
    try {
      const logRef = this.collection.doc(notificationId);
      await logRef.set({
        ...payload,
        createdAt: Date.now(),
      });
    } catch (error) {
      console.error('[IapWebhookLogFirebaseRepository] Failed to log webhook:', error);
    }
  }

  async checkExists(notificationId: string): Promise<boolean> {
    try {
      const doc = await this.collection.doc(notificationId).get();
      return doc.exists;
    } catch (error) {
      return false;
    }
  }

  async getLogs(limit: number = 50, lastDocId?: string): Promise<any[]> {
    try {
      let query = this.collection.orderBy('createdAt', 'desc').limit(limit);

      if (lastDocId) {
        const lastDoc = await this.collection.doc(lastDocId).get();
        if (lastDoc.exists) {
          query = query.startAfter(lastDoc);
        }
      }

      const snapshot = await query.get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('[IapWebhookLogFirebaseRepository] Failed to get logs:', error);
      throw error;
    }
  }
}
