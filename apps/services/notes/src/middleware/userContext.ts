import type { Context, Next } from "hono";
import type { UserContext } from "@life/shared";
import { UnauthorizedError } from "@life/shared";

type UserContextEnv = {
  Variables: {
    user: UserContext;
  };
};

export function userContextMiddleware() {
  return async (c: Context<UserContextEnv>, next: Next) => {
    const userId = c.req.header("X-User-Id");
    const email = c.req.header("X-User-Email");

    if (!userId || !email) {
      throw new UnauthorizedError("Missing user context headers");
    }

    c.set("user", { userId, email });
    await next();
  };
}

export function getUser(c: Context<UserContextEnv>): UserContext {
  const user = c.get("user");
  if (!user) {
    throw new UnauthorizedError("User not found in context");
  }
  return user;
}
