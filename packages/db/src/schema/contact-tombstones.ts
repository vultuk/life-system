import { pgTable, text, timestamp, uuid, index } from "drizzle-orm/pg-core";
import { users } from "./users";
import { categories } from "./categories";

/**
 * Contact tombstones table - tracks deleted contacts/groups for CardDAV sync
 * Allows clients to detect deletions during sync-collection operations
 */
export const contactTombstones = pgTable(
  "contact_tombstones",
  {
    // The ID of the deleted resource (contact or group)
    id: uuid("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),

    // Type of deleted resource
    resourceType: text("resource_type").notNull().default("contact"), // 'contact' or 'group'

    deletedAt: timestamp("deleted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userIdIdx: index("contact_tombstones_user_id_idx").on(table.userId),
    categoryIdIdx: index("contact_tombstones_category_id_idx").on(
      table.categoryId
    ),
    deletedAtIdx: index("contact_tombstones_deleted_at_idx").on(
      table.deletedAt
    ),
    resourceTypeIdx: index("contact_tombstones_resource_type_idx").on(
      table.resourceType
    ),
  })
);

export type ContactTombstone = typeof contactTombstones.$inferSelect;
export type NewContactTombstone = typeof contactTombstones.$inferInsert;
