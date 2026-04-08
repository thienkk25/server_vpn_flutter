import { Request, Response } from 'express';
import { db } from '../../infrastructure/config/firebase';

export class IapWebhookController {
  public handleWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
      const notification = req.body;
      const type = notification.notificationType;
      
      // Apple V2 Server Notification payload structure usually places the data inside `data.signedTransactionInfo` 
      // which needs JWT decoding, but for this basic implementation we follow the given blueprint layout 
      // assuming it's pre-parsed by middleware or unencrypted V1 payload. 
      // Let's safely extract it:
      let originalTransactionId = null;

      if (notification.data && notification.data.signedTransactionInfo) {
        // If it's literally plain JSON (or if you already decoded it before this)
        originalTransactionId = notification.data.signedTransactionInfo.originalTransactionId;
      } else if (notification.unified_receipt) {
        // V1 fallback
        const latest = notification.unified_receipt.latest_receipt_info?.[0];
        if (latest) {
          originalTransactionId = latest.original_transaction_id;
        }
      }

      if (!originalTransactionId) {
        res.status(400).send('Missing transaction ID');
        return;
      }

      if (!db) {
        res.status(500).send('DB not initialized');
        return;
      }

      const subscriptions = db.collection('subscriptions');
      const users = db.collection('users');

      const subRef = subscriptions.doc(originalTransactionId);

      if (type === 'REFUND' || type === 'EXPIRED' || type === 'DID_FAIL_TO_RENEW') {
        // Update subscription
        await subRef.update({ 
          isActive: false, 
          updatedAt: Date.now() 
        });

        // Find associated user and update their status
        const subDoc = await subRef.get();
        if (subDoc.exists) {
          const userId = subDoc.data()?.userId;
          if (userId) {
            await users.doc(userId).update({
              isPremium: false
            });
          }
        }
      }

      res.sendStatus(200);
    } catch (error: any) {
      console.error('Webhook error:', error);
      res.status(500).send('Internal Server Error');
    }
  };
}
