import { Hono } from "hono";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, users } from "@life/db";
import {
  createApiResponse,
  ValidationError,
  UnauthorizedError,
  ConflictError,
} from "@life/shared";
import { createToken } from "../middleware/auth";

const authRoutes = new Hono();

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

authRoutes.post("/register", async (c) => {
  const body = await c.req.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    const messages = parsed.error.errors
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join(", ");
    throw new ValidationError(messages);
  }

  const { email, password, name } = parsed.data;

  // Check if user already exists
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser.length > 0) {
    throw new ConflictError("User with this email already exists");
  }

  // Hash password using Bun's built-in hasher
  const passwordHash = await Bun.password.hash(password, {
    algorithm: "bcrypt",
    cost: 10,
  });

  // Create user
  const [newUser] = await db
    .insert(users)
    .values({
      email,
      name,
      passwordHash,
    })
    .returning({
      id: users.id,
      email: users.email,
      name: users.name,
    });

  if (!newUser) {
    throw new Error("Failed to create user");
  }

  // Generate JWT
  const token = await createToken({
    userId: newUser.id,
    email: newUser.email,
  });

  return c.json(
    createApiResponse({
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
      },
      token,
    }),
    201
  );
});

authRoutes.post("/login", async (c) => {
  const body = await c.req.json();
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    const messages = parsed.error.errors
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join(", ");
    throw new ValidationError(messages);
  }

  const { email, password } = parsed.data;

  // Find user
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    throw new UnauthorizedError("Invalid email or password");
  }

  // Verify password
  const isValid = await Bun.password.verify(password, user.passwordHash);

  if (!isValid) {
    throw new UnauthorizedError("Invalid email or password");
  }

  // Generate JWT
  const token = await createToken({
    userId: user.id,
    email: user.email,
  });

  return c.json(
    createApiResponse({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    })
  );
});

export { authRoutes };
