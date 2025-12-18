-- Migration: Category System
-- Adds: categories table, categoryId foreign key to tasks, notes, habits, contacts

-- Step 1: Create categories table
CREATE TABLE "categories" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "name" text NOT NULL,
  "color" text,
  "icon" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Step 2: Add foreign key constraint for categories.user_id
ALTER TABLE "categories" ADD CONSTRAINT "categories_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

-- Step 3: Add category_id column to tasks table
ALTER TABLE "tasks" ADD COLUMN "category_id" uuid;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_category_id_categories_id_fk"
  FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;

-- Step 4: Add category_id column to notes table
ALTER TABLE "notes" ADD COLUMN "category_id" uuid;
ALTER TABLE "notes" ADD CONSTRAINT "notes_category_id_categories_id_fk"
  FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;

-- Step 5: Add category_id column to habits table
ALTER TABLE "habits" ADD COLUMN "category_id" uuid;
ALTER TABLE "habits" ADD CONSTRAINT "habits_category_id_categories_id_fk"
  FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;

-- Step 6: Add category_id column to contacts table
ALTER TABLE "contacts" ADD COLUMN "category_id" uuid;
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_category_id_categories_id_fk"
  FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;

-- Step 7: Create index for better query performance on category lookups
CREATE INDEX "categories_user_id_idx" ON "categories" ("user_id");
CREATE INDEX "tasks_category_id_idx" ON "tasks" ("category_id");
CREATE INDEX "notes_category_id_idx" ON "notes" ("category_id");
CREATE INDEX "habits_category_id_idx" ON "habits" ("category_id");
CREATE INDEX "contacts_category_id_idx" ON "contacts" ("category_id");
