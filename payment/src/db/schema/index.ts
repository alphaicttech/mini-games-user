import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  boolean,
  jsonb,
  pgEnum,
  numeric,
  integer,
  text,
  index,
  uniqueIndex
} from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', ['SUPER_ADMIN', 'COMPANY_OWNER', 'COMPANY_ADMIN', 'COMPANY_FINANCE', 'SUPPORT_READONLY']);
export const companyStatusEnum = pgEnum('company_status', ['ACTIVE', 'SUSPENDED', 'MAINTENANCE', 'DELETED']);
export const receivingNumberStatusEnum = pgEnum('receiving_number_status', ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED']);
export const depositStatusEnum = pgEnum('deposit_status', ['CREATED', 'WAITING_PAYMENT', 'SUBMITTED', 'VERIFYING', 'SUCCESS', 'FAILED', 'EXPIRED', 'CANCELED', 'WEBHOOK_PENDING', 'WEBHOOK_SENT', 'MANUAL_REVIEW']);
export const feePlanTypeEnum = pgEnum('fee_plan_type', ['PERCENTAGE', 'FIXED', 'HYBRID', 'TIERED', 'CUSTOM']);
export const webhookEventTypeEnum = pgEnum('webhook_event_type', ['deposit.success', 'deposit.failed', 'deposit.manual_review', 'deposit.expired', 'withdrawal.approved']);
export const walletLedgerTypeEnum = pgEnum('wallet_ledger_type', ['SUPER_ADMIN_CREDIT', 'SUPER_ADMIN_DEBIT', 'AUTO_FEE_DEDUCTION', 'MANUAL_ADJUSTMENT', 'REFUND', 'BONUS', 'WITHDRAWAL_REQUEST', 'WITHDRAWAL_REFUND']);
export const withdrawalStatusEnum = pgEnum('withdrawal_status', ['PENDING_APPROVAL', 'APPROVED', 'REJECTED']);

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true })
};

export const companies = pgTable('companies', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 150 }).notNull(),
  slug: varchar('slug', { length: 120 }).notNull(),
  status: companyStatusEnum('status').default('ACTIVE').notNull(),
  balanceAvailable: numeric('balance_available', { precision: 18, scale: 2 }).default('0').notNull(),
  balanceReserved: numeric('balance_reserved', { precision: 18, scale: 2 }).default('0').notNull(),
  consumedFees: numeric('consumed_fees', { precision: 18, scale: 2 }).default('0').notNull(),
  lifetimeUsage: numeric('lifetime_usage', { precision: 18, scale: 2 }).default('0').notNull(),
  webhookUrl: varchar('webhook_url', { length: 500 }),
  webhookSecretHash: text('webhook_secret_hash'),
  allowedReturnUrls: jsonb('allowed_return_urls').$type<string[]>().default([]).notNull(),
  allowedDomains: jsonb('allowed_domains').$type<string[]>().default([]).notNull(),
  branding: jsonb('branding').default({}).notNull(),
  depositRules: jsonb('deposit_rules').default({}).notNull(),
  ...timestamps
}, (t) => [uniqueIndex('companies_slug_uq').on(t.slug)]);

export const companyUsers = pgTable('company_users', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  email: varchar('email', { length: 200 }).notNull(),
  passwordHash: text('password_hash').notNull(),
  fullName: varchar('full_name', { length: 150 }).notNull(),
  role: roleEnum('role').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  ...timestamps
}, (t) => [uniqueIndex('company_users_company_email_uq').on(t.companyId, t.email)]);

export const userSessions = pgTable('user_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => companyUsers.id),
  redisSessionId: varchar('redis_session_id', { length: 128 }).notNull(),
  ipAddress: varchar('ip_address', { length: 64 }),
  userAgent: text('user_agent'),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  ...timestamps
});

export const apiCredentials = pgTable('api_credentials', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  keyId: varchar('key_id', { length: 64 }).notNull(),
  secretHash: text('secret_hash').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  ...timestamps
});

export const feePlans = pgTable('fee_plans', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 140 }).notNull(),
  type: feePlanTypeEnum('type').notNull(),
  config: jsonb('config').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  ...timestamps
});

export const companyFeePlanOverrides = pgTable('company_fee_plan_overrides', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  feePlanId: uuid('fee_plan_id').notNull().references(() => feePlans.id),
  overrideConfig: jsonb('override_config'),
  ...timestamps
});

export const receivingNumbers = pgTable('receiving_numbers', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  phoneNumber: varchar('phone_number', { length: 20 }).notNull(),
  accountHolderName: varchar('account_holder_name', { length: 160 }).notNull(),
  label: varchar('label', { length: 120 }),
  status: receivingNumberStatusEnum('status').default('ACTIVE').notNull(),
  priorityWeight: integer('priority_weight').default(1).notNull(),
  maxConcurrentSessions: integer('max_concurrent_sessions').default(5).notNull(),
  cooldownSeconds: integer('cooldown_seconds').default(0).notNull(),
  dailyVolume: numeric('daily_volume', { precision: 18, scale: 2 }).default('0').notNull(),
  monthlyVolume: numeric('monthly_volume', { precision: 18, scale: 2 }).default('0').notNull(),
  createdBy: uuid('created_by').references(() => companyUsers.id),
  updatedBy: uuid('updated_by').references(() => companyUsers.id),
  ...timestamps
}, (t) => [index('receiving_numbers_company_status_idx').on(t.companyId, t.status)]);

export const depositSessions = pgTable('deposit_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  externalReference: varchar('external_reference', { length: 100 }),
  externalUserId: varchar('external_user_id', { length: 100 }),
  expectedAmount: numeric('expected_amount', { precision: 18, scale: 2 }),
  currency: varchar('currency', { length: 10 }).default('ETB').notNull(),
  assignedReceivingNumberId: uuid('assigned_receiving_number_id').references(() => receivingNumbers.id),
  hostedTokenHash: text('hosted_token_hash').notNull(),
  status: depositStatusEnum('status').default('CREATED').notNull(),
  returnUrlSuccess: varchar('return_url_success', { length: 500 }),
  returnUrlFail: varchar('return_url_fail', { length: 500 }),
  callbackOverrideUrl: varchar('callback_override_url', { length: 500 }),
  metadata: jsonb('metadata').default({}).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  ...timestamps
}, (t) => [index('deposit_sessions_company_status_idx').on(t.companyId, t.status)]);

export const depositAttempts = pgTable('deposit_attempts', {
  id: uuid('id').defaultRandom().primaryKey(),
  depositSessionId: uuid('deposit_session_id').notNull().references(() => depositSessions.id),
  submittedTxId: varchar('submitted_tx_id', { length: 120 }).notNull(),
  uploadedFileId: uuid('uploaded_file_id'),
  ipAddress: varchar('ip_address', { length: 64 }),
  userAgent: text('user_agent'),
  attemptNo: integer('attempt_no').notNull(),
  ...timestamps
});

export const verifiedTransactions = pgTable('verified_transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  depositSessionId: uuid('deposit_session_id').notNull().references(() => depositSessions.id),
  txId: varchar('tx_id', { length: 120 }).notNull(),
  invoiceNo: varchar('invoice_no', { length: 120 }),
  amountSettled: numeric('amount_settled', { precision: 18, scale: 2 }).notNull(),
  rawPayload: jsonb('raw_payload').notNull(),
  normalizedPayload: jsonb('normalized_payload').notNull(),
  decision: varchar('decision', { length: 30 }).notNull(),
  reasons: jsonb('reasons').$type<string[]>().default([]).notNull(),
  riskFlags: jsonb('risk_flags').$type<string[]>().default([]).notNull(),
  verifiedAt: timestamp('verified_at', { withTimezone: true }).defaultNow().notNull(),
  ...timestamps
}, (t) => [uniqueIndex('verified_transactions_tx_id_uq').on(t.txId), uniqueIndex('verified_transactions_invoice_no_uq').on(t.invoiceNo)]);

export const uploadedFiles = pgTable('uploaded_files', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  storageProvider: varchar('storage_provider', { length: 50 }).default('local').notNull(),
  storagePath: text('storage_path').notNull(),
  originalName: varchar('original_name', { length: 255 }).notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  byteSize: integer('byte_size').notNull(),
  sha256Hash: varchar('sha256_hash', { length: 64 }).notNull(),
  ...timestamps
}, (t) => [uniqueIndex('uploaded_files_sha256_uq').on(t.sha256Hash)]);

export const webhookEndpoints = pgTable('webhook_endpoints', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  callbackUrl: varchar('callback_url', { length: 500 }).notNull(),
  signingSecretHash: text('signing_secret_hash').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  ...timestamps
});

export const webhookEvents = pgTable('webhook_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  depositSessionId: uuid('deposit_session_id').references(() => depositSessions.id),
  withdrawalRequestId: uuid('withdrawal_request_id'),
  eventType: webhookEventTypeEnum('event_type').notNull(),
  payload: jsonb('payload').notNull(),
  idempotencyKey: varchar('idempotency_key', { length: 100 }).notNull(),
  status: varchar('status', { length: 20 }).default('PENDING').notNull(),
  ...timestamps
});

export const webhookDeliveries = pgTable('webhook_deliveries', {
  id: uuid('id').defaultRandom().primaryKey(),
  webhookEventId: uuid('webhook_event_id').notNull().references(() => webhookEvents.id),
  attemptNo: integer('attempt_no').notNull(),
  requestHeaders: jsonb('request_headers').notNull(),
  requestBody: jsonb('request_body').notNull(),
  responseStatus: integer('response_status'),
  responseBody: text('response_body'),
  nextRetryAt: timestamp('next_retry_at', { withTimezone: true }),
  ...timestamps
});

export const walletAccounts = pgTable('wallet_accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  currency: varchar('currency', { length: 10 }).default('ETB').notNull(),
  availableBalance: numeric('available_balance', { precision: 18, scale: 2 }).default('0').notNull(),
  reservedBalance: numeric('reserved_balance', { precision: 18, scale: 2 }).default('0').notNull(),
  overdraftAllowed: boolean('overdraft_allowed').default(false).notNull(),
  overdraftLimit: numeric('overdraft_limit', { precision: 18, scale: 2 }).default('0').notNull(),
  ...timestamps
});

export const walletLedger = pgTable('wallet_ledger', {
  id: uuid('id').defaultRandom().primaryKey(),
  walletAccountId: uuid('wallet_account_id').notNull().references(() => walletAccounts.id),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  entryType: walletLedgerTypeEnum('entry_type').notNull(),
  amount: numeric('amount', { precision: 18, scale: 2 }).notNull(),
  beforeBalance: numeric('before_balance', { precision: 18, scale: 2 }).notNull(),
  afterBalance: numeric('after_balance', { precision: 18, scale: 2 }).notNull(),
  referenceType: varchar('reference_type', { length: 50 }),
  referenceId: uuid('reference_id'),
  meta: jsonb('meta').default({}).notNull(),
  ...timestamps
});

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  actorUserId: uuid('actor_user_id').references(() => companyUsers.id),
  actorRole: roleEnum('actor_role'),
  companyId: uuid('company_id').references(() => companies.id),
  action: varchar('action', { length: 150 }).notNull(),
  targetType: varchar('target_type', { length: 80 }).notNull(),
  targetId: varchar('target_id', { length: 80 }),
  requestId: varchar('request_id', { length: 64 }),
  ipAddress: varchar('ip_address', { length: 64 }),
  details: jsonb('details').default({}).notNull(),
  ...timestamps
});

export const supportNotes = pgTable('support_notes', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').references(() => companies.id),
  depositSessionId: uuid('deposit_session_id').references(() => depositSessions.id),
  note: text('note').notNull(),
  createdBy: uuid('created_by').references(() => companyUsers.id),
  ...timestamps
});

export const systemSettings = pgTable('system_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  key: varchar('key', { length: 120 }).notNull(),
  value: jsonb('value').notNull(),
  ...timestamps
}, (t) => [uniqueIndex('system_settings_key_uq').on(t.key)]);

export const impersonationLogs = pgTable('impersonation_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  superAdminUserId: uuid('super_admin_user_id').notNull().references(() => companyUsers.id),
  targetCompanyId: uuid('target_company_id').notNull().references(() => companies.id),
  reason: text('reason'),
  startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
  endedAt: timestamp('ended_at', { withTimezone: true }),
  ...timestamps
});

export const manualReviews = pgTable('manual_reviews', {
  id: uuid('id').defaultRandom().primaryKey(),
  depositSessionId: uuid('deposit_session_id').notNull().references(() => depositSessions.id),
  verifiedTransactionId: uuid('verified_transaction_id').references(() => verifiedTransactions.id),
  reasonCodes: jsonb('reason_codes').$type<string[]>().default([]).notNull(),
  status: varchar('status', { length: 30 }).default('OPEN').notNull(),
  assignedTo: uuid('assigned_to').references(() => companyUsers.id),
  resolutionNote: text('resolution_note'),
  ...timestamps
});

export const withdrawalRequests = pgTable('withdrawal_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  externalReference: varchar('external_reference', { length: 100 }).notNull(),
  amount: numeric('amount', { precision: 18, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 10 }).default('ETB').notNull(),
  status: withdrawalStatusEnum('status').default('PENDING_APPROVAL').notNull(),
  metadata: jsonb('metadata').default({}).notNull(),
  requestedByUserId: uuid('requested_by_user_id').references(() => companyUsers.id),
  approvedByUserId: uuid('approved_by_user_id').references(() => companyUsers.id),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  rejectedAt: timestamp('rejected_at', { withTimezone: true }),
  adminNote: text('admin_note'),
  proofUploadedFileId: uuid('proof_uploaded_file_id').references(() => uploadedFiles.id),
  ...timestamps
}, (t) => [
  uniqueIndex('withdrawal_requests_company_external_reference_uq').on(t.companyId, t.externalReference),
  index('withdrawal_requests_company_status_idx').on(t.companyId, t.status)
]);

export const rateLimitBuckets = pgTable('rate_limit_buckets', {
  id: uuid('id').defaultRandom().primaryKey(),
  scope: varchar('scope', { length: 80 }).notNull(),
  key: varchar('key', { length: 120 }).notNull(),
  hits: integer('hits').default(0).notNull(),
  resetAt: timestamp('reset_at', { withTimezone: true }).notNull(),
  ...timestamps
}, (t) => [uniqueIndex('rate_limit_buckets_scope_key_uq').on(t.scope, t.key)]);
