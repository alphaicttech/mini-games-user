import bcrypt from 'bcryptjs';
import { db } from '../src/db';
import { companies, companyUsers, feePlans, receivingNumbers, walletAccounts } from '../src/db/schema';

async function run() {
  const passwordHash = await bcrypt.hash('Admin12345!', 12);

  const [company] = await db.insert(companies).values({
    name: 'Sample Sportsbook',
    slug: 'sample-sportsbook',
    allowedReturnUrls: ['https://sportsbook.example/success', 'https://sportsbook.example/fail'],
    allowedDomains: ['sportsbook.example']
  }).returning();

  await db.insert(companyUsers).values([
    {
      companyId: company.id,
      email: 'superadmin@example.com',
      fullName: 'Super Admin',
      passwordHash,
      role: 'SUPER_ADMIN'
    },
    {
      companyId: company.id,
      email: 'owner@sportsbook.example',
      fullName: 'Company Owner',
      passwordHash,
      role: 'COMPANY_OWNER'
    }
  ]);

  await db.insert(receivingNumbers).values({
    companyId: company.id,
    phoneNumber: '251911111118',
    accountHolderName: 'Shemeles Kumessa Moreda',
    label: 'Primary Number',
    status: 'ACTIVE',
    priorityWeight: 5
  });

  await db.insert(walletAccounts).values({
    companyId: company.id,
    availableBalance: '10000',
    reservedBalance: '0',
    currency: 'ETB'
  });

  await db.insert(feePlans).values({
    name: 'Default Hybrid 3%',
    type: 'HYBRID',
    config: { fixed: 0, percentage: 3 }
  });

  console.log('seed complete');
}

run().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
