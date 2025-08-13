CREATE TABLE "activity_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"organization_id" integer,
	"action" varchar(100) NOT NULL,
	"entity_type" varchar(50),
	"entity_id" integer,
	"description" text,
	"ip_address" varchar(45),
	"user_agent" text,
	"metadata" json,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"organization_id" integer,
	"name" varchar(255) NOT NULL,
	"key_hash" text NOT NULL,
	"permissions" json NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_used_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "compatibility_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(100) NOT NULL,
	"severity" varchar(50) DEFAULT 'medium' NOT NULL,
	"conditions" json NOT NULL,
	"recommendations" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"organization_id" integer,
	"created_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "file_uploads" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"organization_id" integer,
	"file_name" varchar(255) NOT NULL,
	"original_name" varchar(255) NOT NULL,
	"file_type" varchar(50) NOT NULL,
	"file_size" integer NOT NULL,
	"file_path" text NOT NULL,
	"upload_status" varchar(50) DEFAULT 'pending' NOT NULL,
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"organization_id" integer,
	"type" varchar(50) NOT NULL,
	"channel" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"sent_at" timestamp,
	"metadata" json,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"plan" varchar(50) DEFAULT 'free' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"settings" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"scan_session_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"organization_id" integer,
	"title" varchar(255) NOT NULL,
	"format" varchar(50) NOT NULL,
	"status" varchar(50) DEFAULT 'generating' NOT NULL,
	"file_path" text,
	"file_size" integer,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scan_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"scan_session_id" integer NOT NULL,
	"rule_id" integer NOT NULL,
	"status" varchar(50) NOT NULL,
	"severity" varchar(50) NOT NULL,
	"message" text,
	"details" json,
	"recommendations" text,
	"affected_components" json,
	"metadata" json,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scan_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" varchar(255) NOT NULL,
	"user_id" integer NOT NULL,
	"organization_id" integer,
	"name" varchar(255),
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"file_type" varchar(50),
	"file_name" varchar(255),
	"file_size" integer,
	"total_checks" integer DEFAULT 0,
	"completed_checks" integer DEFAULT 0,
	"failed_checks" integer DEFAULT 0,
	"risk_score" real,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "scan_sessions_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100),
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"role" varchar(50) DEFAULT 'user' NOT NULL,
	"organization_id" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compatibility_rules" ADD CONSTRAINT "compatibility_rules_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_uploads" ADD CONSTRAINT "file_uploads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_scan_session_id_scan_sessions_id_fk" FOREIGN KEY ("scan_session_id") REFERENCES "public"."scan_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scan_results" ADD CONSTRAINT "scan_results_scan_session_id_scan_sessions_id_fk" FOREIGN KEY ("scan_session_id") REFERENCES "public"."scan_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scan_results" ADD CONSTRAINT "scan_results_rule_id_compatibility_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."compatibility_rules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scan_sessions" ADD CONSTRAINT "scan_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "logs_user_idx" ON "activity_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "logs_action_idx" ON "activity_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "logs_timestamp_idx" ON "activity_logs" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "logs_entity_idx" ON "activity_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "logs_org_idx" ON "activity_logs" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "api_keys_user_idx" ON "api_keys" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "api_keys_hash_idx" ON "api_keys" USING btree ("key_hash");--> statement-breakpoint
CREATE INDEX "api_keys_active_idx" ON "api_keys" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "api_keys_org_idx" ON "api_keys" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "rules_category_idx" ON "compatibility_rules" USING btree ("category");--> statement-breakpoint
CREATE INDEX "rules_severity_idx" ON "compatibility_rules" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "rules_org_idx" ON "compatibility_rules" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "uploads_user_idx" ON "file_uploads" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "uploads_status_idx" ON "file_uploads" USING btree ("upload_status");--> statement-breakpoint
CREATE INDEX "uploads_org_idx" ON "file_uploads" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "notifications_user_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_type_idx" ON "notifications" USING btree ("type");--> statement-breakpoint
CREATE INDEX "notifications_status_idx" ON "notifications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "notifications_org_idx" ON "notifications" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "reports_scan_idx" ON "reports" USING btree ("scan_session_id");--> statement-breakpoint
CREATE INDEX "reports_user_idx" ON "reports" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "reports_status_idx" ON "reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "reports_org_idx" ON "reports" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "results_scan_idx" ON "scan_results" USING btree ("scan_session_id");--> statement-breakpoint
CREATE INDEX "results_rule_idx" ON "scan_results" USING btree ("rule_id");--> statement-breakpoint
CREATE INDEX "results_status_idx" ON "scan_results" USING btree ("status");--> statement-breakpoint
CREATE INDEX "results_severity_idx" ON "scan_results" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "scans_session_idx" ON "scan_sessions" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "scans_user_idx" ON "scan_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "scans_status_idx" ON "scan_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "scans_org_idx" ON "scan_sessions" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_org_idx" ON "users" USING btree ("organization_id");