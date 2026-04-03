import { app } from './app';
import { env } from './env';
import { db } from './db';
import { admins } from './db/schema/index';
import { eq } from 'drizzle-orm';
import { hashPassword } from './utils/password';

const bootstrap = async () => {
  const existing = await db.query.admins.findFirst({ where: eq(admins.username, env.ADMIN_DEFAULT_USERNAME) });
  if (!existing) {
    await db.insert(admins).values({
      username: env.ADMIN_DEFAULT_USERNAME,
      password_hash: await hashPassword(env.ADMIN_DEFAULT_PASSWORD),
      full_name: 'System Super Admin',
      role: 'SUPER_ADMIN'
    });
    console.log('Seeded default admin');
  }

  app.listen(env.PORT, () => {
    console.log(`${env.APP_NAME} running on :${env.PORT}`);
  });
};

bootstrap().catch((err) => {
  console.error('Startup failed', err);
  process.exit(1);
});
