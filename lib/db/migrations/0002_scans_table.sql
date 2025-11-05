-- Create scans table for new scan functionality
CREATE TABLE IF NOT EXISTS "scans" (
	"id" varchar(32) PRIMARY KEY NOT NULL,
	"organization_id" varchar(32) NOT NULL,
	"user_id" varchar(32) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"type" varchar(50) NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"priority" varchar(20) DEFAULT 'medium' NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"files" jsonb DEFAULT '[]'::jsonb,
	"results" jsonb DEFAULT '{}'::jsonb,
	"metrics" jsonb DEFAULT '{}'::jsonb,
	"progress" integer DEFAULT 0 NOT NULL,
	"error" text,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Create indexes for scans table
CREATE INDEX IF NOT EXISTS "scans_organization_idx" ON "scans" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "scans_user_idx" ON "scans" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "scans_status_idx" ON "scans" USING btree ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "scans_type_idx" ON "scans" USING btree ("type");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "scans_created_at_idx" ON "scans" USING btree ("created_at");
--> statement-breakpoint

-- Add comment
COMMENT ON TABLE "scans" IS 'Stores scan jobs with configuration, results, and metrics';
