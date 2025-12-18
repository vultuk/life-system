import { eq, and, gte, inArray } from "drizzle-orm";
import {
  db,
  contactGroups,
  contactGroupMembers,
  contactTombstones,
  type ContactGroup,
  type NewContactGroup,
} from "@life/db";
import {
  VCardGenerator,
  type XMLContactGroup,
} from "@life/shared";

/**
 * Get all groups for a user in a specific address book (category)
 */
export async function getGroupsByCategory(
  userId: string,
  categoryId: string
): Promise<ContactGroup[]> {
  return db
    .select()
    .from(contactGroups)
    .where(
      and(
        eq(contactGroups.userId, userId),
        eq(contactGroups.categoryId, categoryId)
      )
    );
}

/**
 * Get a single group by ID
 */
export async function getGroupById(
  userId: string,
  groupId: string
): Promise<ContactGroup | null> {
  const [group] = await db
    .select()
    .from(contactGroups)
    .where(
      and(
        eq(contactGroups.id, groupId),
        eq(contactGroups.userId, userId)
      )
    )
    .limit(1);

  return group || null;
}

/**
 * Get multiple groups by IDs
 */
export async function getGroupsByIds(
  userId: string,
  groupIds: string[]
): Promise<ContactGroup[]> {
  if (groupIds.length === 0) return [];

  return db
    .select()
    .from(contactGroups)
    .where(
      and(
        eq(contactGroups.userId, userId),
        inArray(contactGroups.id, groupIds)
      )
    );
}

/**
 * Get groups modified since a given timestamp
 */
export async function getGroupsModifiedSince(
  userId: string,
  categoryId: string,
  since: Date
): Promise<ContactGroup[]> {
  return db
    .select()
    .from(contactGroups)
    .where(
      and(
        eq(contactGroups.userId, userId),
        eq(contactGroups.categoryId, categoryId),
        gte(contactGroups.updatedAt, since)
      )
    );
}

/**
 * Get member IDs for a group
 */
export async function getGroupMemberIds(groupId: string): Promise<string[]> {
  const members = await db
    .select({ contactId: contactGroupMembers.contactId })
    .from(contactGroupMembers)
    .where(eq(contactGroupMembers.groupId, groupId));

  return members.map((m) => m.contactId);
}

/**
 * Create a group from vCard data
 */
export async function createGroupFromVCard(
  userId: string,
  categoryId: string,
  vcardData: string,
  groupId?: string
): Promise<ContactGroup> {
  const parsed = VCardGenerator.parseGroupVCard(vcardData);
  if (!parsed) {
    throw new Error("Invalid group vCard");
  }

  const etag = VCardGenerator.generateEtag(vcardData);

  const newGroup: NewContactGroup = {
    id: groupId,
    userId,
    categoryId,
    displayName: parsed.displayName,
    description: parsed.description,
    vcardData,
    etag,
  };

  const [group] = await db
    .insert(contactGroups)
    .values(newGroup)
    .returning();

  // Add members if any
  if (parsed.memberIds.length > 0) {
    await db.insert(contactGroupMembers).values(
      parsed.memberIds.map((contactId) => ({
        groupId: group.id,
        contactId,
      }))
    );
  }

  return group;
}

/**
 * Update a group from vCard data
 */
export async function updateGroupFromVCard(
  userId: string,
  groupId: string,
  vcardData: string
): Promise<ContactGroup | null> {
  const existing = await getGroupById(userId, groupId);
  if (!existing) return null;

  const parsed = VCardGenerator.parseGroupVCard(vcardData);
  if (!parsed) {
    throw new Error("Invalid group vCard");
  }

  const etag = VCardGenerator.generateEtag(vcardData);

  const [group] = await db
    .update(contactGroups)
    .set({
      displayName: parsed.displayName,
      description: parsed.description,
      vcardData,
      etag,
    })
    .where(eq(contactGroups.id, groupId))
    .returning();

  // Update members - delete old and insert new
  await db.delete(contactGroupMembers).where(eq(contactGroupMembers.groupId, groupId));

  if (parsed.memberIds.length > 0) {
    await db.insert(contactGroupMembers).values(
      parsed.memberIds.map((contactId) => ({
        groupId,
        contactId,
      }))
    );
  }

  return group;
}

/**
 * Delete a group and create a tombstone
 */
export async function deleteGroup(
  userId: string,
  groupId: string
): Promise<boolean> {
  const existing = await getGroupById(userId, groupId);
  if (!existing) return false;

  // Create tombstone for sync tracking
  await db.insert(contactTombstones).values({
    id: groupId,
    userId,
    categoryId: existing.categoryId,
    resourceType: "group",
  });

  // Delete group members (cascade should handle this, but explicit is safer)
  await db.delete(contactGroupMembers).where(eq(contactGroupMembers.groupId, groupId));

  // Delete the group
  await db.delete(contactGroups).where(eq(contactGroups.id, groupId));

  return true;
}

/**
 * Get deleted group IDs since a given timestamp
 */
export async function getDeletedGroupIdsSince(
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
        eq(contactTombstones.resourceType, "group"),
        gte(contactTombstones.deletedAt, since)
      )
    );

  return tombstones.map((t) => t.id);
}

/**
 * Convert a ContactGroup to XMLContactGroup format for XML responses
 */
export function toXMLContactGroup(group: ContactGroup): XMLContactGroup {
  return {
    id: group.id,
    etag: group.etag,
    vcardData: group.vcardData,
    updatedAt: group.updatedAt.toISOString(),
    createdAt: group.createdAt.toISOString(),
  };
}
