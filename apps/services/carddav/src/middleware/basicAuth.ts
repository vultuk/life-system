import { Context } from "hono";
import { db, users } from "@life/db";
import { eq } from "drizzle-orm";

/**
 * User context set by basic auth middleware
 */
export interface AuthUser {
  userId: string;
  email: string;
}

/**
 * HTTP Basic Authentication middleware for CardDAV
 * Validates credentials against the users table
 */
export function basicAuthMiddleware() {
  return async (c: Context, next: () => Promise<void>) => {
    const authHeader = c.req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Basic ")) {
      return c.text("Unauthorized", 401, {
        "WWW-Authenticate": 'Basic realm="Life System CardDAV"',
      });
    }

    try {
      const base64Credentials = authHeader.substring(6);
      const credentials = atob(base64Credentials);
      const [email, password] = credentials.split(":");

      if (!email || !password) {
        return c.text("Unauthorized", 401, {
          "WWW-Authenticate": 'Basic realm="Life System CardDAV"',
        });
      }

      // Look up user by email
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!user) {
        return c.text("Unauthorized", 401, {
          "WWW-Authenticate": 'Basic realm="Life System CardDAV"',
        });
      }

      // Verify password using Bun's built-in password verification
      const isValid = await Bun.password.verify(password, user.passwordHash);

      if (!isValid) {
        return c.text("Unauthorized", 401, {
          "WWW-Authenticate": 'Basic realm="Life System CardDAV"',
        });
      }

      // Set user context
      c.set("user", {
        userId: user.id,
        email: user.email,
      } as AuthUser);

      await next();
    } catch (error) {
      console.error("Auth error:", error);
      return c.text("Unauthorized", 401, {
        "WWW-Authenticate": 'Basic realm="Life System CardDAV"',
      });
    }
  };
}

/**
 * Get the authenticated user from the context
 */
export function getUser(c: Context): AuthUser {
  const user = c.get("user") as AuthUser | undefined;
  if (!user) {
    throw new Error("User not authenticated");
  }
  return user;
}
