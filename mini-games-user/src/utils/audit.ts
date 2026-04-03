import { db } from '../db';
import { auditLogs } from '../db/schema/index';

export const writeAuditLog = async (input: typeof auditLogs.$inferInsert) => {
  await db.insert(auditLogs).values(input);
};
