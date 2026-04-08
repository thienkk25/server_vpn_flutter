import { Request, Response } from 'express';
import { db } from '../../infrastructure/config/firebase';
import jwt, { JwtHeader, SigningKeyCallback } from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

const VALID_PRODUCT_IDS = [
  'premium_weekly_tt',
  'premium_monthly_tt',
  'premium_yearly_tt',
  'premium_lifetime_test'
];

const client = jwksClient({
  jwksUri: 'https://appleid.apple.com/auth/keys',
  cache: true,
  rateLimit: true,
});

function getApplePublicKey(header: JwtHeader, callback: SigningKeyCallback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err || !key) {
      callback(err || new Error('Invalid kid signing key'));
    } else {
      callback(null, key.getPublicKey());
    }
  });
}

const verifyAndDecodeAppleJWT = (token: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, getApplePublicKey, { algorithms: ['ES256'] }, (err, decoded) => {
      if (err) return reject(err);
      resolve(decoded);
    });
  });
};

export class IapWebhookController {
  public handleWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
      const { signedPayload } = req.body;
      
      if (!signedPayload) {
        res.status(400).send('Missing signedPayload');
        return;
      }

      // 1. Verify Apple signedPayload (CRITICAL)
      const decodedPayload = await verifyAndDecodeAppleJWT(signedPayload);

      // 2. Parse Apple V2 Notification Properly
      const type = decodedPayload.notificationType;
      // const subtype = decodedPayload.subtype; // optional usage
      const data = decodedPayload.data;

      if (!data) {
        res.status(400).send('Missing payload data');
        return;
      }

      // 3. Validate Data (Security)
      if (data.bundleId !== process.env.APP_BUNDLE_ID) {
        console.warn(`Webhook ignored: BundleID mismatch. Got: ${data.bundleId}`);
        res.status(400).send('Invalid bundleId');
        return;
      }

      let transactionInfo: any = null;
      let renewalInfo: any = null;

      if (data.signedTransactionInfo) {
        transactionInfo = await verifyAndDecodeAppleJWT(data.signedTransactionInfo);
      }
      
      if (data.signedRenewalInfo) {
        renewalInfo = await verifyAndDecodeAppleJWT(data.signedRenewalInfo);
      }

      if (!transactionInfo || !transactionInfo.originalTransactionId) {
        res.status(400).send('Missing originalTransactionId in transaction info');
        return;
      }

      if (!VALID_PRODUCT_IDS.includes(transactionInfo.productId)) {
        res.status(400).send('Invalid productId');
        return;
      }

      if (!db) {
        res.status(500).send('DB not initialized');
        return;
      }

      // 4. Handle Subscription Lifecycle
      let isForcedInactive = false;
      const originalTransactionId = transactionInfo.originalTransactionId;

      switch (type) {
        case 'SUBSCRIBED':
        case 'INITIAL_BUY':
        case 'DID_RENEW':
        case 'INTERACTIVE_RENEWAL':
          console.log(`[IAP] Activating/Renewing subscription: ${originalTransactionId}`);
          break;
        case 'DID_FAIL_TO_RENEW':
        case 'EXPIRED':
        case 'GRACE_PERIOD_EXPIRED':
          console.log(`[IAP] Subscription expired/failed to renew: ${originalTransactionId}`);
          break;
        case 'REFUND':
        case 'REVOKE':
          console.log(`[IAP] Subscription refunded/revoked: ${originalTransactionId}`);
          isForcedInactive = true;
          break;
        case 'DID_CHANGE_RENEWAL_STATUS':
          console.log(`[IAP] Subscription auto-renew status changed: ${originalTransactionId}`);
          break;
        default:
          console.log(`[IAP] Received Apple notification type: ${type}`);
          break;
      }

      // 5. Firestore Update Logic
      const subscriptions = db.collection('subscriptions');
      const users = db.collection('users');

      const subRef = subscriptions.doc(originalTransactionId);
      
      const expiresAt = transactionInfo.expiresDate || 0;
      
      // Usually lifetime purchases don't have expiresDate. It defaults to 0 and becomes inactive.
      // But Apple V2 Webhooks are mostly for Auto-Renewable Subscriptions! They always have expiresDate.
      const isActive = isForcedInactive ? false : (expiresAt > Date.now() || expiresAt === 0 && !isForcedInactive); // simplified fallback

      const updateData: any = {
        isActive,
        expiresAt,
        updatedAt: Date.now(),
        productId: transactionInfo.productId,
        originalTransactionId,
        environment: data.environment
      };

      if (renewalInfo && renewalInfo.autoRenewStatus !== undefined) {
        updateData.autoRenewStatus = renewalInfo.autoRenewStatus === 1;
      }

      const batch = db.batch();
      
      // Ensure idempotency using set with merge true
      batch.set(subRef, updateData, { merge: true });

      // 8. Extra (Advanced) - Revoke previous users / handles multiple users sharing
      const sharingUsers = await users.where('subscriptionId', '==', originalTransactionId).get();
      
      if (isActive) {
         for (const uDoc of sharingUsers.docs) {
             batch.set(uDoc.ref, { isPremium: true }, { merge: true });
         }
      } else {
         for (const uDoc of sharingUsers.docs) {
             if (uDoc.data().subscriptionId === originalTransactionId) {
                 batch.set(uDoc.ref, { isPremium: false }, { merge: true });
             }
         }
      }

      await batch.commit();

      res.sendStatus(200);
    } catch (error: any) {
      console.error('Webhook error:', error);
      res.status(500).send('Internal Server Error');
    }
  };
}
