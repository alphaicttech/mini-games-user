import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  pgEnum,
  numeric,
  jsonb,
  uniqueIndex,
  index
} from 'drizzle-orm/pg-core';

export const userStatusEnum = pgEnum('user_status', ['ACTIVE', 'BLOCKED', 'DELETED']);
export const adminStatusEnum = pgEnum('admin_status', ['ACTIVE', 'BLOCKED']);
export const roleEnum = pgEnum('role', ['user', 'admin', 'super_admin']);
export const walletStatusEnum = pgEnum('wallet_status', ['ACTIVE', 'BLOCKED']);
export const walletTxTypeEnum = pgEnum('wallet_tx_type', [
  'DEPOSIT',
  'WITHDRAWAL',
  'BET',
  'WIN',
  'REFUND',
  'BONUS',
  'ADJUSTMENT',
  'REVERSAL'
]);
export const walletTxDirectionEnum = pgEnum('wallet_tx_direction', ['CREDIT', 'DEBIT']);
export const walletTxStatusEnum = pgEnum('wallet_tx_status', ['PENDING', 'SUCCESS', 'FAILED', 'CANCELED']);
export const depositStatusEnum = pgEnum('deposit_status', ['PENDING', 'VERIFIED', 'FAILED', 'EXPIRED', 'CANCELED']);
export const gameSessionStatusEnum = pgEnum('game_session_status', ['CREATED', 'PLAYING', 'WON', 'LOST', 'CANCELED', 'FAILED']);
export const actorTypeEnum = pgEnum('actor_type', ['USER', 'ADMIN', 'SYSTEM']);

const timestamps = {
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
};

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    telegram_id: varchar('telegram_id', { length: 32 }).notNull(),
    username: varchar('username', { length: 64 }),
    first_name: varchar('first_name', { length: 128 }),
    last_name: varchar('last_name', { length: 128 }),
    display_name: varchar('display_name', { length: 255 }),
    photo_url: text('photo_url'),
    referral_code: varchar('referral_code', { length: 32 }),
    referred_by_user_id: uuid('referred_by_user_id'),
    status: userStatusEnum('status').default('ACTIVE').notNull(),
    is_bot: boolean('is_bot').default(false).notNull(),
    language_code: varchar('language_code', { length: 16 }),
    last_login_at: timestamp('last_login_at', { withTimezone: true }),
    last_ip: varchar('last_ip', { length: 64 }),
    ...timestamps
  },
  (t) => ({
    telegramUnique: uniqueIndex('users_telegram_id_unique').on(t.telegram_id),
    referralUnique: uniqueIndex('users_referral_code_unique').on(t.referral_code)
  })
);

export const admins = pgTable('admins', {
  id: uuid('id').defaultRandom().primaryKey(),
  username: varchar('username', { length: 64 }).notNull().unique(),
  password_hash: text('password_hash').notNull(),
  full_name: varchar('full_name', { length: 255 }).notNull(),
  role: varchar('role', { length: 32 }).default('ADMIN').notNull(),
  status: adminStatusEnum('status').default('ACTIVE').notNull(),
  last_login_at: timestamp('last_login_at', { withTimezone: true }),
  ...timestamps
});

export const adminPermissions = pgTable('admin_permissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  admin_id: uuid('admin_id').notNull().references(() => admins.id, { onDelete: 'cascade' }),
  permission_key: varchar('permission_key', { length: 128 }).notNull(),
  ...timestamps
});

export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  admin_id: uuid('admin_id').references(() => admins.id, { onDelete: 'cascade' }),
  role: roleEnum('role').notNull(),
  redis_session_key: varchar('redis_session_key', { length: 255 }).notNull().unique(),
  ip: varchar('ip', { length: 64 }),
  user_agent: text('user_agent'),
  is_active: boolean('is_active').default(true).notNull(),
  last_seen_at: timestamp('last_seen_at', { withTimezone: true }).defaultNow().notNull(),
  expires_at: timestamp('expires_at', { withTimezone: true }).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const wallets = pgTable('wallets', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  balance: numeric('balance', { precision: 20, scale: 6 }).default('0').notNull(),
  currency: varchar('currency', { length: 16 }).notNull(),
  status: walletStatusEnum('status').default('ACTIVE').notNull(),
  ...timestamps
});

export const walletTransactions = pgTable('wallet_transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id').notNull().references(() => users.id),
  wallet_id: uuid('wallet_id').notNull().references(() => wallets.id),
  type: walletTxTypeEnum('type').notNull(),
  direction: walletTxDirectionEnum('direction').notNull(),
  amount: numeric('amount', { precision: 20, scale: 6 }).notNull(),
  balance_before: numeric('balance_before', { precision: 20, scale: 6 }).notNull(),
  balance_after: numeric('balance_after', { precision: 20, scale: 6 }).notNull(),
  status: walletTxStatusEnum('status').default('SUCCESS').notNull(),
  reference_type: varchar('reference_type', { length: 64 }),
  reference_id: varchar('reference_id', { length: 64 }),
  external_reference: varchar('external_reference', { length: 128 }),
  description: text('description'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  created_by_admin_id: uuid('created_by_admin_id').references(() => admins.id),
  ...timestamps
});

export const deposits = pgTable(
  'deposits',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    user_id: uuid('user_id').notNull().references(() => users.id),
    amount: numeric('amount', { precision: 20, scale: 6 }).notNull(),
    currency: varchar('currency', { length: 16 }).notNull(),
    method: varchar('method', { length: 32 }).default('TELEBIRR').notNull(),
    status: depositStatusEnum('status').default('PENDING').notNull(),
    payment_reference: varchar('payment_reference', { length: 128 }).notNull(),
    external_reference: varchar('external_reference', { length: 128 }),
    verifier_source: varchar('verifier_source', { length: 64 }),
    raw_payload: jsonb('raw_payload').$type<Record<string, unknown>>(),
    verified_at: timestamp('verified_at', { withTimezone: true }),
    ...timestamps
  },
  (t) => ({
    payRefUnique: uniqueIndex('deposits_payment_reference_unique').on(t.payment_reference),
    userStatusIdx: index('deposits_user_status_idx').on(t.user_id, t.status)
  })
);

export const games = pgTable('games', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: varchar('code', { length: 64 }).notNull().unique(),
  name: varchar('name', { length: 128 }).notNull(),
  slug: varchar('slug', { length: 128 }).notNull().unique(),
  description: text('description'),
  is_active: boolean('is_active').default(true).notNull(),
  config: jsonb('config').$type<Record<string, unknown>>(),
  ...timestamps
});

export const gameSessions = pgTable('game_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id').notNull().references(() => users.id),
  game_id: uuid('game_id').notNull().references(() => games.id),
  session_token: varchar('session_token', { length: 128 }).notNull().unique(),
  status: gameSessionStatusEnum('status').default('CREATED').notNull(),
  bet_amount: numeric('bet_amount', { precision: 20, scale: 6 }).default('0').notNull(),
  win_amount: numeric('win_amount', { precision: 20, scale: 6 }).default('0').notNull(),
  result_payload: jsonb('result_payload').$type<Record<string, unknown>>(),
  game_payload: jsonb('game_payload').$type<Record<string, unknown>>(),
  started_at: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
  ended_at: timestamp('ended_at', { withTimezone: true }),
  ...timestamps
});

export const gameActions = pgTable('game_actions', {
  id: uuid('id').defaultRandom().primaryKey(),
  game_session_id: uuid('game_session_id').notNull().references(() => gameSessions.id, { onDelete: 'cascade' }),
  action_type: varchar('action_type', { length: 64 }).notNull(),
  request_payload: jsonb('request_payload').$type<Record<string, unknown>>(),
  response_payload: jsonb('response_payload').$type<Record<string, unknown>>(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  actor_type: actorTypeEnum('actor_type').notNull(),
  actor_id: uuid('actor_id'),
  action: varchar('action', { length: 128 }).notNull(),
  entity_type: varchar('entity_type', { length: 64 }).notNull(),
  entity_id: varchar('entity_id', { length: 64 }),
  old_values: jsonb('old_values').$type<Record<string, unknown>>(),
  new_values: jsonb('new_values').$type<Record<string, unknown>>(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  ip: varchar('ip', { length: 64 }),
  user_agent: text('user_agent'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const appSettings = pgTable('app_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  key: varchar('key', { length: 128 }).notNull().unique(),
  value: jsonb('value').$type<Record<string, unknown>>().notNull(),
  description: text('description'),
  updated_by_admin_id: uuid('updated_by_admin_id').references(() => admins.id),
  ...timestamps
});
