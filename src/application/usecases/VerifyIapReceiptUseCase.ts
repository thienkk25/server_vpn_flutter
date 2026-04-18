import { AppleIapService } from '../../infrastructure/services/AppleIapService';
import { ISubscriptionRepository } from '../../domain/repositories/ISubscriptionRepository';
import { UserSubscriptionEntity } from '../../domain/entities/UserSubscriptionEntity';

export class VerifyIapReceiptUseCase {
  constructor(
    private appleIapService: AppleIapService,
    private subscriptionRepository: ISubscriptionRepository
  ) {}

  async execute(userId: string, jwsRepresentation: string): Promise<UserSubscriptionEntity> {
    let transaction: any = {};

    // Determine if the incoming payload is a StoreKit 2 JWS Token or a StoreKit 1 App Receipt
    if (jwsRepresentation.includes('.')) {
      // 1A. Verify and decode the StoreKit 2 JWS token
      transaction = await this.appleIapService.verifyJwsTransaction(jwsRepresentation);
    } else {
      // 1B. Verify StoreKit 1 App Receipt (Base64)
      const receiptResponse = await this.appleIapService.verifyAppReceipt(jwsRepresentation, process.env.APPLE_SHARED_SECRET);
      
      const latestReceipts = receiptResponse.latest_receipt_info;
      if (!latestReceipts || latestReceipts.length === 0) {
        throw new Error('No receipt info found in the App Receipt.');
      }

      // Sort to get the most recent transaction
      latestReceipts.sort((a: any, b: any) => parseInt(b.expires_date_ms || '0') - parseInt(a.expires_date_ms || '0'));
      const latest = latestReceipts[0];
      
      transaction = {
        bundleId: receiptResponse.receipt.bundle_id,
        productId: latest.product_id,
        originalTransactionId: latest.original_transaction_id,
        transactionId: latest.transaction_id,
        purchaseDate: parseInt(latest.purchase_date_ms || '0'),
        expiresDate: latest.expires_date_ms ? parseInt(latest.expires_date_ms) : undefined,
        revocationDate: latest.cancellation_date_ms ? parseInt(latest.cancellation_date_ms) : undefined,
        environment: receiptResponse.environment,
        offerIdentifier: latest.promotional_offer_id,
        offerType: latest.promotional_offer_id ? 2 : undefined
      };
    }

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

    // CHỐNG ACCOUNT HOPPING
    const existingSub = await this.subscriptionRepository.getSubscriptionByTransactionId(transaction.originalTransactionId);
    if (existingSub && existingSub.userId && existingSub.userId !== userId) {
      throw new Error(`Receipt/Giao dịch này đã được liên kết với một tài khoản khác. Vui lòng đăng nhập đúng tài khoản đẻ Khôi Phục (Restore).`);
    }

    const subscriptionData: UserSubscriptionEntity = {
      userId,
      isActive,
      expiresAt,
      productId: transaction.productId,
      originalTransactionId: transaction.originalTransactionId,
      autoRenewStatus,
      isInBillingRetry: false,
      environment: transaction.environment || 'Production',
      offerIdentifier: transaction.offerIdentifier,
      offerType: transaction.offerType
    };

    // 6. save subscription and update user are handled inside saveSubscription
    await this.subscriptionRepository.saveSubscription(subscriptionData);

    return subscriptionData;
  }
}
