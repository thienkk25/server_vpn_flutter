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
  [key: string]: any;
}

export class AppleIapService {
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
   * Tạo chữ ký bảo mật (Signature) cho Apple StoreKit 2 Promotional Offer.
   * Yêu cầu các biến môi trường: APPLE_BUNDLE_ID, APPLE_KEY_ID, APPLE_PRIVATE_KEY
   */
  generatePromotionalOfferSignature(productId: string, offerIdentifier: string, applicationUsername: string = ''): any {
    const bundleId = process.env.APPLE_BUNDLE_ID || process.env.APP_BUNDLE_ID;
    const keyIdentifier = process.env.APPLE_KEY_ID;
    let privateKey = process.env.APPLE_PRIVATE_KEY;

    if (!bundleId || !keyIdentifier || !privateKey) {
      throw new Error('Thiếu cấu hình biến môi trường Apple (APPLE_BUNDLE_ID, APPLE_KEY_ID, APPLE_PRIVATE_KEY) để tạo chữ ký.');
    }

    // Xử lý privateKey nếu được truyền qua .env thành chuỗi liên tục
    if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
       // Thêm header và footer nếu thiếu (format PKCS8)
       privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----`;
    }

    const nonce = crypto.randomUUID().toLowerCase(); // UUID v4 lowercase
    const timestamp = Math.floor(Date.now() / 1000); // Miliseconds to seconds

    // Payload yêu cầu của Apple:
    // appBundleId + '\u2008' + keyIdentifier + '\u2008' + productIdentifier + '\u2008' + offerIdentifier + '\u2008' + applicationUsername + '\u2008' + nonce + '\u2008' + timestamp
    const payload = `${bundleId}\u2008${keyIdentifier}\u2008${productId}\u2008${offerIdentifier}\u2008${applicationUsername}\u2008${nonce}\u2008${timestamp}`;

    // Ký bằng thuật toán ECDSA P-256 kèm SHA-256
    const sign = crypto.createSign('SHA256');
    sign.update(payload);
    sign.end();
    
    const signatureBase64 = sign.sign(privateKey, 'base64');

    return {
      signature: signatureBase64,
      nonce: nonce,
      timestamp: timestamp,
      keyIdentifier: keyIdentifier
    };
  }
}
