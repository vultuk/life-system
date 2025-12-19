import { pgTable, text, timestamp, uuid, index } from "drizzle-orm/pg-core";
import { users } from "./users";
import { categories } from "./categories";

/**
 * Contacts table - unified schema for both API and CardDAV access
 * Supports full vCard data for CardDAV sync while maintaining backward compatibility
 */
export const contacts = pgTable(
  "contacts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),

    // Legacy fields (kept for backward compatibility)
    name: text("name").notNull(),
    email: text("email"),
    phone: text("phone"),
    relationship: text("relationship"),
    notes: text("notes"),

    // Full vCard storage for round-trip fidelity
    vcardData: text("vcard_data"),
    etag: text("etag"),

    // Structured name fields (parsed from vCard or set directly)
    displayName: text("display_name"),
    givenName: text("given_name"),
    familyName: text("family_name"),
    nickname: text("nickname"),

    // Professional fields
    organization: text("organization"),
    jobTitle: text("job_title"),

    // Additional contact info
    birthday: text("birthday"),

    // JSON arrays for multiple values
    emails: text("emails"), // JSON array of {type, value}
    phoneNumbers: text("phone_numbers"), // JSON array of {type, value}
    addresses: text("addresses"), // JSON array of address objects
    urls: text("urls"), // JSON array of {type, value}

    // Photo data
    photoData: text("photo_data"),
    photoMediaType: text("photo_media_type"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    userIdIdx: index("contacts_user_id_idx").on(table.userId),
    categoryIdIdx: index("contacts_category_id_idx").on(table.categoryId),
    updatedAtIdx: index("contacts_updated_at_idx").on(table.updatedAt),
  })
);

export type Contact = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;
