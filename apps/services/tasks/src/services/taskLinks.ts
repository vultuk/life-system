import { eq, and } from "drizzle-orm";
import {
  db,
  taskNoteLinks,
  taskContactLinks,
  notes,
  contacts,
  type Note,
  type Contact,
  type TaskNoteLink,
  type TaskContactLink,
} from "@life/db";
import { NotFoundError, ForbiddenError } from "@life/shared";
import { getTaskById } from "./tasks";

// Note linking functions

export async function linkNoteToTask(
  userId: string,
  taskId: string,
  noteId: string
): Promise<TaskNoteLink> {
  // Verify task ownership
  await getTaskById(userId, taskId);

  // Verify note exists and belongs to user
  const [note] = await db
    .select()
    .from(notes)
    .where(eq(notes.id, noteId))
    .limit(1);

  if (!note) {
    throw new NotFoundError("Note not found");
  }

  if (note.userId !== userId) {
    throw new ForbiddenError("Access denied to note");
  }

  // Check if link already exists
  const [existingLink] = await db
    .select()
    .from(taskNoteLinks)
    .where(
      and(eq(taskNoteLinks.taskId, taskId), eq(taskNoteLinks.noteId, noteId))
    )
    .limit(1);

  if (existingLink) {
    return existingLink;
  }

  const [link] = await db
    .insert(taskNoteLinks)
    .values({
      taskId,
      noteId,
      userId,
    })
    .returning();

  if (!link) {
    throw new Error("Failed to link note to task");
  }

  return link;
}

export async function unlinkNoteFromTask(
  userId: string,
  taskId: string,
  noteId: string
): Promise<void> {
  // Verify task ownership
  await getTaskById(userId, taskId);

  await db
    .delete(taskNoteLinks)
    .where(
      and(
        eq(taskNoteLinks.taskId, taskId),
        eq(taskNoteLinks.noteId, noteId),
        eq(taskNoteLinks.userId, userId)
      )
    );
}

export async function getTaskNotes(
  userId: string,
  taskId: string
): Promise<Note[]> {
  // Verify task ownership
  await getTaskById(userId, taskId);

  const linkedNotes = await db
    .select({
      note: notes,
    })
    .from(taskNoteLinks)
    .innerJoin(notes, eq(taskNoteLinks.noteId, notes.id))
    .where(
      and(eq(taskNoteLinks.taskId, taskId), eq(taskNoteLinks.userId, userId))
    );

  return linkedNotes.map((row) => row.note);
}

// Contact linking functions

export async function linkContactToTask(
  userId: string,
  taskId: string,
  contactId: string
): Promise<TaskContactLink> {
  // Verify task ownership
  await getTaskById(userId, taskId);

  // Verify contact exists and belongs to user
  const [contact] = await db
    .select()
    .from(contacts)
    .where(eq(contacts.id, contactId))
    .limit(1);

  if (!contact) {
    throw new NotFoundError("Contact not found");
  }

  if (contact.userId !== userId) {
    throw new ForbiddenError("Access denied to contact");
  }

  // Check if link already exists
  const [existingLink] = await db
    .select()
    .from(taskContactLinks)
    .where(
      and(
        eq(taskContactLinks.taskId, taskId),
        eq(taskContactLinks.contactId, contactId)
      )
    )
    .limit(1);

  if (existingLink) {
    return existingLink;
  }

  const [link] = await db
    .insert(taskContactLinks)
    .values({
      taskId,
      contactId,
      userId,
    })
    .returning();

  if (!link) {
    throw new Error("Failed to link contact to task");
  }

  return link;
}

export async function unlinkContactFromTask(
  userId: string,
  taskId: string,
  contactId: string
): Promise<void> {
  // Verify task ownership
  await getTaskById(userId, taskId);

  await db
    .delete(taskContactLinks)
    .where(
      and(
        eq(taskContactLinks.taskId, taskId),
        eq(taskContactLinks.contactId, contactId),
        eq(taskContactLinks.userId, userId)
      )
    );
}

export async function getTaskContacts(
  userId: string,
  taskId: string
): Promise<Contact[]> {
  // Verify task ownership
  await getTaskById(userId, taskId);

  const linkedContacts = await db
    .select({
      contact: contacts,
    })
    .from(taskContactLinks)
    .innerJoin(contacts, eq(taskContactLinks.contactId, contacts.id))
    .where(
      and(
        eq(taskContactLinks.taskId, taskId),
        eq(taskContactLinks.userId, userId)
      )
    );

  return linkedContacts.map((row) => row.contact);
}
