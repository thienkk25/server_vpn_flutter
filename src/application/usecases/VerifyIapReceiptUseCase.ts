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

    // 3. Get latest subscription
    let maxExpiration = 0;
    let latestProductId = '';
    let latestTransactionId = '';

    for (const item of receipts) {
      const expiresAt = item.expires_date_ms ? parseInt(item.expires_date_ms, 10) : 0;
      if (expiresAt > maxExpiration) {
        maxExpiration = expiresAt;
        latestProductId = item.product_id;
        latestTransactionId = item.original_transaction_id;
      }
    }

    const isActive = maxExpiration > Date.now();

    const subscriptionData: UserSubscriptionEntity = {
      userId,
      isActive,
      expiresAt: maxExpiration,
      productId: latestProductId,
      originalTransactionId: latestTransactionId,
      autoRenewStatus: true,
      isInBillingRetry: false,
      environment: appleResponse.environment
    };

    // 5 & 6. save subscription and update user are handled inside saveSubscription
    await this.subscriptionRepository.saveSubscription(subscriptionData);

    return subscriptionData;
  }
}
