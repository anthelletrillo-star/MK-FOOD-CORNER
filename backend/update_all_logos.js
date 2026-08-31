require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Updating all tenants in database with /icon-app.png...');
  const tenants = await prisma.tenant.findMany();
  for (const t of tenants) {
    await prisma.tenant.update({
      where: { id: t.id },
      data: {
        logo: '/icon-app.png',
        favicon: '/icon-app.png',
        name: 'MK FOOD CORNER'
      }
    });
    console.log(`✅ Updated Tenant ID ${t.id} (${t.name}) to logo: /icon-app.png`);
  }
  console.log('🎉 All tenant logos successfully updated in database!');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
