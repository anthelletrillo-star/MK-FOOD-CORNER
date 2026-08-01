const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const today = new Date();
  today.setHours(0,0,0,0);
  const inventoryLogs = await prisma.inventoryLog.findMany({
    where: { reason: { in: ['order', 'waste'] }, createdAt: { gte: today } },
    include: { product: { select: { name: true, costPrice: true } } }
  });
  const rawLogs = await prisma.rawIngredientLog.findMany({
    where: { reason: { in: ['order', 'waste'] }, createdAt: { gte: today } },
    include: { rawIngredient: { select: { name: true, costPrice: true } } }
  });
  let totalCogs = 0;
  console.log("--- PRODUCT LOGS ---");
  inventoryLogs.forEach(l => {
    const cost = Math.abs(l.quantityChange) * (l.product?.costPrice || 0);
    totalCogs += cost;
    console.log(`- ${Math.abs(l.quantityChange)}x ${l.product?.name} @ ₱${l.product?.costPrice || 0} = ₱${cost}`);
  });
  console.log("--- RAW INGREDIENT LOGS ---");
  rawLogs.forEach(l => {
    const cost = Math.abs(l.quantityChange) * (l.rawIngredient?.costPrice || 0);
    totalCogs += cost;
    console.log(`- ${Math.abs(l.quantityChange)}x ${l.rawIngredient?.name} @ ₱${l.rawIngredient?.costPrice || 0} = ₱${cost}`);
  });
  console.log(`\nTOTAL COGS FOR TODAY: ₱${totalCogs}`);
}
check().catch(console.error).finally(() => prisma.$disconnect());
