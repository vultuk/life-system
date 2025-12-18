import { pgTable, uuid, primaryKey, index, timestamp } from "drizzle-orm/pg-core";
import { contactGroups } from "./contact-groups";
import { carddavContacts } from "./carddav-contacts";

/**
 * Junction table for contact group membership
 * Links contacts to groups for CardDAV group sync
 */
export const contactGroupMembers = pgTable(
  "contact_group_members",
  {
    groupId: uuid("group_id")
      .notNull()
      .references(() => contactGroups.id, { onDelete: "cascade" }),
    contactId: uuid("contact_id")
      .notNull()
      .references(() => carddavContacts.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.groupId, table.contactId] }),
    groupIdIdx: index("contact_group_members_group_id_idx").on(table.groupId),
    contactIdIdx: index("contact_group_members_contact_id_idx").on(
      table.contactId
    ),
  })
);

export type ContactGroupMember = typeof contactGroupMembers.$inferSelect;
export type NewContactGroupMember = typeof contactGroupMembers.$inferInsert;
