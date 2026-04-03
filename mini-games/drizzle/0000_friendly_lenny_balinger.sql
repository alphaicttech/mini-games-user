CREATE TYPE "public"."company_status" AS ENUM('ACTIVE', 'SUSPENDED', 'MAINTENANCE', 'DELETED');--> statement-breakpoint
CREATE TYPE "public"."deposit_status" AS ENUM('CREATED', 'WAITING_PAYMENT', 'SUBMITTED', 'VERIFYING', 'SUCCESS', 'FAILED', 'EXPIRED', 'CANCELED', 'WEBHOOK_PENDING', 'WEBHOOK_SENT', 'MANUAL_REVIEW');--> statement-breakpoint
CREATE TYPE "public"."fee_plan_type" AS ENUM('PERCENTAGE', 'FIXED', 'HYBRID', 'TIERED', 'CUSTOM');--> statement-breakpoint
CREATE TYPE "public"."receiving_number_status" AS ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('SUPER_ADMIN', 'COMPANY_OWNER', 'COMPANY_ADMIN', 'COMPANY_FINANCE', 'SUPPORT_READONLY');--> statement-breakpoint
CREATE TYPE "public"."wallet_ledger_type" AS ENUM('SUPER_ADMIN_CREDIT', 'SUPER_ADMIN_DEBIT', 'AUTO_FEE_DEDUCTION', 'MANUAL_ADJUSTMENT', 'REFUND', 'BONUS');--> statement-breakpoint
CREATE TYPE "public"."webhook_event_type" AS ENUM('deposit.success', 'deposit.failed', 'deposit.manual_review', 'deposit.expired');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "api_credentials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"key_id" varchar(64) NOT NULL,
	"secret_hash" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_user_id" uuid,
	"actor_role" "role",
	"company_id" uuid,
	"action" varchar(150) NOT NULL,
	"target_type" varchar(80) NOT NULL,
	"target_id" varchar(80),
	"request_id" varchar(64),
	"ip_address" varchar(64),
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(150) NOT NULL,
	"slug" varchar(120) NOT NULL,
	"status" "company_status" DEFAULT 'ACTIVE' NOT NULL,
	"balance_available" numeric(18, 2) DEFAULT '0' NOT NULL,
	"balance_reserved" numeric(18, 2) DEFAULT '0' NOT NULL,
	"consumed_fees" numeric(18, 2) DEFAULT '0' NOT NULL,
	"lifetime_usage" numeric(18, 2) DEFAULT '0' NOT NULL,
	"webhook_url" varchar(500),
	"webhook_secret_hash" text,
	"allowed_return_urls" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"allowed_domains" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"branding" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"deposit_rules" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "company_fee_plan_overrides" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"fee_plan_id" uuid NOT NULL,
	"override_config" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "company_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"email" varchar(200) NOT NULL,
	"password_hash" text NOT NULL,
	"full_name" varchar(150) NOT NULL,
	"role" "role" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "deposit_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deposit_session_id" uuid NOT NULL,
	"submitted_tx_id" varchar(120) NOT NULL,
	"uploaded_file_id" uuid,
	"ip_address" varchar(64),
	"user_agent" text,
	"attempt_no" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "deposit_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"external_reference" varchar(100),
	"external_user_id" varchar(100),
	"expected_amount" numeric(18, 2),
	"currency" varchar(10) DEFAULT 'ETB' NOT NULL,
	"assigned_receiving_number_id" uuid,
	"hosted_token_hash" text NOT NULL,
	"status" "deposit_status" DEFAULT 'CREATED' NOT NULL,
	"return_url_success" varchar(500),
	"return_url_fail" varchar(500),
	"callback_override_url" varchar(500),
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "fee_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(140) NOT NULL,
	"type" "fee_plan_type" NOT NULL,
	"config" jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "impersonation_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"super_admin_user_id" uuid NOT NULL,
	"target_company_id" uuid NOT NULL,
	"reason" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "manual_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deposit_session_id" uuid NOT NULL,
	"verified_transaction_id" uuid,
	"reason_codes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" varchar(30) DEFAULT 'OPEN' NOT NULL,
	"assigned_to" uuid,
	"resolution_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "rate_limit_buckets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scope" varchar(80) NOT NULL,
	"key" varchar(120) NOT NULL,
	"hits" integer DEFAULT 0 NOT NULL,
	"reset_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "receiving_numbers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"phone_number" varchar(20) NOT NULL,
	"account_holder_name" varchar(160) NOT NULL,
	"label" varchar(120),
	"status" "receiving_number_status" DEFAULT 'ACTIVE' NOT NULL,
	"priority_weight" integer DEFAULT 1 NOT NULL,
	"max_concurrent_sessions" integer DEFAULT 5 NOT NULL,
	"cooldown_seconds" integer DEFAULT 0 NOT NULL,
	"daily_volume" numeric(18, 2) DEFAULT '0' NOT NULL,
	"monthly_volume" numeric(18, 2) DEFAULT '0' NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "support_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid,
	"deposit_session_id" uuid,
	"note" text NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "system_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(120) NOT NULL,
	"value" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "uploaded_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"storage_provider" varchar(50) DEFAULT 'local' NOT NULL,
	"storage_path" text NOT NULL,
	"original_name" varchar(255) NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"byte_size" integer NOT NULL,
	"sha256_hash" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"redis_session_id" varchar(128) NOT NULL,
	"ip_address" varchar(64),
	"user_agent" text,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "verified_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"deposit_session_id" uuid NOT NULL,
	"tx_id" varchar(120) NOT NULL,
	"invoice_no" varchar(120),
	"amount_settled" numeric(18, 2) NOT NULL,
	"raw_payload" jsonb NOT NULL,
	"normalized_payload" jsonb NOT NULL,
	"decision" varchar(30) NOT NULL,
	"reasons" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"risk_flags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"verified_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "wallet_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"currency" varchar(10) DEFAULT 'ETB' NOT NULL,
	"available_balance" numeric(18, 2) DEFAULT '0' NOT NULL,
	"reserved_balance" numeric(18, 2) DEFAULT '0' NOT NULL,
	"overdraft_allowed" boolean DEFAULT false NOT NULL,
	"overdraft_limit" numeric(18, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "wallet_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wallet_account_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"entry_type" "wallet_ledger_type" NOT NULL,
	"amount" numeric(18, 2) NOT NULL,
	"before_balance" numeric(18, 2) NOT NULL,
	"after_balance" numeric(18, 2) NOT NULL,
	"reference_type" varchar(50),
	"reference_id" uuid,
	"meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "webhook_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"webhook_event_id" uuid NOT NULL,
	"attempt_no" integer NOT NULL,
	"request_headers" jsonb NOT NULL,
	"request_body" jsonb NOT NULL,
	"response_status" integer,
	"response_body" text,
	"next_retry_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "webhook_endpoints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"callback_url" varchar(500) NOT NULL,
	"signing_secret_hash" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "webhook_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"deposit_session_id" uuid NOT NULL,
	"event_type" "webhook_event_type" NOT NULL,
	"payload" jsonb NOT NULL,
	"idempotency_key" varchar(100) NOT NULL,
	"status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "api_credentials" ADD CONSTRAINT "api_credentials_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_company_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."company_users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "company_fee_plan_overrides" ADD CONSTRAINT "company_fee_plan_overrides_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "company_fee_plan_overrides" ADD CONSTRAINT "company_fee_plan_overrides_fee_plan_id_fee_plans_id_fk" FOREIGN KEY ("fee_plan_id") REFERENCES "public"."fee_plans"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "company_users" ADD CONSTRAINT "company_users_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "deposit_attempts" ADD CONSTRAINT "deposit_attempts_deposit_session_id_deposit_sessions_id_fk" FOREIGN KEY ("deposit_session_id") REFERENCES "public"."deposit_sessions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "deposit_sessions" ADD CONSTRAINT "deposit_sessions_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "deposit_sessions" ADD CONSTRAINT "deposit_sessions_assigned_receiving_number_id_receiving_numbers_id_fk" FOREIGN KEY ("assigned_receiving_number_id") REFERENCES "public"."receiving_numbers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "impersonation_logs" ADD CONSTRAINT "impersonation_logs_super_admin_user_id_company_users_id_fk" FOREIGN KEY ("super_admin_user_id") REFERENCES "public"."company_users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "impersonation_logs" ADD CONSTRAINT "impersonation_logs_target_company_id_companies_id_fk" FOREIGN KEY ("target_company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "manual_reviews" ADD CONSTRAINT "manual_reviews_deposit_session_id_deposit_sessions_id_fk" FOREIGN KEY ("deposit_session_id") REFERENCES "public"."deposit_sessions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "manual_reviews" ADD CONSTRAINT "manual_reviews_verified_transaction_id_verified_transactions_id_fk" FOREIGN KEY ("verified_transaction_id") REFERENCES "public"."verified_transactions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "manual_reviews" ADD CONSTRAINT "manual_reviews_assigned_to_company_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."company_users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "receiving_numbers" ADD CONSTRAINT "receiving_numbers_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "receiving_numbers" ADD CONSTRAINT "receiving_numbers_created_by_company_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."company_users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "receiving_numbers" ADD CONSTRAINT "receiving_numbers_updated_by_company_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."company_users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "support_notes" ADD CONSTRAINT "support_notes_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "support_notes" ADD CONSTRAINT "support_notes_deposit_session_id_deposit_sessions_id_fk" FOREIGN KEY ("deposit_session_id") REFERENCES "public"."deposit_sessions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "support_notes" ADD CONSTRAINT "support_notes_created_by_company_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."company_users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "uploaded_files" ADD CONSTRAINT "uploaded_files_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_company_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."company_users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "verified_transactions" ADD CONSTRAINT "verified_transactions_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "verified_transactions" ADD CONSTRAINT "verified_transactions_deposit_session_id_deposit_sessions_id_fk" FOREIGN KEY ("deposit_session_id") REFERENCES "public"."deposit_sessions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "wallet_accounts" ADD CONSTRAINT "wallet_accounts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "wallet_ledger" ADD CONSTRAINT "wallet_ledger_wallet_account_id_wallet_accounts_id_fk" FOREIGN KEY ("wallet_account_id") REFERENCES "public"."wallet_accounts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "wallet_ledger" ADD CONSTRAINT "wallet_ledger_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_webhook_event_id_webhook_events_id_fk" FOREIGN KEY ("webhook_event_id") REFERENCES "public"."webhook_events"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "webhook_endpoints" ADD CONSTRAINT "webhook_endpoints_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "webhook_events" ADD CONSTRAINT "webhook_events_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "webhook_events" ADD CONSTRAINT "webhook_events_deposit_session_id_deposit_sessions_id_fk" FOREIGN KEY ("deposit_session_id") REFERENCES "public"."deposit_sessions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "companies_slug_uq" ON "companies" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "company_users_company_email_uq" ON "company_users" USING btree ("company_id","email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "deposit_sessions_company_status_idx" ON "deposit_sessions" USING btree ("company_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "rate_limit_buckets_scope_key_uq" ON "rate_limit_buckets" USING btree ("scope","key");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "receiving_numbers_company_status_idx" ON "receiving_numbers" USING btree ("company_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "system_settings_key_uq" ON "system_settings" USING btree ("key");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uploaded_files_sha256_uq" ON "uploaded_files" USING btree ("sha256_hash");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "verified_transactions_tx_id_uq" ON "verified_transactions" USING btree ("tx_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "verified_transactions_invoice_no_uq" ON "verified_transactions" USING btree ("invoice_no");