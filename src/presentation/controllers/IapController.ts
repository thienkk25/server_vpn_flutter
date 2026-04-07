import { Response } from 'express';
import { VerifyIapReceiptUseCase } from '../../application/usecases/VerifyIapReceiptUseCase';
import { AuthenticatedRequest } from '../middlewares/AuthMiddleware';

export class IapController {
  constructor(private verifyIapReceiptUseCase: VerifyIapReceiptUseCase) {}

  public verifyReceipt = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.uid;
      const { receiptData } = req.body;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      if (!receiptData) {
        res.status(400).json({ success: false, message: 'Receipt data is required' });
        return;
      }

      const subscription = await this.verifyIapReceiptUseCase.execute(userId, receiptData);

      res.status(200).json({
        success: true,
        data: subscription,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error verifying receipt',
      });
    }
  };

  public restorePurchase = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    // Restoration logic is typically the same as verify (re-validates the receipt and returns updated sub)
    await this.verifyReceipt(req, res);
  };
}
