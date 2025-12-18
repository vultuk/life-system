-- Migration: Enhanced Task System
-- Adds: 5-level priority, deadline/deadlineTime, scheduled blocks, task links

-- Step 1: Create new priority enum with 5 levels
CREATE TYPE "task_priority_new" AS ENUM ('Lowest', 'Low', 'Normal', 'High', 'Very high');

-- Step 2: Add new columns to tasks table
ALTER TABLE "tasks" ADD COLUMN "deadline" date;
ALTER TABLE "tasks" ADD COLUMN "deadline_time" text;
ALTER TABLE "tasks" ADD COLUMN "scheduled_start" timestamp with time zone;
ALTER TABLE "tasks" ADD COLUMN "scheduled_finish" timestamp with time zone;

-- Step 3: Migrate due_date data to deadline columns
UPDATE "tasks" SET
  "deadline" = ("due_date" AT TIME ZONE 'UTC')::date,
  "deadline_time" = to_char("due_date" AT TIME ZONE 'UTC', 'HH24:MI')
WHERE "due_date" IS NOT NULL;

-- Set default deadline time for tasks that had midnight time
UPDATE "tasks" SET "deadline_time" = '09:00'
WHERE "deadline" IS NOT NULL AND "deadline_time" = '00:00';

-- Step 4: Migrate priority values to new enum
ALTER TABLE "tasks" ADD COLUMN "priority_new" "task_priority_new" DEFAULT 'Normal';

UPDATE "tasks" SET "priority_new" =
  CASE "priority"::text
    WHEN 'low' THEN 'Low'::"task_priority_new"
    WHEN 'medium' THEN 'Normal'::"task_priority_new"
    WHEN 'high' THEN 'High'::"task_priority_new"
    ELSE 'Normal'::"task_priority_new"
  END;

ALTER TABLE "tasks" DROP COLUMN "priority";
ALTER TABLE "tasks" RENAME COLUMN "priority_new" TO "priority";
ALTER TABLE "tasks" ALTER COLUMN "priority" SET NOT NULL;
ALTER TABLE "tasks" ALTER COLUMN "priority" SET DEFAULT 'Normal';

-- Step 5: Drop old due_date column
ALTER TABLE "tasks" DROP COLUMN "due_date";

-- Step 6: Drop old priority enum and rename new one
DROP TYPE "task_priority";
ALTER TYPE "task_priority_new" RENAME TO "task_priority";

-- Step 7: Create task_note_links junction table
CREATE TABLE "task_note_links" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "task_id" uuid NOT NULL,
  "note_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "task_note_links_task_id_note_id_unique" UNIQUE("task_id", "note_id")
);

-- Step 8: Create task_contact_links junction table
CREATE TABLE "task_contact_links" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "task_id" uuid NOT NULL,
  "contact_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "task_contact_links_task_id_contact_id_unique" UNIQUE("task_id", "contact_id")
);

-- Step 9: Add foreign key constraints
ALTER TABLE "task_note_links" ADD CONSTRAINT "task_note_links_task_id_tasks_id_fk"
  FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "task_note_links" ADD CONSTRAINT "task_note_links_note_id_notes_id_fk"
  FOREIGN KEY ("note_id") REFERENCES "public"."notes"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "task_note_links" ADD CONSTRAINT "task_note_links_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "task_contact_links" ADD CONSTRAINT "task_contact_links_task_id_tasks_id_fk"
  FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "task_contact_links" ADD CONSTRAINT "task_contact_links_contact_id_contacts_id_fk"
  FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "task_contact_links" ADD CONSTRAINT "task_contact_links_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
