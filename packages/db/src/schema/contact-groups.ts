import { pgTable, text, timestamp, uuid, index } from "drizzle-orm/pg-core";
import { users } from "./users";
import { categories } from "./categories";

/**
 * Contact groups table - stores KIND:group vCards for CardDAV
 * Groups are collections of contacts that can be synced via CardDAV
 */
export const contactGroups = pgTable(
  "contact_groups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),

    // Group metadata
    displayName: text("display_name").notNull(),
    description: text("description"),

    // Full vCard data for the group (KIND:group)
    vcardData: text("vcard_data").notNull(),
    etag: text("etag").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    userIdIdx: index("contact_groups_user_id_idx").on(table.userId),
    categoryIdIdx: index("contact_groups_category_id_idx").on(table.categoryId),
    updatedAtIdx: index("contact_groups_updated_at_idx").on(table.updatedAt),
  })
);

export type ContactGroup = typeof contactGroups.$inferSelect;
export type NewContactGroup = typeof contactGroups.$inferInsert;
