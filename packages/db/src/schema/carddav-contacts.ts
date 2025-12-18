import { pgTable, text, timestamp, uuid, index } from "drizzle-orm/pg-core";
import { users } from "./users";
import { categories } from "./categories";

/**
 * CardDAV contacts table - stores full vCard data for CardDAV sync
 * Categories serve as address books
 */
export const carddavContacts = pgTable(
  "carddav_contacts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),

    // Full vCard data storage
    vcardData: text("vcard_data").notNull(),
    etag: text("etag").notNull(),

    // Denormalized fields for querying (parsed from vCard)
    displayName: text("display_name"),
    givenName: text("given_name"),
    familyName: text("family_name"),
    primaryEmail: text("primary_email"),
    primaryPhone: text("primary_phone"),
    organization: text("organization"),
    jobTitle: text("job_title"),
    nickname: text("nickname"),
    birthday: text("birthday"),
    notes: text("notes"),

    // JSON fields for multiple values
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
    userIdIdx: index("carddav_contacts_user_id_idx").on(table.userId),
    categoryIdIdx: index("carddav_contacts_category_id_idx").on(
      table.categoryId
    ),
    updatedAtIdx: index("carddav_contacts_updated_at_idx").on(table.updatedAt),
    displayNameIdx: index("carddav_contacts_display_name_idx").on(
      table.displayName
    ),
    primaryEmailIdx: index("carddav_contacts_primary_email_idx").on(
      table.primaryEmail
    ),
  })
);

export type CarddavContact = typeof carddavContacts.$inferSelect;
export type NewCarddavContact = typeof carddavContacts.$inferInsert;
