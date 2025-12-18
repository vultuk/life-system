import { eq, and, desc, count, SQL, gte, lte } from "drizzle-orm";
import { db, habits, habitLogs, type Habit, type NewHabit, type HabitLog, type NewHabitLog } from "@life/db";
import { NotFoundError, ForbiddenError } from "@life/shared";
import type {
  CreateHabitInput,
  UpdateHabitInput,
  HabitQueryInput,
  CreateHabitLogInput,
  HabitLogQueryInput,
} from "../schemas/habits";

export interface HabitsListResult {
  items: Habit[];
  total: number;
  page: number;
  limit: number;
}

export interface HabitLogsListResult {
  items: HabitLog[];
  total: number;
  page: number;
  limit: number;
}

export async function listHabits(
  userId: string,
  query: HabitQueryInput
): Promise<HabitsListResult> {
  const { frequency, categoryId, page, limit } = query;
  const offset = (page - 1) * limit;

  const conditions: SQL[] = [eq(habits.userId, userId)];

  if (frequency) {
    conditions.push(eq(habits.frequency, frequency));
  }

  if (categoryId) {
    conditions.push(eq(habits.categoryId, categoryId));
  }

  const whereClause = and(...conditions);

  const [items, [countResult]] = await Promise.all([
    db
      .select()
      .from(habits)
      .where(whereClause)
      .orderBy(desc(habits.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: count() })
      .from(habits)
      .where(whereClause),
  ]);

  return {
    items,
    total: countResult?.count ?? 0,
    page,
    limit,
  };
}

export async function getHabitById(
  userId: string,
  habitId: string
): Promise<Habit> {
  const [habit] = await db
    .select()
    .from(habits)
    .where(eq(habits.id, habitId))
    .limit(1);

  if (!habit) {
    throw new NotFoundError("Habit not found");
  }

  if (habit.userId !== userId) {
    throw new ForbiddenError("Access denied");
  }

  return habit;
}

export async function createHabit(
  userId: string,
  input: CreateHabitInput
): Promise<Habit> {
  const newHabit: NewHabit = {
    userId,
    name: input.name,
    description: input.description,
    frequency: input.frequency,
    targetCount: input.targetCount,
    categoryId: input.categoryId ?? null,
  };

  const [habit] = await db.insert(habits).values(newHabit).returning();

  if (!habit) {
    throw new Error("Failed to create habit");
  }

  return habit;
}

export async function updateHabit(
  userId: string,
  habitId: string,
  input: UpdateHabitInput
): Promise<Habit> {
  // First verify ownership
  await getHabitById(userId, habitId);

  const updates: Partial<NewHabit> = {};

  if (input.name !== undefined) {
    updates.name = input.name;
  }

  if (input.description !== undefined) {
    updates.description = input.description;
  }

  if (input.frequency !== undefined) {
    updates.frequency = input.frequency;
  }

  if (input.targetCount !== undefined) {
    updates.targetCount = input.targetCount;
  }

  if (input.categoryId !== undefined) {
    updates.categoryId = input.categoryId;
  }

  const [habit] = await db
    .update(habits)
    .set(updates)
    .where(eq(habits.id, habitId))
    .returning();

  if (!habit) {
    throw new Error("Failed to update habit");
  }

  return habit;
}

export async function deleteHabit(
  userId: string,
  habitId: string
): Promise<void> {
  // First verify ownership
  await getHabitById(userId, habitId);

  await db.delete(habits).where(eq(habits.id, habitId));
}

// Habit logs functions
export async function createHabitLog(
  userId: string,
  habitId: string,
  input: CreateHabitLogInput
): Promise<HabitLog> {
  // First verify habit ownership
  await getHabitById(userId, habitId);

  const newLog: NewHabitLog = {
    habitId,
    userId,
    logDate: input.logDate,
    count: input.count,
    notes: input.notes,
  };

  const [log] = await db.insert(habitLogs).values(newLog).returning();

  if (!log) {
    throw new Error("Failed to create habit log");
  }

  return log;
}

export async function listHabitLogs(
  userId: string,
  habitId: string,
  query: HabitLogQueryInput
): Promise<HabitLogsListResult> {
  // First verify habit ownership
  await getHabitById(userId, habitId);

  const { startDate, endDate, page, limit } = query;
  const offset = (page - 1) * limit;

  const conditions: SQL[] = [eq(habitLogs.habitId, habitId)];

  if (startDate) {
    conditions.push(gte(habitLogs.logDate, startDate));
  }

  if (endDate) {
    conditions.push(lte(habitLogs.logDate, endDate));
  }

  const whereClause = and(...conditions);

  const [items, [countResult]] = await Promise.all([
    db
      .select()
      .from(habitLogs)
      .where(whereClause)
      .orderBy(desc(habitLogs.logDate))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: count() })
      .from(habitLogs)
      .where(whereClause),
  ]);

  return {
    items,
    total: countResult?.count ?? 0,
    page,
    limit,
  };
}
