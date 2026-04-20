import { Request, Response } from 'express';
import { IapWebhookLogFirebaseRepository } from '../../infrastructure/repositories/IapWebhookLogFirebaseRepository';

export class AdminIapController {
  private logRepository = new IapWebhookLogFirebaseRepository();

  public getWebhooks = async (req: Request, res: Response): Promise<void> => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const lastDocId = req.query.lastDocId as string | undefined;

      const logs = await this.logRepository.getLogs(limit, lastDocId);

      res.status(200).json({
        success: true,
        data: logs,
      });
    } catch (error: any) {
      console.error('[AdminIapController] Failed to get webhooks:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  };
}
