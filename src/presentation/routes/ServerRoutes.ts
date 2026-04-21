import { Router } from 'express';
import { ServerController } from '../controllers/ServerController';
import { GetServersUseCase } from '../../application/usecases/GetServersUseCase';
import { ServerFirebaseRepository } from '../../infrastructure/repositories/ServerFirebaseRepository';

import { SubscriptionFirebaseRepository } from '../../infrastructure/repositories/SubscriptionFirebaseRepository';
import { GetPrivateServerConfigUseCase } from '../../application/usecases/GetPrivateServerConfigUseCase';
import { apiKeyMiddleware } from '../middlewares/ApiKeyMiddleware';

const router = Router();

// DI Setup for this module
const serverRepository = new ServerFirebaseRepository();
const subscriptionRepository = new SubscriptionFirebaseRepository();

const getServersUseCase = new GetServersUseCase(serverRepository);
const getPrivateServerConfigUseCase = new GetPrivateServerConfigUseCase(serverRepository);

const serverController = new ServerController(
  getServersUseCase,
  getPrivateServerConfigUseCase
);

// Routes
router.get('/', serverController.getServers);
router.get('/:id/config', apiKeyMiddleware, serverController.getPrivateServerConfig);

export default router;
