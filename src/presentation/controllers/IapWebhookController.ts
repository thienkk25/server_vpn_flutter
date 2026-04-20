import { Request, Response } from 'express';
import { AppleServerNotificationService } from '../../infrastructure/services/AppleServerNotificationService';
import { HandleAppStoreNotificationUseCase } from '../../application/usecases/HandleAppStoreNotificationUseCase';

export class IapWebhookController {
  private appleService = new AppleServerNotificationService();
  private handleNotificationUseCase = new HandleAppStoreNotificationUseCase();

  public handleWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
      const { signedPayload } = req.body;
      
      if (!signedPayload) {
        res.status(400).send('Missing signedPayload');
        return;
      }

      // 1. Verify and decode Apple signedPayload using official Apple library
      const decodedPayload = await this.appleService.verifyAndDecodeNotification(signedPayload);

      if (!decodedPayload) {
        res.status(400).send('Invalid payload');
        return;
      }

      // 2. Validate Data (Security) - The library checks this if enableOnlineChecks is false/true, but we can double check
      if (decodedPayload.data && decodedPayload.data.bundleId !== process.env.APP_BUNDLE_ID) {
        console.warn(`Webhook ignored: BundleID mismatch. Got: ${decodedPayload.data.bundleId}`);
        // Apple requires 200 OK so it doesn't retry invalid config on our end, but historically we sent 400. Let's send 200 to stop retries if it's completely wrong.
        res.status(200).send('Invalid bundleId');
        return;
      }

      // 3. Process business logic (idempotency, db updates)
      await this.handleNotificationUseCase.execute(decodedPayload);

      // Apple requires status 200 indicating successful receipt
      res.sendStatus(200);
    } catch (error: any) {
      console.error('[IapWebhookController] Webhook error:', error);
      // Send 500 so Apple retries later if it was a temporary DB failure or network issue
      res.status(500).send('Internal Server Error');
    }
  };
}
