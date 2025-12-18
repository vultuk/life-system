import type { Context, Next } from "hono";
import { ZodError, type ZodSchema } from "zod";
import { ValidationError } from "../errors";

type Env = {
  Variables: Record<string, unknown>;
};

export function validateBody<T extends ZodSchema>(schema: T) {
  return async (c: Context<Env>, next: Next) => {
    try {
      const body = await c.req.json();
      const parsed = schema.parse(body);
      c.set("validatedBody", parsed);
      await next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join(", ");
        throw new ValidationError(messages);
      }
      throw error;
    }
  };
}

export function validateQuery<T extends ZodSchema>(schema: T) {
  return async (c: Context<Env>, next: Next) => {
    try {
      const query = c.req.query();
      const parsed = schema.parse(query);
      c.set("validatedQuery", parsed);
      await next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join(", ");
        throw new ValidationError(messages);
      }
      throw error;
    }
  };
}

export function validateParams<T extends ZodSchema>(schema: T) {
  return async (c: Context<Env>, next: Next) => {
    try {
      const params = c.req.param();
      const parsed = schema.parse(params);
      c.set("validatedParams", parsed);
      await next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join(", ");
        throw new ValidationError(messages);
      }
      throw error;
    }
  };
}

export function getValidatedBody<T>(c: Context<Env>): T {
  return c.get("validatedBody") as T;
}

export function getValidatedQuery<T>(c: Context<Env>): T {
  return c.get("validatedQuery") as T;
}

export function getValidatedParams<T>(c: Context<Env>): T {
  return c.get("validatedParams") as T;
}
