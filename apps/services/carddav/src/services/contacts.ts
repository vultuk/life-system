import { eq, and, gte, inArray } from "drizzle-orm";
import {
  db,
  carddavContacts,
  contactTombstones,
  categories,
  type CarddavContact,
  type NewCarddavContact,
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
): Promise<CarddavContact[]> {
  return db
    .select()
    .from(carddavContacts)
    .where(
      and(
        eq(carddavContacts.userId, userId),
        eq(carddavContacts.categoryId, categoryId)
      )
    );
}

/**
 * Get all contacts for a user (across all address books)
 */
export async function getAllContacts(userId: string): Promise<CarddavContact[]> {
  return db
    .select()
    .from(carddavContacts)
    .where(eq(carddavContacts.userId, userId));
}

/**
 * Get a single contact by ID
 */
export async function getContactById(
  userId: string,
  contactId: string
): Promise<CarddavContact | null> {
  const [contact] = await db
    .select()
    .from(carddavContacts)
    .where(
      and(
        eq(carddavContacts.id, contactId),
        eq(carddavContacts.userId, userId)
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
): Promise<CarddavContact[]> {
  if (contactIds.length === 0) return [];

  return db
    .select()
    .from(carddavContacts)
    .where(
      and(
        eq(carddavContacts.userId, userId),
        inArray(carddavContacts.id, contactIds)
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
): Promise<CarddavContact[]> {
  return db
    .select()
    .from(carddavContacts)
    .where(
      and(
        eq(carddavContacts.userId, userId),
        eq(carddavContacts.categoryId, categoryId),
        gte(carddavContacts.updatedAt, since)
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
): Promise<CarddavContact> {
  const parsed = VCardGenerator.parse(vcardData);
  const etag = VCardGenerator.generateEtag(vcardData);

  const newContact: NewCarddavContact = {
    id: contactId,
    userId,
    categoryId,
    vcardData,
    etag,
    displayName: parsed.displayName,
    givenName: parsed.givenName,
    familyName: parsed.familyName,
    primaryEmail: parsed.emails?.[0]?.value,
    primaryPhone: parsed.phoneNumbers?.[0]?.value,
    organization: parsed.organization,
    jobTitle: parsed.jobTitle,
    nickname: parsed.nickname,
    birthday: parsed.birthday,
    notes: parsed.notes,
    emails: parsed.emails ? JSON.stringify(parsed.emails) : null,
    phoneNumbers: parsed.phoneNumbers ? JSON.stringify(parsed.phoneNumbers) : null,
    addresses: parsed.addresses ? JSON.stringify(parsed.addresses) : null,
    urls: parsed.urls ? JSON.stringify(parsed.urls) : null,
    photoData: parsed.photoData,
    photoMediaType: parsed.photoMediaType,
  };

  const [contact] = await db
    .insert(carddavContacts)
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
): Promise<CarddavContact | null> {
  const existing = await getContactById(userId, contactId);
  if (!existing) return null;

  const parsed = VCardGenerator.parse(vcardData);
  const etag = VCardGenerator.generateEtag(vcardData);

  const [contact] = await db
    .update(carddavContacts)
    .set({
      vcardData,
      etag,
      displayName: parsed.displayName,
      givenName: parsed.givenName,
      familyName: parsed.familyName,
      primaryEmail: parsed.emails?.[0]?.value,
      primaryPhone: parsed.phoneNumbers?.[0]?.value,
      organization: parsed.organization,
      jobTitle: parsed.jobTitle,
      nickname: parsed.nickname,
      birthday: parsed.birthday,
      notes: parsed.notes,
      emails: parsed.emails ? JSON.stringify(parsed.emails) : null,
      phoneNumbers: parsed.phoneNumbers ? JSON.stringify(parsed.phoneNumbers) : null,
      addresses: parsed.addresses ? JSON.stringify(parsed.addresses) : null,
      urls: parsed.urls ? JSON.stringify(parsed.urls) : null,
      photoData: parsed.photoData,
      photoMediaType: parsed.photoMediaType,
    })
    .where(eq(carddavContacts.id, contactId))
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
  await db.delete(carddavContacts).where(eq(carddavContacts.id, contactId));

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
 * Convert a CarddavContact to XMLContact format for XML responses
 */
export function toXMLContact(contact: CarddavContact): XMLContact {
  return {
    id: contact.id,
    etag: contact.etag,
    vcardData: contact.vcardData,
    updatedAt: contact.updatedAt.toISOString(),
    createdAt: contact.createdAt.toISOString(),
  };
}
