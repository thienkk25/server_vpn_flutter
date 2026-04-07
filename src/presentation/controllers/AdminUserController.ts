import { Request, Response } from 'express';
import { AdminUserUseCases } from '../../application/usecases/AdminUserUseCases';

export class AdminUserController {
  constructor(private userUseCases: AdminUserUseCases) {}

  public getAllUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      const users = await this.userUseCases.getAllUsers();
      res.status(200).json({ success: true, data: users });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  public deleteUser = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.userUseCases.deleteUser(req.params.id as string);
      res.status(200).json({ success: true, message: 'User deleted' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
}
