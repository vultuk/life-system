import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";

/**
 * Categories table - also serves as address books for CardDAV
 * Each category can contain contacts that sync via CardDAV
 */
export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  color: text("color"),
  icon: text("icon"),
  // CardDAV sync token for incremental sync
  syncToken: text("sync_token"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
