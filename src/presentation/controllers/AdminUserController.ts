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

  public createUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.userUseCases.createUser(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  public updateUser = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.userUseCases.updateUser(req.params.id as string, req.body);
      res.status(200).json({ success: true, message: 'User updated successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
}
