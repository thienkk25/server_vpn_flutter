import { AppleIapService } from '../../infrastructure/services/AppleIapService';
import { ISubscriptionRepository } from '../../domain/repositories/ISubscriptionRepository';
import { UserSubscriptionEntity } from '../../domain/entities/UserSubscriptionEntity';
import { db } from '../../infrastructure/config/firebase';
import { getPriceForProduct } from '../../domain/constants/ProductPrices';

export class VerifyIapReceiptUseCase {
  constructor(
    private appleIapService: AppleIapService,
    private subscriptionRepository: ISubscriptionRepository
  ) {}

  async execute(userId: string, jwsRepresentation: string): Promise<UserSubscriptionEntity> {
    // 1. Verify and decode the StoreKit 2 JWS token using Apple's Embedded Public Key
    const transaction = await this.appleIapService.verifyJwsTransaction(jwsRepresentation);

    // 2. Validate bundle_id
    if (transaction.bundleId !== process.env.APP_BUNDLE_ID) {
      throw new Error(`Bundle mismatch: ${transaction.bundleId}`);
    }

    const VALID_PRODUCT_IDS = [
      'premium_weekly_tt',
      'premium_monthly_tt',
      'premium_yearly_tt',
      'premium_lifetime_test'
    ];

    if (!VALID_PRODUCT_IDS.includes(transaction.productId)) {
       throw new Error(`Invalid product ID: ${transaction.productId}`);
    }

    // 3. Determine expiration date
    let expiresAt = 0;
    if (transaction.expiresDate) {
      expiresAt = transaction.expiresDate;
    } else if (transaction.purchaseDate) {
      // Lifetime purchase (non-consumable) has no expiration date
      // Use a far future date to represent lifetime access (Year 3000)
      expiresAt = 32503680000000;
    }

    // 4. Check if refunded/revoked
    if (transaction.revocationDate) {
      expiresAt = 0;
    }

    // 5. Evaluate active status
    const isActive = expiresAt > Date.now();

    // In StoreKit 2, you typically get the latest info. 
    // Auto-renew status may need to be checked via Apple Server API or Notifications V2, 
    // but initially we assume it's active if it's a subscription.
    let autoRenewStatus = isActive && expiresAt !== 32503680000000;

    const subscriptionData: UserSubscriptionEntity = {
      userId,
      isActive,
      expiresAt,
      productId: transaction.productId,
      originalTransactionId: transaction.originalTransactionId,
      autoRenewStatus,
      isInBillingRetry: false,
      environment: transaction.environment || 'Production' // JWS includes environment
    };

    // 6. save subscription and update user are handled inside saveSubscription
    await this.subscriptionRepository.saveSubscription(subscriptionData);

    // 7. Save to revenue_transactions to support local sandbox tests and missing webhooks
    if (db && transaction.transactionId) {
       let amount = getPriceForProduct(transaction.productId);
       if (transaction.offerType) {
         amount = 0;
       }
       
       const txRef = db.collection('revenue_transactions').doc(transaction.transactionId);
       
       const txData = {
         notificationId: 'verify_api_fallback',
         originalTransactionId: transaction.originalTransactionId,
         transactionId: transaction.transactionId,
         productId: transaction.productId,
         amount,
         currency: 'USD',
         environment: transaction.environment || 'Production',
         type: transaction.type || 'SUBSCRIBED',
         offerType: transaction.offerType || null,
         timestamp: transaction.purchaseDate || Date.now()
       };

       // Use merge: true so if the webhook handles it as well, it just silently overwrites/merges
       await txRef.set(txData, { merge: true });
    }

    return subscriptionData;
  }
}
