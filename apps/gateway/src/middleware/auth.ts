import type { Context, Next } from "hono";
import { jwtVerify, SignJWT } from "jose";
import type { UserContext } from "@life/shared";
import { UnauthorizedError } from "@life/shared";

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }
  return new TextEncoder().encode(secret);
};

export interface JwtPayload {
  userId: string;
  email: string;
}

export async function createToken(payload: JwtPayload): Promise<string> {
  const secret = getJwtSecret();
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
  return token;
}

export async function verifyToken(token: string): Promise<JwtPayload> {
  const secret = getJwtSecret();
  const { payload } = await jwtVerify(token, secret);
  return {
    userId: payload.userId as string,
    email: payload.email as string,
  };
}

type AuthEnv = {
  Variables: {
    user: UserContext;
  };
};

export function authMiddleware() {
  return async (c: Context<AuthEnv>, next: Next) => {
    const authHeader = c.req.header("Authorization");

    if (!authHeader) {
      throw new UnauthorizedError("Missing Authorization header");
    }

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      throw new UnauthorizedError("Invalid Authorization header format");
    }

    const token = parts[1];
    if (!token) {
      throw new UnauthorizedError("Missing token");
    }

    try {
      const payload = await verifyToken(token);
      c.set("user", {
        userId: payload.userId,
        email: payload.email,
      });
      await next();
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        throw error;
      }
      throw new UnauthorizedError("Invalid or expired token");
    }
  };
}

export function getUser(c: Context<AuthEnv>): UserContext {
  const user = c.get("user");
  if (!user) {
    throw new UnauthorizedError("User not found in context");
  }
  return user;
}
