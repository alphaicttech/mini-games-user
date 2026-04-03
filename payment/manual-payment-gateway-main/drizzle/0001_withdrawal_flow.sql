ALTER TYPE "public"."webhook_event_type" ADD VALUE IF NOT EXISTS 'withdrawal.approved';--> statement-breakpoint
ALTER TYPE "public"."wallet_ledger_type" ADD VALUE IF NOT EXISTS 'WITHDRAWAL_REQUEST';--> statement-breakpoint
ALTER TYPE "public"."wallet_ledger_type" ADD VALUE IF NOT EXISTS 'WITHDRAWAL_REFUND';--> statement-breakpoint
CREATE TYPE "public"."withdrawal_status" AS ENUM('PENDING_APPROVAL', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "withdrawal_requests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "external_reference" varchar(100) NOT NULL,
  "amount" numeric(18, 2) NOT NULL,
  "currency" varchar(10) DEFAULT 'ETB' NOT NULL,
  "status" "withdrawal_status" DEFAULT 'PENDING_APPROVAL' NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "requested_by_user_id" uuid,
  "approved_by_user_id" uuid,
  "approved_at" timestamp with time zone,
  "rejected_at" timestamp with time zone,
  "admin_note" text,
  "proof_uploaded_file_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);--> statement-breakpoint
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_requested_by_user_id_company_users_id_fk" FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."company_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_approved_by_user_id_company_users_id_fk" FOREIGN KEY ("approved_by_user_id") REFERENCES "public"."company_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_proof_uploaded_file_id_uploaded_files_id_fk" FOREIGN KEY ("proof_uploaded_file_id") REFERENCES "public"."uploaded_files"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "withdrawal_requests_company_external_reference_uq" ON "withdrawal_requests" USING btree ("company_id","external_reference");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "withdrawal_requests_company_status_idx" ON "withdrawal_requests" USING btree ("company_id","status");--> statement-breakpoint
ALTER TABLE "webhook_events" ALTER COLUMN "deposit_session_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "webhook_events" ADD COLUMN IF NOT EXISTS "withdrawal_request_id" uuid;
