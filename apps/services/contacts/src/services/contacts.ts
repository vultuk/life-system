import { eq, and, desc, count, SQL, ilike, or } from "drizzle-orm";
import { db, contacts, type Contact, type NewContact } from "@life/db";
import { NotFoundError, ForbiddenError } from "@life/shared";
import type {
  CreateContactInput,
  UpdateContactInput,
  ContactQueryInput,
} from "../schemas/contacts";

export interface ContactsListResult {
  items: Contact[];
  total: number;
  page: number;
  limit: number;
}

export async function listContacts(
  userId: string,
  query: ContactQueryInput
): Promise<ContactsListResult> {
  const { search, page, limit } = query;
  const offset = (page - 1) * limit;

  const conditions: SQL[] = [eq(contacts.userId, userId)];

  if (search) {
    conditions.push(
      or(
        ilike(contacts.name, `%${search}%`),
        ilike(contacts.email, `%${search}%`),
        ilike(contacts.phone, `%${search}%`)
      ) ?? eq(contacts.userId, userId)
    );
  }

  const whereClause = and(...conditions);

  const [items, [countResult]] = await Promise.all([
    db
      .select()
      .from(contacts)
      .where(whereClause)
      .orderBy(desc(contacts.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: count() })
      .from(contacts)
      .where(whereClause),
  ]);

  return {
    items,
    total: countResult?.count ?? 0,
    page,
    limit,
  };
}

export async function getContactById(
  userId: string,
  contactId: string
): Promise<Contact> {
  const [contact] = await db
    .select()
    .from(contacts)
    .where(eq(contacts.id, contactId))
    .limit(1);

  if (!contact) {
    throw new NotFoundError("Contact not found");
  }

  if (contact.userId !== userId) {
    throw new ForbiddenError("Access denied");
  }

  return contact;
}

export async function createContact(
  userId: string,
  input: CreateContactInput
): Promise<Contact> {
  const newContact: NewContact = {
    userId,
    name: input.name,
    email: input.email,
    phone: input.phone,
    relationship: input.relationship,
    notes: input.notes,
  };

  const [contact] = await db.insert(contacts).values(newContact).returning();

  if (!contact) {
    throw new Error("Failed to create contact");
  }

  return contact;
}

export async function updateContact(
  userId: string,
  contactId: string,
  input: UpdateContactInput
): Promise<Contact> {
  // First verify ownership
  await getContactById(userId, contactId);

  const updates: Partial<NewContact> = {};

  if (input.name !== undefined) {
    updates.name = input.name;
  }

  if (input.email !== undefined) {
    updates.email = input.email;
  }

  if (input.phone !== undefined) {
    updates.phone = input.phone;
  }

  if (input.relationship !== undefined) {
    updates.relationship = input.relationship;
  }

  if (input.notes !== undefined) {
    updates.notes = input.notes;
  }

  const [contact] = await db
    .update(contacts)
    .set(updates)
    .where(eq(contacts.id, contactId))
    .returning();

  if (!contact) {
    throw new Error("Failed to update contact");
  }

  return contact;
}

export async function deleteContact(
  userId: string,
  contactId: string
): Promise<void> {
  // First verify ownership
  await getContactById(userId, contactId);

  await db.delete(contacts).where(eq(contacts.id, contactId));
}
