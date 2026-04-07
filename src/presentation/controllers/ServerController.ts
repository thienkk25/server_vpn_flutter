import { Request, Response } from 'express';
import { GetServersUseCase } from '../../application/usecases/GetServersUseCase';

export class ServerController {
  constructor(
    private getServersUseCase: GetServersUseCase,
    private getPrivateServerConfigUseCase?: any // Injected dynamically or updated
  ) { }

  public getServers = async (req: Request, res: Response): Promise<void> => {
    try {
      const servers = await this.getServersUseCase.execute();
      res.status(200).json({
        success: true,
        data: servers,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  };

  public getPrivateServerConfig = async (req: any, res: Response): Promise<void> => {
    try {
      if (!this.getPrivateServerConfigUseCase) {
        res.status(500).json({ success: false, message: 'Not configured.' });
        return;
      }
      const userId = req.user?.uid;
      const serverId = req.params.id;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const config = await this.getPrivateServerConfigUseCase.execute(userId, serverId);

      res.status(200).json({
        success: true,
        data: config,
      });
    } catch (error: any) {
      const status = error.message?.includes('403') ? 403 : (error.message?.includes('404') ? 404 : 500);
      res.status(status).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  };
}
