CREATE TYPE "public"."change_log_action" AS ENUM('update_price', 'update_hours', 'add_product', 'remove_product', 'update_product', 'broadcast', 'other');--> statement-breakpoint
CREATE TABLE "change_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"action" "change_log_action" NOT NULL,
	"description" text NOT NULL,
	"details" jsonb,
	"source" text DEFAULT 'whatsapp' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "owner_phone_number" text;--> statement-breakpoint
ALTER TABLE "change_logs" ADD CONSTRAINT "change_logs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;