const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Seeding database...');

  // Create default master tenant
  let masterTenant = await prisma.tenant.findUnique({ where: { slug: 'project-million' } });
  if (!masterTenant) {
    masterTenant = await prisma.tenant.create({
      data: {
        name: 'MK FOOD CORNER',
        slug: 'project-million',
        logo: '/favicon.png',
        favicon: '/favicon.png',
        primaryColor: '#f97316',
        secondaryColor: '#ef4444',
        active: true
      }
    });
    console.log('✅ Created master tenant: MK FOOD CORNER');
  } else {
    console.log('✅ Master tenant already exists');
  }

  // Create default users
  const adminPass = await bcrypt.hash('admin123', 12);
  const cashierPass = await bcrypt.hash('cashier123', 12);
  const kitchenPass = await bcrypt.hash('kitchen123', 12);

  const usersToCreate = [
    { email: 'admin@pos.com', password: adminPass, name: 'Admin', role: 'admin', tenantId: masterTenant.id },
    { email: 'cashier@pos.com', password: cashierPass, name: 'Cashier 1', role: 'cashier', tenantId: masterTenant.id },
    { email: 'kitchen@pos.com', password: kitchenPass, name: 'Kitchen Staff', role: 'kitchen', tenantId: masterTenant.id }
  ];

  for (const u of usersToCreate) {
    const exists = await prisma.user.findFirst({ where: { email: u.email, tenantId: u.tenantId } });
    if (!exists) {
      await prisma.user.create({ data: u });
      console.log(`  Created user: ${u.email}`);
    }
  }

  // Create categories
  let categories = await prisma.category.findMany({ where: { tenantId: masterTenant.id } });
  if (categories.length === 0) {
    const catData = [
      { name: 'Burgers', icon: '🍔', description: 'Juicy handcrafted burgers', sortOrder: 1, tenantId: masterTenant.id },
      { name: 'Chicken', icon: '🍗', description: 'Crispy fried chicken', sortOrder: 2, tenantId: masterTenant.id },
      { name: 'Rice Meals', icon: '🍚', description: 'Hearty rice meals', sortOrder: 3, tenantId: masterTenant.id },
      { name: 'Beverages', icon: '🥤', description: 'Refreshing drinks', sortOrder: 4, tenantId: masterTenant.id },
      { name: 'Milk Tea', icon: '🧋', description: 'Premium milk teas', sortOrder: 5, tenantId: masterTenant.id },
      { name: 'Desserts', icon: '🍰', description: 'Sweet treats', sortOrder: 6, tenantId: masterTenant.id },
      { name: 'Sides & Snacks', icon: '🍟', description: 'Perfect add-ons', sortOrder: 7, tenantId: masterTenant.id }
    ];
    for (const c of catData) {
      await prisma.category.create({ data: c });
    }
    categories = await prisma.category.findMany({ where: { tenantId: masterTenant.id } });
    console.log(`✅ Created ${categories.length} categories`);
  }

  // Create products
  const existingProducts = await prisma.product.findMany({ where: { tenantId: masterTenant.id } });
  if (existingProducts.length === 0 && categories.length > 0) {
    const catMap = {};
    categories.forEach(c => { catMap[c.name] = c.id; });

    const products = [
      { categoryId: catMap['Burgers'], name: 'Classic Burger', description: 'Beef patty with lettuce, tomato & special sauce', price: 89, stock: 50, tenantId: masterTenant.id },
      { categoryId: catMap['Burgers'], name: 'Cheese Burger', description: 'Classic burger with melted cheddar cheese', price: 109, stock: 50, tenantId: masterTenant.id },
      { categoryId: catMap['Burgers'], name: 'Double Patty Burger', description: 'Two juicy beef patties with all the fixings', price: 149, stock: 40, tenantId: masterTenant.id },
      { categoryId: catMap['Burgers'], name: 'Bacon Cheeseburger', description: 'Crispy bacon with cheddar on a beef patty', price: 139, stock: 40, tenantId: masterTenant.id },
      { categoryId: catMap['Chicken'], name: 'Fried Chicken (2pc)', description: 'Golden crispy fried chicken', price: 99, stock: 60, tenantId: masterTenant.id },
      { categoryId: catMap['Chicken'], name: 'Chicken Wings (6pc)', description: 'Spicy buffalo chicken wings', price: 149, stock: 40, tenantId: masterTenant.id },
      { categoryId: catMap['Chicken'], name: 'Chicken Tenders (4pc)', description: 'Breaded chicken strips with dip', price: 119, stock: 45, tenantId: masterTenant.id },
      { categoryId: catMap['Rice Meals'], name: 'Pork Adobo', description: 'Filipino-style braised pork with rice', price: 129, stock: 35, tenantId: masterTenant.id },
      { categoryId: catMap['Rice Meals'], name: 'Chicken Inasal', description: 'Grilled chicken marinated in citrus & annatto', price: 139, stock: 35, tenantId: masterTenant.id },
      { categoryId: catMap['Rice Meals'], name: 'Tapsilog', description: 'Beef tapa with garlic rice & egg', price: 119, stock: 30, tenantId: masterTenant.id },
      { categoryId: catMap['Rice Meals'], name: 'Sisig Rice Bowl', description: 'Sizzling pork sisig on steamed rice', price: 149, stock: 30, tenantId: masterTenant.id },
      { categoryId: catMap['Beverages'], name: 'Iced Tea', description: 'House blend iced tea', price: 39, stock: 100, tenantId: masterTenant.id },
      { categoryId: catMap['Beverages'], name: 'Coke / Sprite', description: 'Regular soda (12oz can)', price: 45, stock: 100, tenantId: masterTenant.id },
      { categoryId: catMap['Beverages'], name: 'Fresh Lemonade', description: 'Freshly squeezed lemonade', price: 55, stock: 80, tenantId: masterTenant.id },
      { categoryId: catMap['Beverages'], name: 'Hot Coffee', description: 'Freshly brewed Barako coffee', price: 65, stock: 80, tenantId: masterTenant.id },
      { categoryId: catMap['Milk Tea'], name: 'Classic Milk Tea', description: 'Traditional milk tea with pearls', price: 79, stock: 60, tenantId: masterTenant.id },
      { categoryId: catMap['Milk Tea'], name: 'Taro Milk Tea', description: 'Creamy taro flavored milk tea', price: 89, stock: 60, tenantId: masterTenant.id },
      { categoryId: catMap['Milk Tea'], name: 'Brown Sugar Milk Tea', description: 'Tiger sugar milk tea with boba', price: 99, stock: 50, tenantId: masterTenant.id },
      { categoryId: catMap['Milk Tea'], name: 'Matcha Milk Tea', description: 'Japanese matcha green tea latte', price: 99, stock: 50, tenantId: masterTenant.id },
      { categoryId: catMap['Desserts'], name: 'Halo-Halo', description: 'Classic Filipino shaved ice dessert', price: 89, stock: 40, tenantId: masterTenant.id },
      { categoryId: catMap['Desserts'], name: 'Leche Flan', description: 'Creamy caramel custard', price: 69, stock: 30, tenantId: masterTenant.id },
      { categoryId: catMap['Desserts'], name: 'Ube Ice Cream', description: 'Purple yam ice cream (2 scoops)', price: 59, stock: 50, tenantId: masterTenant.id },
      { categoryId: catMap['Sides & Snacks'], name: 'French Fries', description: 'Crispy golden fries with ketchup', price: 65, stock: 70, tenantId: masterTenant.id },
      { categoryId: catMap['Sides & Snacks'], name: 'Onion Rings', description: 'Beer-battered onion rings', price: 75, stock: 50, tenantId: masterTenant.id },
      { categoryId: catMap['Sides & Snacks'], name: 'Mozzarella Sticks', description: 'Fried mozzarella with marinara', price: 89, stock: 40, tenantId: masterTenant.id }
    ];

    for (const p of products) {
      if (p.categoryId) await prisma.product.create({ data: p });
    }
    console.log(`✅ Created ${products.length} products`);
  }

  console.log('');
  console.log('🎉 Database seeded successfully!');
  console.log('📋 Default accounts:');
  console.log('   Admin:   admin@pos.com / admin123');
  console.log('   Cashier: cashier@pos.com / cashier123');
  console.log('   Kitchen: kitchen@pos.com / kitchen123');
}

seed()
  .catch(e => { console.error('Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
