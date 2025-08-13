import { SignJWT, jwtVerify } from 'jose';

const key = new TextEncoder().encode(process.env.AUTH_SECRET);

export interface JWTPayload {
  sessionId: string;
  userId: number;
  expires: string;
  [key: string]: any;
}

export async function signJWT(payload: any): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1 day from now')
    .sign(key);
}

export async function verifyJWT(token: string): Promise<JWTPayload> {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
    });
    return payload as JWTPayload;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
}

export function createAuthHeader(token: string): string {
  return `Bearer ${token}`;
}