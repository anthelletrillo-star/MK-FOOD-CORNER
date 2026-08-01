const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const today = new Date();
  today.setHours(0,0,0,0);
  const expenses = await prisma.expense.findMany({
    where: {
      date: { gte: today }
    }
  });
  console.log("TODAY EXPENSES:", JSON.stringify(expenses, null, 2));
}
check().catch(console.error).finally(() => prisma.$disconnect());
