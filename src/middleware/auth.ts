import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { ApiError } from '../types/index';

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const error: ApiError = {
        statusCode: 401,
        message: 'Access denied. No token provided.',
      };
      res.status(401).json(error);
      return;
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);

    if (!payload) {
      const error: ApiError = {
        statusCode: 401,
        message: 'Invalid or expired token.',
      };
      res.status(401).json(error);
      return;
    }

    // Attach user info to request
    (req as any).user = {
      userId: payload.userId,
      username: payload.username,
      email: payload.email,
    };

    next();
  } catch (error) {
    const err = error as ApiError;
    res.status(err.statusCode || 500).json({
      message: err.message || 'Authentication failed.',
    });
  }
}

/**
 * Optional authentication middleware
 * Attaches user if token is present, but doesn't require it
 */
export function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const payload = verifyToken(token);
      
      if (payload) {
        (req as any).user = {
          userId: payload.userId,
          username: payload.username,
          email: payload.email,
        };
      }
    }
    
    next();
  } catch {
    next();
  }
}
