import crypto from 'crypto';
import { AppleIapService } from '../../infrastructure/services/AppleIapService';

export interface GeneratePromotionalOfferConfig {
  appBundleId: string;
  appleKeyId: string;
  applePrivateKey: string;
}

export interface PromotionalOfferSignatureResponse {
  signature: string;
  nonce: string;
  timestamp: number;
  keyIdentifier: string;
}

export class GeneratePromotionalOfferUseCase {
  constructor(
    private appleIapService: AppleIapService,
    private config: GeneratePromotionalOfferConfig
  ) {}

  execute(
    productId: string,
    offerIdentifier: string,
    applicationUsername: string = ''
  ): PromotionalOfferSignatureResponse {
    if (!productId || !offerIdentifier) {
      throw new Error('productId and offerIdentifier are required');
    }

    if (!this.config.appleKeyId || !this.config.applePrivateKey) {
      throw new Error('appleKeyId and applePrivateKey must be configured to generate promotional offers');
    }

    const nonce = crypto.randomUUID().toLowerCase();
    const timestamp = Date.now();

    const signature = this.appleIapService.generatePromotionalOfferSignature({
      appBundleId: this.config.appBundleId,
      keyId: this.config.appleKeyId,
      privateKey: this.config.applePrivateKey,
      productId,
      offerIdentifier,
      applicationUsername,
      nonce,
      timestamp
    });

    return {
      signature,
      nonce,
      timestamp,
      keyIdentifier: this.config.appleKeyId
    };
  }
}
