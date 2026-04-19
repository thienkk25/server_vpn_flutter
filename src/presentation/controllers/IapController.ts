import { Response } from 'express';
import { VerifyIapReceiptUseCase } from '../../application/usecases/VerifyIapReceiptUseCase';
import { AuthenticatedRequest } from '../middlewares/AuthMiddleware';

export class IapController {
  constructor(private verifyIapReceiptUseCase: VerifyIapReceiptUseCase) {}

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

  public getPromotionalSignature = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.uid;
      const { productId, offerIdentifier } = req.body;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      if (!productId || !offerIdentifier) {
        res.status(400).json({ success: false, message: 'productId and offerIdentifier are required' });
        return;
      }

      // Khởi tạo trực tiếp (Hoặc Inject qua constructor nếu muốn đồng bộ toàn file)
      // Để tránh phá vỡ constructor cũ, ta instantiate tạm ở đây, thực tế nên nhét vào constructor ở Routes
      const { GeneratePromotionalOfferUseCase } = require('../../application/usecases/GeneratePromotionalOfferUseCase');
      const { AppleIapService } = require('../../infrastructure/services/AppleIapService');
      
      const appleIapService = new AppleIapService();
      const generatePromotionalOfferUseCase = new GeneratePromotionalOfferUseCase(appleIapService);

      const signatureData = await generatePromotionalOfferUseCase.execute(productId, offerIdentifier, userId);

      res.status(200).json({
        success: true,
        data: signatureData,
        message: 'Tạo chữ ký thành công',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Lỗi tạo chữ ký',
      });
    }
  };
}
