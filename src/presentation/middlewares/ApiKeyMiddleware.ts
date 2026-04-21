import { Request, Response, NextFunction } from 'express';

export const apiKeyMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const apiKey = req.headers['x-api-key'];
  const serverApiKey = process.env.API_KEY || 'NMH_VPN_SECRET_KEY';

  if (!apiKey || apiKey !== serverApiKey) {
    res.status(401).json({ success: false, message: 'Unauthorized. Invalid API Key.' });
    return;
  }

  next();
};
