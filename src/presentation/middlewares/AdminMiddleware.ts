import { Request, Response, NextFunction } from 'express';

export const adminMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const adminKey = process.env.ADMIN_KEY;
  const providedKey = req.header('x-admin-key');

  if (!providedKey || providedKey !== adminKey) {
    console.error(`[AdminAuth] Failed! Provided: '${providedKey}', Expected: '${adminKey}'`);
    res.status(403).json({ success: false, message: 'Forbidden. Invalid or missing Admin API Key.' });
    return;
  }

  next();
};
