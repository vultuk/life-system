import { eq, and, desc, count, SQL, ilike, or, arrayContains } from "drizzle-orm";
import { db, notes, type Note, type NewNote } from "@life/db";
import { NotFoundError, ForbiddenError } from "@life/shared";
import type {
  CreateNoteInput,
  UpdateNoteInput,
  NoteQueryInput,
} from "../schemas/notes";

export interface NotesListResult {
  items: Note[];
  total: number;
  page: number;
  limit: number;
}

export async function listNotes(
  userId: string,
  query: NoteQueryInput
): Promise<NotesListResult> {
  const { search, tag, page, limit } = query;
  const offset = (page - 1) * limit;

  const conditions: SQL[] = [eq(notes.userId, userId)];

  if (search) {
    conditions.push(
      or(
        ilike(notes.title, `%${search}%`),
        ilike(notes.content, `%${search}%`)
      ) ?? eq(notes.userId, userId)
    );
  }

  if (tag) {
    conditions.push(arrayContains(notes.tags, [tag]));
  }

  const whereClause = and(...conditions);

  const [items, [countResult]] = await Promise.all([
    db
      .select()
      .from(notes)
      .where(whereClause)
      .orderBy(desc(notes.updatedAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: count() })
      .from(notes)
      .where(whereClause),
  ]);

  return {
    items,
    total: countResult?.count ?? 0,
    page,
    limit,
  };
}

export async function getNoteById(
  userId: string,
  noteId: string
): Promise<Note> {
  const [note] = await db
    .select()
    .from(notes)
    .where(eq(notes.id, noteId))
    .limit(1);

  if (!note) {
    throw new NotFoundError("Note not found");
  }

  if (note.userId !== userId) {
    throw new ForbiddenError("Access denied");
  }

  return note;
}

export async function createNote(
  userId: string,
  input: CreateNoteInput
): Promise<Note> {
  const newNote: NewNote = {
    userId,
    title: input.title,
    content: input.content,
    tags: input.tags,
  };

  const [note] = await db.insert(notes).values(newNote).returning();

  if (!note) {
    throw new Error("Failed to create note");
  }

  return note;
}

export async function updateNote(
  userId: string,
  noteId: string,
  input: UpdateNoteInput
): Promise<Note> {
  // First verify ownership
  await getNoteById(userId, noteId);

  const updates: Partial<NewNote> = {};

  if (input.title !== undefined) {
    updates.title = input.title;
  }

  if (input.content !== undefined) {
    updates.content = input.content;
  }

  if (input.tags !== undefined) {
    updates.tags = input.tags;
  }

  const [note] = await db
    .update(notes)
    .set(updates)
    .where(eq(notes.id, noteId))
    .returning();

  if (!note) {
    throw new Error("Failed to update note");
  }

  return note;
}

export async function deleteNote(
  userId: string,
  noteId: string
): Promise<void> {
  // First verify ownership
  await getNoteById(userId, noteId);

  await db.delete(notes).where(eq(notes.id, noteId));
}
