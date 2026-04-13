import { Router } from 'express';
import { IapController } from '../controllers/IapController';
import { IapWebhookController } from '../controllers/IapWebhookController';
import { VerifyIapReceiptUseCase } from '../../application/usecases/VerifyIapReceiptUseCase';
import { GeneratePromotionalOfferUseCase } from '../../application/usecases/GeneratePromotionalOfferUseCase';
import { AppleIapService } from '../../infrastructure/services/AppleIapService';
import { SubscriptionFirebaseRepository } from '../../infrastructure/repositories/SubscriptionFirebaseRepository';
import { authMiddleware } from '../middlewares/AuthMiddleware';

const router = Router();

// DI Setup for this module
const appleIapService = new AppleIapService();
const subscriptionRepository = new SubscriptionFirebaseRepository();
const verifyIapReceiptUseCase = new VerifyIapReceiptUseCase(appleIapService, subscriptionRepository);

// Load Promotional Offer configuration from environment
const promoConfig = {
  appBundleId: process.env.APP_BUNDLE_ID || '',
  appleKeyId: process.env.APPLE_KEY_ID || '',
  applePrivateKey: process.env.APPLE_PRIVATE_KEY || ''
};
const generatePromotionalOfferUseCase = new GeneratePromotionalOfferUseCase(appleIapService, promoConfig);

const iapController = new IapController(verifyIapReceiptUseCase, generatePromotionalOfferUseCase);
const iapWebhookController = new IapWebhookController();

// Routes
router.post('/verify', authMiddleware, iapController.verifyReceipt);
router.post('/restore', authMiddleware, iapController.restorePurchase);
router.post('/promotional-offer/signature', authMiddleware, iapController.generatePromotionalSignature);
router.post('/webhook', iapWebhookController.handleWebhook);

export default router;
