import jwt from 'jsonwebtoken';

const JWT_SECRET: string = process.env.JWT_SECRET || 'your_jwt_secret_key_here_change_this_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export type UserRole = 'super_admin' | 'agency' | 'owner' | 'manager' | 'tenant' | 'maintenance' | 'agent';

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as any);
};

export const verifyToken = (token: string): JWTPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
};
