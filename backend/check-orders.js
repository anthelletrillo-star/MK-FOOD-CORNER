const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAllOrders() {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        customerName: true,
        tenantId: true,
        createdAt: true
      }
    });
    console.log('Recent orders across ALL tenants:');
    console.log(JSON.stringify(orders, null, 2));
    console.log(`Total orders found: ${orders.length}`);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllOrders();
