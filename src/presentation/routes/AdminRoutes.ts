import { Router } from 'express';
import { adminMiddleware } from '../middlewares/AdminMiddleware';
import { AdminServerController } from '../controllers/AdminServerController';
import { 
  GetAllServersAdminUseCase, 
  CreateServerUseCase, 
  UpdateServerUseCase, 
  DeleteServerUseCase,
  ImportServersUseCase
} from '../../application/usecases/AdminServerUseCases';
import { ServerFirebaseRepository } from '../../infrastructure/repositories/ServerFirebaseRepository';
import { AdminSettingsUseCases } from '../../application/usecases/AdminSettingsUseCases';
import { AdminSettingsController } from '../controllers/AdminSettingsController';

const router = Router();

// DI Setup
const repository = new ServerFirebaseRepository();
const getAllUseCase = new GetAllServersAdminUseCase(repository);
const createUseCase = new CreateServerUseCase(repository);
const updateUseCase = new UpdateServerUseCase(repository);
const deleteUseCase = new DeleteServerUseCase(repository);
const importUseCase = new ImportServersUseCase(repository);

const adminController = new AdminServerController(
  getAllUseCase, createUseCase, updateUseCase, deleteUseCase, importUseCase
);

const settingsUseCases = new AdminSettingsUseCases();
const adminSettingsController = new AdminSettingsController(settingsUseCases);

// Protect all /admin routes with adminMiddleware
router.use(adminMiddleware);

router.get('/servers', adminController.getAllServers);
router.post('/servers', adminController.createServer);
router.post('/servers/import', adminController.importServers);
router.put('/servers/:id', adminController.updateServer);
router.delete('/servers/:id', adminController.deleteServer);

router.get('/settings', adminSettingsController.getSettings);
router.put('/settings', adminSettingsController.updateSettings);

export default router;
