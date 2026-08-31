const { PrismaClient } = require('@prisma/client');
(async function(){
  const prisma = new PrismaClient();
  try {
    const tenants = await prisma.tenant.findMany();
    console.log(JSON.stringify(tenants, null, 2));
  } catch (e) {
    console.error('Error listing tenants:', e.message);
  } finally {
    await prisma.$disconnect();
  }
})();
