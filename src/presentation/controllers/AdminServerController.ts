import { Request, Response } from 'express';
import { 
  GetAllServersAdminUseCase, 
  CreateServerUseCase, 
  UpdateServerUseCase, 
  DeleteServerUseCase 
} from '../../application/usecases/AdminServerUseCases';
import { ServerEntity } from '../../domain/entities/ServerEntity';
import crypto from 'crypto';

export class AdminServerController {
  constructor(
    private getAllUseCase: GetAllServersAdminUseCase,
    private createUseCase: CreateServerUseCase,
    private updateUseCase: UpdateServerUseCase,
    private deleteUseCase: DeleteServerUseCase
  ) {}

  public getAllServers = async (req: Request, res: Response): Promise<void> => {
    try {
      const servers = await this.getAllUseCase.execute();
      res.status(200).json({ success: true, data: servers });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  public createServer = async (req: Request, res: Response): Promise<void> => {
    try {
      const serverData: ServerEntity = req.body;
      if (!serverData.id) {
        serverData.id = crypto.randomUUID();
      }
      await this.createUseCase.execute(serverData);
      res.status(201).json({ success: true, message: 'Server created successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  public updateServer = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;
      const serverData = req.body;
      await this.updateUseCase.execute(id, serverData);
      res.status(200).json({ success: true, message: 'Server updated successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  public deleteServer = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;
      await this.deleteUseCase.execute(id);
      res.status(200).json({ success: true, message: 'Server deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
}
