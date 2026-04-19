import { Router } from 'express';
import { IapController } from '../controllers/IapController';
import { IapWebhookController } from '../controllers/IapWebhookController';
import { VerifyIapReceiptUseCase } from '../../application/usecases/VerifyIapReceiptUseCase';
import { AppleIapService } from '../../infrastructure/services/AppleIapService';
import { SubscriptionFirebaseRepository } from '../../infrastructure/repositories/SubscriptionFirebaseRepository';
import { authMiddleware } from '../middlewares/AuthMiddleware';

const router = Router();

// DI Setup for this module
const appleIapService = new AppleIapService();
const subscriptionRepository = new SubscriptionFirebaseRepository();
const verifyIapReceiptUseCase = new VerifyIapReceiptUseCase(appleIapService, subscriptionRepository);

const iapController = new IapController(verifyIapReceiptUseCase);
const iapWebhookController = new IapWebhookController();

// Routes
router.post('/verify', authMiddleware, iapController.verifyReceipt);
router.post('/restore', authMiddleware, iapController.restorePurchase);
router.post('/promotional-offer/signature', authMiddleware, iapController.getPromotionalSignature);
router.post('/webhook', iapWebhookController.handleWebhook);

export default router;
