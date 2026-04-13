import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export interface JWSTransactionDecodedPayload {
  originalTransactionId: string;
  transactionId: string;
  bundleId: string;
  productId: string;
  purchaseDate: number;
  expiresDate?: number;
  revocationDate?: number;
  environment: string;
  appAccountToken?: string;
  inAppOwnershipType?: string;
  type?: string;
  offerIdentifier?: string;
  offerType?: number;
  [key: string]: any;
}

export interface PromotionalOfferSignatureParams {
  appBundleId: string;
  keyId: string;
  privateKey: string;
  productId: string;
  offerIdentifier: string;
  applicationUsername: string;
  nonce: string;
  timestamp: number;
}

export class AppleIapService {
  /**
   * Generates a signature for an Apple Promotional Offer
   */
  generatePromotionalOfferSignature(params: PromotionalOfferSignatureParams): string {
    const payloadBuffer = [
      params.appBundleId,
      params.keyId,
      params.productId,
      params.offerIdentifier,
      params.applicationUsername.toLowerCase(),
      params.nonce,
      params.timestamp.toString(),
    ].join('\u200b');

    const sign = crypto.createSign('sha256');
    sign.update(payloadBuffer);
    
    // Sign using the `.p8` private key contents
    return sign.sign(params.privateKey, 'base64');
  }

  /**
   * Verifies an Apple StoreKit 2 JWS transaction locally using the embedded x5c certificate.
   */
  async verifyJwsTransaction(jws: string): Promise<JWSTransactionDecodedPayload> {
    const decoded = jwt.decode(jws, { complete: true });
    
    if (!decoded || !decoded.header || !(decoded.header as any).x5c) {
      throw new Error('Invalid JWS structure. Ensure the token is a StoreKit 2 JWS Representation.');
    }

    const x5c = (decoded.header as any).x5c;
    if (!Array.isArray(x5c) || x5c.length === 0) {
      throw new Error('No x5c certificates found in JWS header');
    }

    // The first certificate in the chain is the leaf certificate used for signing the payload
    const certString = x5c[0].match(/.{1,64}/g)?.join('\n') || x5c[0];
    const publicKey = `-----BEGIN CERTIFICATE-----\n${certString}\n-----END CERTIFICATE-----`;

    return new Promise((resolve, reject) => {
      jwt.verify(jws, publicKey, { algorithms: ['ES256'] }, (err, payload) => {
        if (err) {
          return reject(new Error(`Failed to verify JWS signature: ${err.message}`));
        }
        resolve(payload as JWSTransactionDecodedPayload);
      });
    });
  }
}
