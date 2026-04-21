import { Request, Response } from 'express';
import { AdminSettingsUseCases } from '../../application/usecases/AdminSettingsUseCases';

export class AppSettingsController {
  constructor(private settingsUseCases: AdminSettingsUseCases) {}

  public getSettings = async (req: Request, res: Response): Promise<void> => {
    try {
      const settings = await this.settingsUseCases.getSettings();
      res.status(200).json({ success: true, data: settings });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
}
