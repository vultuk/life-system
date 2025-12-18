-- CardDAV System Migration

-- Add sync_token to categories (for address book sync)
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "sync_token" text;

-- Create CardDAV contacts table
CREATE TABLE IF NOT EXISTS "carddav_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"category_id" uuid,
	"vcard_data" text NOT NULL,
	"etag" text NOT NULL,
	"display_name" text,
	"given_name" text,
	"family_name" text,
	"primary_email" text,
	"primary_phone" text,
	"organization" text,
	"job_title" text,
	"nickname" text,
	"birthday" text,
	"notes" text,
	"emails" text,
	"phone_numbers" text,
	"addresses" text,
	"urls" text,
	"photo_data" text,
	"photo_media_type" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Create contact groups table
CREATE TABLE IF NOT EXISTS "contact_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"category_id" uuid,
	"display_name" text NOT NULL,
	"description" text,
	"vcard_data" text NOT NULL,
	"etag" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Create contact group members junction table
CREATE TABLE IF NOT EXISTS "contact_group_members" (
	"group_id" uuid NOT NULL,
	"contact_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contact_group_members_group_id_contact_id_pk" PRIMARY KEY("group_id","contact_id")
);

-- Create contact tombstones table for sync tracking
CREATE TABLE IF NOT EXISTS "contact_tombstones" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"category_id" uuid,
	"resource_type" text DEFAULT 'contact' NOT NULL,
	"deleted_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Add foreign key constraints
DO $$ BEGIN
	ALTER TABLE "carddav_contacts" ADD CONSTRAINT "carddav_contacts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
	ALTER TABLE "carddav_contacts" ADD CONSTRAINT "carddav_contacts_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
	ALTER TABLE "contact_groups" ADD CONSTRAINT "contact_groups_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
	ALTER TABLE "contact_groups" ADD CONSTRAINT "contact_groups_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
	ALTER TABLE "contact_group_members" ADD CONSTRAINT "contact_group_members_group_id_contact_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."contact_groups"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
	ALTER TABLE "contact_group_members" ADD CONSTRAINT "contact_group_members_contact_id_carddav_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."carddav_contacts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
	ALTER TABLE "contact_tombstones" ADD CONSTRAINT "contact_tombstones_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
	ALTER TABLE "contact_tombstones" ADD CONSTRAINT "contact_tombstones_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "carddav_contacts_user_id_idx" ON "carddav_contacts" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "carddav_contacts_category_id_idx" ON "carddav_contacts" USING btree ("category_id");
CREATE INDEX IF NOT EXISTS "carddav_contacts_updated_at_idx" ON "carddav_contacts" USING btree ("updated_at");
CREATE INDEX IF NOT EXISTS "carddav_contacts_display_name_idx" ON "carddav_contacts" USING btree ("display_name");
CREATE INDEX IF NOT EXISTS "carddav_contacts_primary_email_idx" ON "carddav_contacts" USING btree ("primary_email");

CREATE INDEX IF NOT EXISTS "contact_groups_user_id_idx" ON "contact_groups" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "contact_groups_category_id_idx" ON "contact_groups" USING btree ("category_id");
CREATE INDEX IF NOT EXISTS "contact_groups_updated_at_idx" ON "contact_groups" USING btree ("updated_at");

CREATE INDEX IF NOT EXISTS "contact_group_members_group_id_idx" ON "contact_group_members" USING btree ("group_id");
CREATE INDEX IF NOT EXISTS "contact_group_members_contact_id_idx" ON "contact_group_members" USING btree ("contact_id");

CREATE INDEX IF NOT EXISTS "contact_tombstones_user_id_idx" ON "contact_tombstones" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "contact_tombstones_category_id_idx" ON "contact_tombstones" USING btree ("category_id");
CREATE INDEX IF NOT EXISTS "contact_tombstones_deleted_at_idx" ON "contact_tombstones" USING btree ("deleted_at");
CREATE INDEX IF NOT EXISTS "contact_tombstones_resource_type_idx" ON "contact_tombstones" USING btree ("resource_type");
