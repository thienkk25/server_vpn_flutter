import { Request, Response } from 'express';
import { AdminSettingsUseCases } from '../../application/usecases/AdminSettingsUseCases';

export class AdminSettingsController {
  constructor(private settingsUseCases: AdminSettingsUseCases) {}

  public getSettings = async (req: Request, res: Response): Promise<void> => {
    try {
      const settings = await this.settingsUseCases.getSettings();
      res.status(200).json({ success: true, data: settings });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  public updateSettings = async (req: Request, res: Response): Promise<void> => {
    try {
      const updated = await this.settingsUseCases.updateSettings(req.body);
      res.status(200).json({ success: true, data: updated });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
}
