-- Security Events Table for comprehensive security logging
CREATE TABLE IF NOT EXISTS "security_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"event_type" varchar(100) NOT NULL,
	"severity" varchar(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
	"action" varchar(100),
	"resource" varchar(255),
	"ip_address" varchar(45),
	"user_agent" text,
	"status" varchar(50) DEFAULT 'completed',
	"error_message" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Rate Limit Logs Table for tracking rate limiting events
CREATE TABLE IF NOT EXISTS "rate_limit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"identifier" varchar(255) NOT NULL,
	"endpoint" varchar(255) NOT NULL,
	"attempts" integer DEFAULT 1 NOT NULL,
	"first_attempt" timestamp DEFAULT now() NOT NULL,
	"last_attempt" timestamp DEFAULT now() NOT NULL,
	"is_blocked" boolean DEFAULT false NOT NULL,
	"blocked_until" timestamp,
	"block_reason" varchar(255),
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Foreign key constraints
ALTER TABLE "security_events" ADD CONSTRAINT "security_events_user_id_users_id_fk" 
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE no action;
--> statement-breakpoint

-- Indexes for security_events table (optimized for querying)
CREATE INDEX IF NOT EXISTS "security_events_user_idx" ON "security_events" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "security_events_type_idx" ON "security_events" USING btree ("event_type");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "security_events_severity_idx" ON "security_events" USING btree ("severity");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "security_events_created_idx" ON "security_events" USING btree ("created_at" DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "security_events_ip_idx" ON "security_events" USING btree ("ip_address");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "security_events_action_idx" ON "security_events" USING btree ("action");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "security_events_resource_idx" ON "security_events" USING btree ("resource");
--> statement-breakpoint

-- Composite index for common query patterns
CREATE INDEX IF NOT EXISTS "security_events_user_created_idx" ON "security_events" USING btree ("user_id", "created_at" DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "security_events_severity_created_idx" ON "security_events" USING btree ("severity", "created_at" DESC);
--> statement-breakpoint

-- Indexes for rate_limit_logs table (optimized for rate limiting lookups)
CREATE INDEX IF NOT EXISTS "rate_limit_identifier_idx" ON "rate_limit_logs" USING btree ("identifier");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rate_limit_endpoint_idx" ON "rate_limit_logs" USING btree ("endpoint");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rate_limit_blocked_idx" ON "rate_limit_logs" USING btree ("is_blocked");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rate_limit_created_idx" ON "rate_limit_logs" USING btree ("created_at" DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rate_limit_last_attempt_idx" ON "rate_limit_logs" USING btree ("last_attempt" DESC);
--> statement-breakpoint

-- Composite index for rate limiting checks (hot path optimization)
CREATE INDEX IF NOT EXISTS "rate_limit_lookup_idx" ON "rate_limit_logs" USING btree ("identifier", "endpoint", "last_attempt" DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rate_limit_blocked_until_idx" ON "rate_limit_logs" USING btree ("blocked_until") WHERE "is_blocked" = true;
--> statement-breakpoint

-- Comments for documentation
COMMENT ON TABLE "security_events" IS 'Comprehensive audit log for all security-related events including authentication, authorization, and security violations';
COMMENT ON TABLE "rate_limit_logs" IS 'Tracks rate limiting events and account lockouts for brute force protection';
COMMENT ON COLUMN "security_events"."severity" IS 'Security event severity: low, medium, high, critical';
COMMENT ON COLUMN "security_events"."metadata" IS 'Additional context data stored as JSON (e.g., request headers, user details, error stack)';
COMMENT ON COLUMN "rate_limit_logs"."identifier" IS 'Unique identifier for rate limiting (IP address, user ID, or combination)';
COMMENT ON COLUMN "rate_limit_logs"."blocked_until" IS 'Timestamp when the block expires (NULL if not currently blocked)';
