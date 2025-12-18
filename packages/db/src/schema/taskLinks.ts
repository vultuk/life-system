import { pgTable, timestamp, uuid, unique } from "drizzle-orm/pg-core";
import { users } from "./users";
import { tasks } from "./tasks";
import { notes } from "./notes";
import { contacts } from "./contacts";

export const taskNoteLinks = pgTable(
  "task_note_links",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    noteId: uuid("note_id")
      .notNull()
      .references(() => notes.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    uniqueTaskNote: unique().on(table.taskId, table.noteId),
  })
);

export const taskContactLinks = pgTable(
  "task_contact_links",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    contactId: uuid("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    uniqueTaskContact: unique().on(table.taskId, table.contactId),
  })
);

export type TaskNoteLink = typeof taskNoteLinks.$inferSelect;
export type NewTaskNoteLink = typeof taskNoteLinks.$inferInsert;
export type TaskContactLink = typeof taskContactLinks.$inferSelect;
export type NewTaskContactLink = typeof taskContactLinks.$inferInsert;
