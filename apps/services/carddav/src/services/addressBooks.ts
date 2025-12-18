import { eq, and } from "drizzle-orm";
import { db, categories, type Category } from "@life/db";
import { type XMLAddressBook } from "@life/shared";

/**
 * Get all address books (categories) for a user
 */
export async function getAddressBooks(userId: string): Promise<Category[]> {
  return db
    .select()
    .from(categories)
    .where(eq(categories.userId, userId));
}

/**
 * Get a single address book (category) by ID
 */
export async function getAddressBookById(
  userId: string,
  categoryId: string
): Promise<Category | null> {
  const [category] = await db
    .select()
    .from(categories)
    .where(
      and(
        eq(categories.id, categoryId),
        eq(categories.userId, userId)
      )
    )
    .limit(1);

  return category || null;
}

/**
 * Update the sync token for an address book
 */
export async function updateSyncToken(
  categoryId: string,
  syncToken: string
): Promise<void> {
  await db
    .update(categories)
    .set({ syncToken })
    .where(eq(categories.id, categoryId));
}

/**
 * Convert a Category to XMLAddressBook format
 */
export function toXMLAddressBook(category: Category): XMLAddressBook {
  return {
    id: category.id,
    name: category.name,
    description: undefined,
    color: category.color || undefined,
    syncToken: category.syncToken || undefined,
  };
}

/**
 * Ensure a default address book exists for the user
 * Creates one called "Contacts" if none exist
 */
export async function ensureDefaultAddressBook(userId: string): Promise<Category> {
  const existing = await getAddressBooks(userId);

  if (existing.length > 0) {
    return existing[0];
  }

  // Create a default address book
  const [category] = await db
    .insert(categories)
    .values({
      userId,
      name: "Contacts",
      color: "#007AFF",
    })
    .returning();

  return category;
}
