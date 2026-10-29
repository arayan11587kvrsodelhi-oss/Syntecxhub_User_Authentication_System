import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types/index';

const JWT_SECRET = process.env.JWT_SECRET || '';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

/**
 * Generate a JWT access token
 * @param userId - User ID
 * @param username - Username
 * @param email - User email
 * @returns JWT token string
 */
export function generateToken(userId: string, username: string, email: string): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (jwt.sign({ userId, username, email }, JWT_SECRET as any) as string);
}

/**
 * Verify and decode a JWT token
 * @param token - JWT token string
 * @returns decoded payload or null if invalid
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded;
  } catch {
    return null;
  }
}
