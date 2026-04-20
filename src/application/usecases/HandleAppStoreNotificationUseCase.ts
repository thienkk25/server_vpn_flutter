import { db } from '../../infrastructure/config/firebase';
import { IapWebhookLogFirebaseRepository } from '../../infrastructure/repositories/IapWebhookLogFirebaseRepository';

const VALID_PRODUCT_IDS = [
  'premium_weekly_tt',
  'premium_monthly_tt',
  'premium_yearly_tt',
  'premium_lifetime_test'
];

export class HandleAppStoreNotificationUseCase {
  private logRepository = new IapWebhookLogFirebaseRepository();

  async execute(decodedPayload: any): Promise<void> {
    const notificationId = decodedPayload.notificationUUID;
    if (!notificationId) {
      throw new Error('Missing notificationUUID from decoded payload');
    }

    // 1. Idempotency Check
    const exists = await this.logRepository.checkExists(notificationId);
    if (exists) {
      console.log(`[HandleAppStoreNotificationUseCase] Notification ${notificationId} already processed. Skipping.`);
      return;
    }

    const type = decodedPayload.notificationType;
    const subtype = decodedPayload.subtype;
    const data = decodedPayload.data;

    // 2. Log exactly what we received for later debugging
    await this.logRepository.logWebhook(notificationId, decodedPayload);

    if (!data) return;

    let transactionInfo: any = data.signedTransactionInfo || {};
    let renewalInfo: any = data.signedRenewalInfo || {};
    
    // Note: since we used verifyAndDecodeNotification from @apple library, 
    // signedTransactionInfo and signedRenewalInfo inside data SHOULD already be objects if the library decoded them automatically (if we use the V2 Notification parsing properly).
    // Actually as per Apple's AppStoreServerLibrary for JS: it decodes it for you.
    // The library returns a decoded NotificationV2DecodedPayload type where data.signedTransactionInfo is decoded!
    
    const originalTransactionId = transactionInfo.originalTransactionId;
    if (!originalTransactionId) return;

    if (!VALID_PRODUCT_IDS.includes(transactionInfo.productId)) {
       console.log(`[HandleAppStoreNotificationUseCase] Ignoring webhook. Product ID not tracked: ${transactionInfo.productId}`);
       return;
    }

    if (!db) throw new Error('DB not initialized');

    // 3. Handle Subscription Lifecycle
    let isForcedInactive = false;

    switch (type) {
      case 'SUBSCRIBED':
      case 'INITIAL_BUY':
      case 'DID_RENEW':
      case 'INTERACTIVE_RENEWAL':
        console.log(`[IAP] Activating/Renewing subscription: ${originalTransactionId}`);
        break;
      case 'DID_FAIL_TO_RENEW':
      case 'EXPIRED':
      case 'GRACE_PERIOD_EXPIRED':
        console.log(`[IAP] Subscription expired/failed to renew: ${originalTransactionId}`);
        break;
      case 'REFUND':
      case 'REVOKE':
        console.log(`[IAP] Subscription refunded/revoked: ${originalTransactionId}`);
        isForcedInactive = true;
        break;
      case 'DID_CHANGE_RENEWAL_STATUS':
        console.log(`[IAP] Subscription auto-renew status changed: ${originalTransactionId}`);
        break;
    }

    const subscriptions = db.collection('subscriptions');
    const users = db.collection('users');
    const revenueTransactions = db.collection('revenue_transactions');
    const subRef = subscriptions.doc(originalTransactionId);

    // Revenue Tracking
    let amount = 0;
    if (type === 'SUBSCRIBED' || type === 'DID_RENEW' || type === 'INTERACTIVE_RENEWAL' || type === 'INITIAL_BUY') {
      const { getPriceForProduct } = require('../../domain/constants/ProductPrices');
      amount = getPriceForProduct(transactionInfo.productId);
    } else if (type === 'REFUND') {
      const { getPriceForProduct } = require('../../domain/constants/ProductPrices');
      amount = -getPriceForProduct(transactionInfo.productId);
    }

    // Some purchases (like lifetimes) or webhooks return epochs
    const expiresAt = transactionInfo.expiresDate || 0;
    const isActive = isForcedInactive ? false : (expiresAt > Date.now() || expiresAt === 0 && !isForcedInactive);

    const updateData: any = {
      isActive,
      expiresAt,
      updatedAt: Date.now(),
      productId: transactionInfo.productId,
      originalTransactionId,
      environment: data.environment
    };

    if (renewalInfo && renewalInfo.autoRenewStatus !== undefined) {
      updateData.autoRenewStatus = renewalInfo.autoRenewStatus === 1;
    }

    const batch = db.batch();
    batch.set(subRef, updateData, { merge: true });

    if (amount !== 0) {
      const txRef = revenueTransactions.doc(transactionInfo.transactionId || notificationId);
      batch.set(txRef, {
        notificationId,
        originalTransactionId,
        transactionId: transactionInfo.transactionId || null,
        productId: transactionInfo.productId,
        amount,
        currency: 'USD',
        environment: data.environment,
        type,
        timestamp: Date.now()
      });
    }

    // Handle users sharing the subscription
    const sharingUsers = await users.where('subscriptionId', '==', originalTransactionId).get();
    
    if (isActive) {
      for (const uDoc of sharingUsers.docs) {
        batch.set(uDoc.ref, { 
          isPremium: true,
          activeProductId: transactionInfo.productId
        }, { merge: true });
      }
    } else {
      for (const uDoc of sharingUsers.docs) {
        if (uDoc.data().subscriptionId === originalTransactionId) {
          batch.set(uDoc.ref, { 
            isPremium: false,
            activeProductId: null
          }, { merge: true });
        }
      }
    }

    await batch.commit();
  }
}
