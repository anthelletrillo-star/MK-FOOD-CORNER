const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const tenants = await prisma.tenant.findMany();
  console.log('Tenants:', tenants.map(t => ({ id: t.id, slug: t.slug })));

  const categories = await prisma.category.findMany();
  console.log('Categories count:', categories.length);
  if (categories.length > 0) {
    console.log('Sample category:', categories[0]);
  }

  const products = await prisma.product.findMany();
  console.log('Products count:', products.length);
  if (products.length > 0) {
    console.log('Sample product:', products[0]);
  }
}

check().finally(() => prisma.$disconnect());
