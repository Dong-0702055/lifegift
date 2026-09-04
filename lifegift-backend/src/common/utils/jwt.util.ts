import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';

export interface UserPayload {
  id: number | bigint;
  username: string;
  roles: string[];
}

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

export class JwtService {
  public static generateToken(user: UserPayload): string {
    const payload = {
      sub: user.username,
      userId: user.id.toString(), // Convert BigInt/number sang string để an toàn
      roles: user.roles,
    };

    const options: SignOptions = {
      expiresIn: JWT_EXPIRES_IN as SignOptions['expiresIn'],
    };

    return jwt.sign(payload, JWT_SECRET, options);
  }

  public static verifyToken(token: string): JwtPayload | string {
    return jwt.verify(token, JWT_SECRET);
  }
}