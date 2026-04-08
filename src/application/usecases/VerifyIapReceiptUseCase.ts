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

    // Extract the latest expiration date from the receipt
    // Usually found in latest_receipt_info for subscriptions
    const receipts = appleResponse.latest_receipt_info || appleResponse.receipt?.in_app || [];
    
    if (receipts.length === 0) {
      const emptySubscription: UserSubscriptionEntity = {
        userId,
        isPremium: false,
        expiredAt: 0,
        productId: '',
        originalTransactionId: '',
      };
      await this.subscriptionRepository.saveSubscription(emptySubscription);
      return emptySubscription;
    }

    // We assume the receipts are sorted or we find the maximum expires_date_ms
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

    const isPremium = maxExpiration > Date.now();

    const subscriptionData: UserSubscriptionEntity = {
      userId,
      isPremium,
      expiredAt: maxExpiration,
      productId: latestProductId,
      originalTransactionId: latestTransactionId,
    };

    await this.subscriptionRepository.saveSubscription(subscriptionData);

    return subscriptionData;
  }
}
