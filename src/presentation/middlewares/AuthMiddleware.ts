import { Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';

// Extend express Request to include the user
export interface AuthenticatedRequest extends Request {
  user?: admin.auth.DecodedIdToken;
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'Unauthorized. No token provided.' });
      return;
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verify the token using Firebase Admin SDK
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    
    next();
  } catch (error: any) {
    res.status(401).json({ success: false, message: 'Unauthorized. Invalid token.' });
  }
};
