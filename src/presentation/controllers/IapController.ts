import { Response } from 'express';
import { VerifyIapReceiptUseCase } from '../../application/usecases/VerifyIapReceiptUseCase';
import { AuthenticatedRequest } from '../middlewares/AuthMiddleware';

import { GeneratePromotionalOfferUseCase } from '../../application/usecases/GeneratePromotionalOfferUseCase';

export class IapController {
  constructor(
    private verifyIapReceiptUseCase: VerifyIapReceiptUseCase,
    private generatePromotionalOfferUseCase?: GeneratePromotionalOfferUseCase
  ) {}

  public verifyReceipt = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.uid;
      const { jwsRepresentation, receiptData } = req.body;
      const payloadString = jwsRepresentation || receiptData;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      if (!payloadString) {
        res.status(400).json({ success: false, message: 'JWS representation (or receipt data) is required' });
        return;
      }

      const subscription = await this.verifyIapReceiptUseCase.execute(userId, payloadString);

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

  public generatePromotionalSignature = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!this.generatePromotionalOfferUseCase) {
        res.status(501).json({ success: false, message: 'Promotional Offers are not configured on the server' });
        return;
      }

      const { productId, offerIdentifier } = req.body;
      let applicationUsername = '';
      
      const userId = req.user?.uid || req.body.userId;
      if (userId) {
         applicationUsername = userId.toLowerCase();
      }

      if (!productId || !offerIdentifier) {
        res.status(400).json({ success: false, message: 'Missing productId or offerIdentifier in body' });
        return;
      }

      const signatureData = this.generatePromotionalOfferUseCase.execute(
        productId, 
        offerIdentifier, 
        applicationUsername
      );
      
      res.status(200).json({
        success: true,
        message: 'Promotional offer signature generated successfully',
        data: signatureData
      });
    } catch (error: any) {
      console.error('[IAP Controller] generatePromotionalSignature error:', error.message);
      res.status(500).json({ success: false, message: error.message });
    }
  };
}
