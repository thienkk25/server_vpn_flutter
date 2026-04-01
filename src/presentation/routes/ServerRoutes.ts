import { Router } from 'express';
import { ServerController } from '../controllers/ServerController';
import { GetServersUseCase } from '../../application/usecases/GetServersUseCase';
import { SeedDummyDataUseCase } from '../../application/usecases/SeedDummyDataUseCase';
import { ServerFirebaseRepository } from '../../infrastructure/repositories/ServerFirebaseRepository';

const router = Router();

// DI Setup for this module
const serverRepository = new ServerFirebaseRepository();
const getServersUseCase = new GetServersUseCase(serverRepository);
const seedDummyDataUseCase = new SeedDummyDataUseCase(serverRepository);
const serverController = new ServerController(getServersUseCase, seedDummyDataUseCase);

// Routes
router.get('/', serverController.getServers);
router.post('/seed', serverController.seedServers);

export default router;
