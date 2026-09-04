export interface AuthUser {
  id: bigint;
  username: string;
  roles: string[];
  status: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}