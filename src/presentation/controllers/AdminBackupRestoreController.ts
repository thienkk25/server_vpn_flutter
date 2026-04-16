import { Request, Response } from 'express';
import { AdminBackupRestoreUseCases } from '../../application/usecases/AdminBackupRestoreUseCases';

export class AdminBackupRestoreController {
  constructor(private backupRestoreUseCases: AdminBackupRestoreUseCases) {}

  exportData = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = await this.backupRestoreUseCases.exportData();
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error('Failed to export data:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  };

  importData = async (req: Request, res: Response): Promise<void> => {
    try {
      const backupPayload = req.body;
      if (!backupPayload || !backupPayload.data) {
        res.status(400).json({ success: false, error: 'Invalid payload' });
        return;
      }
      await this.backupRestoreUseCases.importData(backupPayload);
      res.status(200).json({ success: true, message: 'Data imported successfully' });
    } catch (error: any) {
      console.error('Failed to import data:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  };
}
