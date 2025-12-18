import { eq, and, desc, count, SQL, ilike, or } from "drizzle-orm";
import { db, categories, type Category, type NewCategory } from "@life/db";
import { NotFoundError, ForbiddenError } from "@life/shared";
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
  CategoryQueryInput,
} from "../schemas/categories";

export interface CategoriesListResult {
  items: Category[];
  total: number;
  page: number;
  limit: number;
}

export async function listCategories(
  userId: string,
  query: CategoryQueryInput
): Promise<CategoriesListResult> {
  const { search, page, limit } = query;
  const offset = (page - 1) * limit;

  const conditions: SQL[] = [eq(categories.userId, userId)];

  if (search) {
    conditions.push(
      or(ilike(categories.name, `%${search}%`)) ?? eq(categories.userId, userId)
    );
  }

  const whereClause = and(...conditions);

  const [items, [countResult]] = await Promise.all([
    db
      .select()
      .from(categories)
      .where(whereClause)
      .orderBy(desc(categories.name))
      .limit(limit)
      .offset(offset),
    db.select({ count: count() }).from(categories).where(whereClause),
  ]);

  return {
    items,
    total: countResult?.count ?? 0,
    page,
    limit,
  };
}

export async function getCategoryById(
  userId: string,
  categoryId: string
): Promise<Category> {
  const [category] = await db
    .select()
    .from(categories)
    .where(eq(categories.id, categoryId))
    .limit(1);

  if (!category) {
    throw new NotFoundError("Category not found");
  }

  if (category.userId !== userId) {
    throw new ForbiddenError("Access denied");
  }

  return category;
}

export async function createCategory(
  userId: string,
  input: CreateCategoryInput
): Promise<Category> {
  const newCategory: NewCategory = {
    userId,
    name: input.name,
    color: input.color,
    icon: input.icon,
  };

  const [category] = await db.insert(categories).values(newCategory).returning();

  if (!category) {
    throw new Error("Failed to create category");
  }

  return category;
}

export async function updateCategory(
  userId: string,
  categoryId: string,
  input: UpdateCategoryInput
): Promise<Category> {
  // First verify ownership
  await getCategoryById(userId, categoryId);

  const updates: Partial<NewCategory> = {};

  if (input.name !== undefined) {
    updates.name = input.name;
  }

  if (input.color !== undefined) {
    updates.color = input.color;
  }

  if (input.icon !== undefined) {
    updates.icon = input.icon;
  }

  const [category] = await db
    .update(categories)
    .set(updates)
    .where(eq(categories.id, categoryId))
    .returning();

  if (!category) {
    throw new Error("Failed to update category");
  }

  return category;
}

export async function deleteCategory(
  userId: string,
  categoryId: string
): Promise<void> {
  // First verify ownership
  await getCategoryById(userId, categoryId);

  await db.delete(categories).where(eq(categories.id, categoryId));
}
