import { Router } from 'express';
import { AppSettingsController } from '../controllers/AppSettingsController';
import { AdminSettingsUseCases } from '../../application/usecases/AdminSettingsUseCases';

const router = Router();

const settingsUseCases = new AdminSettingsUseCases();
const appSettingsController = new AppSettingsController(settingsUseCases);

// Routes
router.get('/', appSettingsController.getSettings);

export default router;
