import { eq, and, desc, count, SQL } from "drizzle-orm";
import { db, tasks, type Task, type NewTask } from "@life/db";
import { NotFoundError, ForbiddenError } from "@life/shared";
import type {
  CreateTaskInput,
  UpdateTaskInput,
  TaskQueryInput,
} from "../schemas/tasks";

export interface TasksListResult {
  items: Task[];
  total: number;
  page: number;
  limit: number;
}

export async function listTasks(
  userId: string,
  query: TaskQueryInput
): Promise<TasksListResult> {
  const { status, priority, page, limit } = query;
  const offset = (page - 1) * limit;

  const conditions: SQL[] = [eq(tasks.userId, userId)];

  if (status) {
    conditions.push(eq(tasks.status, status));
  }

  if (priority) {
    conditions.push(eq(tasks.priority, priority));
  }

  const whereClause = and(...conditions);

  const [items, [countResult]] = await Promise.all([
    db
      .select()
      .from(tasks)
      .where(whereClause)
      .orderBy(desc(tasks.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: count() })
      .from(tasks)
      .where(whereClause),
  ]);

  return {
    items,
    total: countResult?.count ?? 0,
    page,
    limit,
  };
}

export async function getTaskById(
  userId: string,
  taskId: string
): Promise<Task> {
  const [task] = await db
    .select()
    .from(tasks)
    .where(eq(tasks.id, taskId))
    .limit(1);

  if (!task) {
    throw new NotFoundError("Task not found");
  }

  if (task.userId !== userId) {
    throw new ForbiddenError("Access denied");
  }

  return task;
}

export async function createTask(
  userId: string,
  input: CreateTaskInput
): Promise<Task> {
  const newTask: NewTask = {
    userId,
    title: input.title,
    description: input.description,
    priority: input.priority,
    dueDate: input.dueDate ? new Date(input.dueDate) : null,
  };

  const [task] = await db.insert(tasks).values(newTask).returning();

  if (!task) {
    throw new Error("Failed to create task");
  }

  return task;
}

export async function updateTask(
  userId: string,
  taskId: string,
  input: UpdateTaskInput
): Promise<Task> {
  // First verify ownership
  const existing = await getTaskById(userId, taskId);

  const updates: Partial<NewTask> = {};

  if (input.title !== undefined) {
    updates.title = input.title;
  }

  if (input.description !== undefined) {
    updates.description = input.description;
  }

  if (input.status !== undefined) {
    updates.status = input.status;
    // Set completedAt when status changes to done
    if (input.status === "done" && existing.status !== "done") {
      updates.completedAt = new Date();
    } else if (input.status !== "done") {
      updates.completedAt = null;
    }
  }

  if (input.priority !== undefined) {
    updates.priority = input.priority;
  }

  if (input.dueDate !== undefined) {
    updates.dueDate = input.dueDate ? new Date(input.dueDate) : null;
  }

  const [task] = await db
    .update(tasks)
    .set(updates)
    .where(eq(tasks.id, taskId))
    .returning();

  if (!task) {
    throw new Error("Failed to update task");
  }

  return task;
}

export async function deleteTask(
  userId: string,
  taskId: string
): Promise<void> {
  // First verify ownership
  await getTaskById(userId, taskId);

  await db.delete(tasks).where(eq(tasks.id, taskId));
}
