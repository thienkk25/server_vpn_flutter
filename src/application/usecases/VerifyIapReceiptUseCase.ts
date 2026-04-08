import { AppleIapService } from '../../infrastructure/services/AppleIapService';
import { ISubscriptionRepository } from '../../domain/repositories/ISubscriptionRepository';
import { UserSubscriptionEntity } from '../../domain/entities/UserSubscriptionEntity';

export class VerifyIapReceiptUseCase {
  constructor(
    private appleIapService: AppleIapService,
    private subscriptionRepository: ISubscriptionRepository
  ) {}

  async execute(userId: string, receiptData: string): Promise<UserSubscriptionEntity> {
    const appleResponse = await this.appleIapService.verifyReceipt(receiptData);

    if (appleResponse.status !== 0) {
      throw new Error(`Invalid receipt. Apple status code: ${appleResponse.status}`);
    }

    const receipt = appleResponse.receipt;
    if (!receipt) {
      throw new Error('Receipt empty');
    }

    // 2. Validate bundle_id
    if (receipt.bundle_id !== process.env.APP_BUNDLE_ID) {
      throw new Error(`Bundle mismatch: ${receipt.bundle_id}`);
    }

    const receipts = appleResponse.latest_receipt_info || receipt.in_app || [];
    if (receipts.length === 0) {
      const emptySubscription: UserSubscriptionEntity = {
        userId,
        isActive: false,
        expiresAt: 0,
        productId: '',
        originalTransactionId: '',
      };
      await this.subscriptionRepository.saveSubscription(emptySubscription);
      return emptySubscription;
    }

    const VALID_PRODUCT_IDS = [
      'premium_weekly_tt',
      'premium_monthly_tt',
      'premium_yearly_tt',
      'premium_lifetime_test'
    ];

    // 3. Get latest subscription
    let maxExpiration = 0;
    let latestProductId = '';
    let latestTransactionId = '';

    for (const item of receipts) {
      if (item.cancellation_date_ms) {
        continue; // Skip refunded/cancelled purchases
      }
      if (!VALID_PRODUCT_IDS.includes(item.product_id)) {
        continue; // Skip unrecognized products
      }

      let expiresAt = 0;
      if (item.expires_date_ms) {
        expiresAt = parseInt(item.expires_date_ms, 10);
      } else if (item.purchase_date_ms) {
        // Lifetime purchase (non-consumable) has no expiration date
        // Use a far future date to represent lifetime access (Year 3000)
        expiresAt = 32503680000000;
      }

      if (expiresAt > maxExpiration) {
        maxExpiration = expiresAt;
        latestProductId = item.product_id;
        latestTransactionId = item.original_transaction_id;
      }
    }

    const isActive = maxExpiration > Date.now();

    let autoRenewStatus = true;
    let isInBillingRetry = false;

    if (appleResponse.pending_renewal_info && latestProductId) {
      const renewalInfo = appleResponse.pending_renewal_info.find(
        (info) => info.product_id === latestProductId
      );
      if (renewalInfo) {
        autoRenewStatus = renewalInfo.auto_renew_status === '1';
        isInBillingRetry = renewalInfo.is_in_billing_retry_period === '1';
      }
    } else if (maxExpiration === 32503680000000) {
      // Lifetime purchases don't auto-renew
      autoRenewStatus = false;
    }

    const subscriptionData: UserSubscriptionEntity = {
      userId,
      isActive,
      expiresAt: maxExpiration,
      productId: latestProductId,
      originalTransactionId: latestTransactionId,
      autoRenewStatus,
      isInBillingRetry,
      environment: appleResponse.environment
    };

    // 5 & 6. save subscription and update user are handled inside saveSubscription
    await this.subscriptionRepository.saveSubscription(subscriptionData);

    return subscriptionData;
  }
}
