import { jwtVerify } from "jose";
import { AsyncLocalStorage } from "async_hooks";

export interface UserContext {
  userId: string;
  email: string;
  token: string; // Original JWT token for forwarding to gateway
}

// Async local storage for per-request user context
const userContextStorage = new AsyncLocalStorage<UserContext>();

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }
  return new TextEncoder().encode(secret);
};

/**
 * Verify a JWT token and extract the user context
 */
export async function verifyToken(token: string): Promise<UserContext> {
  const secret = getJwtSecret();
  const { payload } = await jwtVerify(token, secret);

  return {
    userId: payload.userId as string,
    email: payload.email as string,
    token, // Store original token for forwarding to gateway
  };
}

/**
 * Set the user context for the current async context
 */
export function setUserContext(context: UserContext): void {
  userContextStorage.enterWith(context);
}

/**
 * Get the user context from the current async context
 */
export function getUserContext(): UserContext | undefined {
  return userContextStorage.getStore();
}

/**
 * Run a function with a specific user context
 */
export function runWithUserContext<T>(context: UserContext, fn: () => T): T {
  return userContextStorage.run(context, fn);
}
