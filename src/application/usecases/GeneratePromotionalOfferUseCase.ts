import { AppleIapService } from '../../infrastructure/services/AppleIapService';

export class GeneratePromotionalOfferUseCase {
  constructor(private appleIapService: AppleIapService) {}

  /**
   * Tạo chữ ký Promotional Offer cho người dùng.
   * Cần truyền productId, offerIdentifier và lấy applicationUserName (thường là lowercase UID user).
   */
  async execute(productId: string, offerIdentifier: string, userId: string): Promise<any> {
    if (!productId || !offerIdentifier) {
        throw new Error('Thiếu thông tin productId hoặc offerIdentifier');
    }

    // Theo guidelines của Apple StoreKit, applicationUsername nên được sử dụng.
    // Nếu ứng dụng đang cấu hình dùng UID của thiết bị làm username dưới dạng chữ thường:
    const applicationUsername = userId ? userId.toLowerCase() : '';

    try {
      const signatureData = this.appleIapService.generatePromotionalOfferSignature(
          productId, 
          offerIdentifier, 
          applicationUsername
      );
      
      return signatureData;
    } catch (error: any) {
      console.error('[GeneratePromotionalOfferUseCase] Lỗi tạo chữ ký:', error.message);
      throw new Error(`Không thể tạo chữ ký Promotional Offer: ${error.message}`);
    }
  }
}
