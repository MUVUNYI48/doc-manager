import { NextRequest } from 'next/server';
import { verifyToken, User } from './auth';

export const authenticate = (request: NextRequest): User | null => {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;
  
  return verifyToken(token);
};

export const requireAuth = (request: NextRequest) => {
  const user = authenticate(request);
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
};

export const requireRole = (request: NextRequest, roles: string[]) => {
  const user = requireAuth(request);
  if (!roles.includes(user.role)) {
    throw new Error('Forbidden');
  }
  return user;
};