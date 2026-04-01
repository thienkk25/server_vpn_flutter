import { Request, Response } from 'express';
import { GetServersUseCase } from '../../application/usecases/GetServersUseCase';
import { SeedDummyDataUseCase } from '../../application/usecases/SeedDummyDataUseCase';
import { dummyVpnServers } from '../../infrastructure/data/dummyData';

export class ServerController {
  constructor(
    private getServersUseCase: GetServersUseCase,
    private seedDummyDataUseCase: SeedDummyDataUseCase
  ) {}

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

  public seedServers = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.seedDummyDataUseCase.execute(dummyVpnServers);
      res.status(200).json({
        success: true,
        message: 'Successfully seeded VPN servers.',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  };
}
