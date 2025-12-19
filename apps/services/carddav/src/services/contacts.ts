import { eq, and, gte, inArray } from "drizzle-orm";
import {
  db,
  contacts,
  contactTombstones,
  type Contact,
  type NewContact,
} from "@life/db";
import {
  VCardGenerator,
  VCardContactInput,
  type XMLContact,
} from "@life/shared";

/**
 * Get all contacts for a user in a specific address book (category)
 */
export async function getContactsByCategory(
  userId: string,
  categoryId: string
): Promise<Contact[]> {
  return db
    .select()
    .from(contacts)
    .where(
      and(
        eq(contacts.userId, userId),
        eq(contacts.categoryId, categoryId)
      )
    );
}

/**
 * Get all contacts for a user (across all address books)
 */
export async function getAllContacts(userId: string): Promise<Contact[]> {
  return db
    .select()
    .from(contacts)
    .where(eq(contacts.userId, userId));
}

/**
 * Get a single contact by ID
 */
export async function getContactById(
  userId: string,
  contactId: string
): Promise<Contact | null> {
  const [contact] = await db
    .select()
    .from(contacts)
    .where(
      and(
        eq(contacts.id, contactId),
        eq(contacts.userId, userId)
      )
    )
    .limit(1);

  return contact || null;
}

/**
 * Get multiple contacts by IDs
 */
export async function getContactsByIds(
  userId: string,
  contactIds: string[]
): Promise<Contact[]> {
  if (contactIds.length === 0) return [];

  return db
    .select()
    .from(contacts)
    .where(
      and(
        eq(contacts.userId, userId),
        inArray(contacts.id, contactIds)
      )
    );
}

/**
 * Get contacts modified since a given timestamp
 */
export async function getContactsModifiedSince(
  userId: string,
  categoryId: string,
  since: Date
): Promise<Contact[]> {
  return db
    .select()
    .from(contacts)
    .where(
      and(
        eq(contacts.userId, userId),
        eq(contacts.categoryId, categoryId),
        gte(contacts.updatedAt, since)
      )
    );
}

/**
 * Create a contact from vCard data
 */
export async function createContactFromVCard(
  userId: string,
  categoryId: string,
  vcardData: string,
  contactId?: string
): Promise<Contact> {
  const parsed = VCardGenerator.parse(vcardData);
  const etag = VCardGenerator.generateEtag(vcardData);

  // Compute display name for the legacy 'name' field
  const displayName = parsed.displayName ||
    [parsed.givenName, parsed.familyName].filter(Boolean).join(" ") ||
    "Unknown";

  const newContact: NewContact = {
    id: contactId,
    userId,
    categoryId,
    // Legacy fields
    name: displayName,
    email: parsed.emails?.[0]?.value || null,
    phone: parsed.phoneNumbers?.[0]?.value || null,
    notes: parsed.notes || null,
    // Full vCard data
    vcardData,
    etag,
    // Extended fields
    displayName: parsed.displayName || null,
    givenName: parsed.givenName || null,
    familyName: parsed.familyName || null,
    nickname: parsed.nickname || null,
    organization: parsed.organization || null,
    jobTitle: parsed.jobTitle || null,
    birthday: parsed.birthday || null,
    emails: parsed.emails ? JSON.stringify(parsed.emails) : null,
    phoneNumbers: parsed.phoneNumbers ? JSON.stringify(parsed.phoneNumbers) : null,
    addresses: parsed.addresses ? JSON.stringify(parsed.addresses) : null,
    urls: parsed.urls ? JSON.stringify(parsed.urls) : null,
    photoData: parsed.photoData || null,
    photoMediaType: parsed.photoMediaType || null,
  };

  const [contact] = await db
    .insert(contacts)
    .values(newContact)
    .returning();

  return contact;
}

/**
 * Update a contact from vCard data
 */
export async function updateContactFromVCard(
  userId: string,
  contactId: string,
  vcardData: string
): Promise<Contact | null> {
  const existing = await getContactById(userId, contactId);
  if (!existing) return null;

  const parsed = VCardGenerator.parse(vcardData);
  const etag = VCardGenerator.generateEtag(vcardData);

  // Compute display name for the legacy 'name' field
  const displayName = parsed.displayName ||
    [parsed.givenName, parsed.familyName].filter(Boolean).join(" ") ||
    existing.name;

  const [contact] = await db
    .update(contacts)
    .set({
      // Legacy fields
      name: displayName,
      email: parsed.emails?.[0]?.value || null,
      phone: parsed.phoneNumbers?.[0]?.value || null,
      notes: parsed.notes || null,
      // Full vCard data
      vcardData,
      etag,
      // Extended fields
      displayName: parsed.displayName || null,
      givenName: parsed.givenName || null,
      familyName: parsed.familyName || null,
      nickname: parsed.nickname || null,
      organization: parsed.organization || null,
      jobTitle: parsed.jobTitle || null,
      birthday: parsed.birthday || null,
      emails: parsed.emails ? JSON.stringify(parsed.emails) : null,
      phoneNumbers: parsed.phoneNumbers ? JSON.stringify(parsed.phoneNumbers) : null,
      addresses: parsed.addresses ? JSON.stringify(parsed.addresses) : null,
      urls: parsed.urls ? JSON.stringify(parsed.urls) : null,
      photoData: parsed.photoData || null,
      photoMediaType: parsed.photoMediaType || null,
    })
    .where(eq(contacts.id, contactId))
    .returning();

  return contact;
}

/**
 * Delete a contact and create a tombstone
 */
export async function deleteContact(
  userId: string,
  contactId: string
): Promise<boolean> {
  const existing = await getContactById(userId, contactId);
  if (!existing) return false;

  // Create tombstone for sync tracking
  await db.insert(contactTombstones).values({
    id: contactId,
    userId,
    categoryId: existing.categoryId,
    resourceType: "contact",
  });

  // Delete the contact
  await db.delete(contacts).where(eq(contacts.id, contactId));

  return true;
}

/**
 * Get deleted contact IDs since a given timestamp
 */
export async function getDeletedContactIdsSince(
  userId: string,
  categoryId: string,
  since: Date
): Promise<string[]> {
  const tombstones = await db
    .select({ id: contactTombstones.id })
    .from(contactTombstones)
    .where(
      and(
        eq(contactTombstones.userId, userId),
        eq(contactTombstones.categoryId, categoryId),
        eq(contactTombstones.resourceType, "contact"),
        gte(contactTombstones.deletedAt, since)
      )
    );

  return tombstones.map((t) => t.id);
}

/**
 * Convert a Contact to XMLContact format for XML responses
 * Generates vCard on-the-fly for legacy contacts without vCard data
 */
export function toXMLContact(contact: Contact): XMLContact {
  let vcardData = contact.vcardData;
  let etag = contact.etag;

  // Generate vCard on-the-fly for legacy contacts without vCard data
  if (!vcardData) {
    const vcardInput: VCardContactInput = {
      id: contact.id,
      displayName: contact.displayName || contact.name,
      givenName: contact.givenName || undefined,
      familyName: contact.familyName || undefined,
      nickname: contact.nickname || undefined,
      organization: contact.organization || undefined,
      jobTitle: contact.jobTitle || undefined,
      birthday: contact.birthday || undefined,
      notes: contact.notes || undefined,
      emails: contact.emails
        ? JSON.parse(contact.emails)
        : contact.email
          ? [{ type: "HOME", value: contact.email }]
          : undefined,
      phoneNumbers: contact.phoneNumbers
        ? JSON.parse(contact.phoneNumbers)
        : contact.phone
          ? [{ type: "CELL", value: contact.phone }]
          : undefined,
      addresses: contact.addresses ? JSON.parse(contact.addresses) : undefined,
      urls: contact.urls ? JSON.parse(contact.urls) : undefined,
      photoData: contact.photoData || undefined,
      photoMediaType: contact.photoMediaType || undefined,
    };

    vcardData = VCardGenerator.generate(vcardInput, "3.0");
    etag = VCardGenerator.generateEtag(vcardData);
  }

  return {
    id: contact.id,
    etag: etag || VCardGenerator.generateEtag(vcardData),
    vcardData,
    updatedAt: contact.updatedAt.toISOString(),
    createdAt: contact.createdAt.toISOString(),
  };
}
