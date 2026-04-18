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
    
    // Ensure the private key has correct line breaks for PEM format
    const formattedPrivateKey = params.privateKey.replace(/\\n/g, '\n');
    
    // Sign using the `.p8` private key contents
    return sign.sign(formattedPrivateKey, 'base64');
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

  /**
   * Verifies an Apple StoreKit 1 App Receipt (Base64 PKCS#7).
   */
  async verifyAppReceipt(receiptData: string, password?: string): Promise<any> {
    const payload = {
      'receipt-data': receiptData,
      password: password
    };

    try {
      // Fetch from production
      let response = await fetch('https://buy.itunes.apple.com/verifyReceipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      let data = await response.json();

      // If status is 21007, the receipt is from the sandbox environment
      if (data.status === 21007) {
        response = await fetch('https://sandbox.itunes.apple.com/verifyReceipt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        data = await response.json();
      }

      if (data.status !== 0) {
        throw new Error(`Receipt verification failed with status: ${data.status}`);
      }

      return data;
    } catch (error: any) {
      throw new Error(`Failed to verify App Receipt: ${error.message}`);
    }
  }
}
