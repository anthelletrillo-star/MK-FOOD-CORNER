const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');

// Fetch tenant branding for the landing page
router.get('/tenant/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    if (!slug) return res.status(400).json({ success: false, message: 'Slug required' });

    const tenant = await prisma.tenant.findUnique({
      where: { slug: slug },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        favicon: true,
        ogImage: true,
        primaryColor: true,
        secondaryColor: true,
        bannerImage: true,
        bannerAssets: true,
        gcashQr: true,
        mayaQr: true,
        storeLat: true,
        storeLng: true,
        deliveryFeePerKm: true,
        active: true,
        storeClosed: true,
        deliveryDisabled: true,
        saDeliveryDisabled: true,
        saRewardsDisabled: true
      }
    });

    const defaultTenant = {
      id: 1,
      name: 'MK FOOD CORNER',
      slug: slug || 'project-million',
      logo: '/favicon.png',
      favicon: '/favicon.png',
      primaryColor: '#f97316',
      secondaryColor: '#ef4444',
      active: true,
      storeClosed: false,
      deliveryDisabled: false,
      saDeliveryDisabled: false,
      saRewardsDisabled: false,
      landing_description: 'Bringing home closer',
      seasonal_effect: 'auto',
      points_rate: 100
    };

    if (!tenant) {
      return res.json({ success: true, data: defaultTenant });
    }

    // Attempt to fetch landing description, but don't fail if it's missing
    try {
      const setting = await prisma.systemSetting.findFirst({
        where: { 
          tenantId: tenant.id, 
          key: 'landing_description' 
        }
      });
      tenant.landing_description = setting ? setting.value : null;
    } catch (settingError) {
      console.warn('Non-critical: Could not fetch landing description:', settingError.message);
      tenant.landing_description = null;
    }

    // Fetch active seasonal effect toggle and points rate
    try {
      const settings = await prisma.systemSetting.findMany({
        where: { 
          tenantId: tenant.id, 
          key: { in: ['seasonal_effect', 'points_rate'] } 
        }
      });
      const effectSetting = settings.find(s => s.key === 'seasonal_effect');
      tenant.seasonal_effect = effectSetting ? effectSetting.value : 'auto';

      const rateSetting = settings.find(s => s.key === 'points_rate');
      tenant.points_rate = rateSetting ? parseFloat(rateSetting.value) : 100;
    } catch (settingError) {
      tenant.seasonal_effect = 'auto';
      tenant.points_rate = 100;
    }

    res.json({ success: true, data: tenant });
  } catch (error) {
    console.error('CRITICAL Public Tenant Error:', error);
    res.json({ 
      success: true, 
      data: {
        id: 1,
        name: 'MK FOOD CORNER',
        slug: req.params.slug || 'project-million',
        logo: '/favicon.png',
        favicon: '/favicon.png',
        primaryColor: '#f97316',
        secondaryColor: '#fbbf24',
        active: true,
        storeClosed: false,
        deliveryDisabled: false,
        saDeliveryDisabled: false,
        saRewardsDisabled: false,
        landing_description: 'Bringing home closer',
        seasonal_effect: 'auto',
        points_rate: 100
      }
    });
  }
});

// GET /api/public/tenant/:slug/og-image
router.get('/tenant/:slug/og-image', async (req, res) => {
  try {
    const { slug } = req.params;
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: { ogImage: true, logo: true }
    });

    let ogImage = tenant?.ogImage || tenant?.logo;
    if (!ogImage || ogImage === '/logo.png') {
      ogImage = 'https://cdn-icons-png.flaticon.com/512/5787/5787016.png';
    }

    if (ogImage.startsWith('/')) {
      const host = req.headers.host || 'hometownbrew.vercel.app';
      const protocol = req.headers['x-forwarded-proto'] || 'https';
      return res.redirect(`${protocol}://${host}${ogImage}`);
    }

    return res.redirect(ogImage);
  } catch (error) {
    console.error('OG Image Redirect Error:', error);
    return res.redirect('https://cdn-icons-png.flaticon.com/512/5787/5787016.png');
  }
});

// Dynamic PWA Manifest for store-specific installation
router.get('/manifest/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: { name: true, logo: true, primaryColor: true }
    });

    const manifest = {
      short_name: tenant?.name || "Project Million",
      name: tenant?.name || "Project Million POS",
      description: `Official App for ${tenant?.name || 'Project Million'}`,
      icons: [
        {
          "src": tenant?.logo || "https://cdn-icons-png.flaticon.com/512/5787/5787016.png",
          "type": "image/png",
          "sizes": "192x192",
          "purpose": "any maskable"
        },
        {
          "src": tenant?.logo || "https://cdn-icons-png.flaticon.com/512/5787/5787016.png",
          "type": "image/png",
          "sizes": "512x512",
          "purpose": "any maskable"
        }
      ],
      start_url: "/",
      display: "standalone",
      theme_color: tenant?.primaryColor || "#f97316",
      background_color: "#ffffff"
    };

    res.setHeader('Content-Type', 'application/manifest+json');
    res.json(manifest);
  } catch (error) {
    console.error('Manifest Error:', error);
    res.status(500).json({ success: false, message: 'Manifest error' });
  }
});

// Social Share Bridge
router.get('/:slug', async (req, res) => {
  try {
    res.setHeader('X-Robots-Tag', 'all');
    const { slug } = req.params;
    const tenant = await prisma.tenant.findUnique({ where: { slug } });
    if (!tenant) return res.redirect('/');

    const title = tenant.name;
    const description = 'Explore our premium store.';
    const redirectUrl = `https://hometownbrew.vercel.app/menu`;

    let ogImage = tenant.ogImage || tenant.logo;
    if (!ogImage || ogImage === '/logo.png') {
      ogImage = 'https://cdn-icons-png.flaticon.com/512/5787/5787016.png';
    }
    if (ogImage && ogImage.startsWith('/')) {
      ogImage = `https://hometownbrew.vercel.app${ogImage}`;
    }

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <meta property="og:title" content="${title}">
        <meta property="og:description" content="${description}">
        <meta property="og:image" content="${ogImage}">
        <meta property="og:url" content="${redirectUrl}">
        <meta property="og:type" content="website">
        <meta http-equiv="refresh" content="0;url=${redirectUrl}">
      </head>
      <body style="background: #000; color: #fff; font-family: sans-serif; text-align: center; padding-top: 20%;">
        <h2>Redirecting to ${title}...</h2>
      </body>
      </html>
    `);
  } catch (err) {
    console.error('Share Error:', err);
    res.redirect('/');
  }
});

// Beta Registration
router.post('/beta/apply', async (req, res) => {
  try {
    const { name, businessName, email } = req.body;
    if (!name || !businessName || !email) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const application = await prisma.betaApplication.create({
      data: { name, businessName, email }
    });

    res.json({ success: true, data: application });
  } catch (error) {
    console.error('Beta Application Error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit application' });
  }
});

// Visit tracking endpoint
router.post('/tenant/:slug/visit', async (req, res) => {
  try {
    const { slug } = req.params;
    const tenant = await prisma.tenant.findUnique({ where: { slug }, select: { id: true } });
    if (!tenant) return res.status(404).json({ success: false });

    // Use Prisma to track count
    const setting = await prisma.systemSetting.findFirst({
      where: { tenantId: tenant.id, key: 'total_visits' }
    });

    if (setting) {
      await prisma.systemSetting.update({
        where: { id: setting.id },
        data: { value: (parseInt(setting.value) + 1).toString() }
      });
    } else {
      await prisma.systemSetting.create({
        data: { tenantId: tenant.id, key: 'total_visits', value: '1' }
      });
    }

    res.json({ success: true });
  } catch (error) {
    // Fail silently for analytics endpoint
    res.json({ success: false });
  }
});

// GET active packages for public menu
router.get('/tenant/:slug/packages', async (req, res) => {
  try {
    const { slug } = req.params;
    const tenant = await prisma.tenant.findUnique({ where: { slug }, select: { id: true } });
    if (!tenant) return res.status(404).json({ success: false, message: 'Store not found' });

    // Check if EventPackage model exists in Prisma client before querying
    if (!prisma.eventPackage) {
      return res.json({ success: true, data: [] });
    }

    const packages = await prisma.eventPackage.findMany({
      where: { tenantId: tenant.id, isActive: true },
      orderBy: { id: 'asc' }
    });
    res.json({ success: true, data: packages });
  } catch (error) {
    console.error('Public Packages Error:', error);
    // Gracefully return empty array instead of 500 to prevent frontend crash
    res.json({ success: true, data: [] });
  }
});

// GET /api/public/seed — Auto-seed database if empty
router.get('/seed', async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    
    // Ensure default master tenant exists
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
    }

    // Default users
    const adminPass = await bcrypt.hash('admin123', 12);
    const cashierPass = await bcrypt.hash('cashier123', 12);
    const kitchenPass = await bcrypt.hash('kitchen123', 12);

    const usersToCreate = [
      { email: 'admin@pos.com', password: adminPass, name: 'Admin', role: 'admin', tenantId: masterTenant.id },
      { email: 'cashier@pos.com', password: cashierPass, name: 'Cashier 1', role: 'cashier', tenantId: masterTenant.id },
      { email: 'kitchen@pos.com', password: kitchenPass, name: 'Kitchen Staff', role: 'kitchen', tenantId: masterTenant.id }
    ];

    for (const u of usersToCreate) {
      const exists = await prisma.user.findFirst({ where: { email: u.email } });
      if (!exists) await prisma.user.create({ data: u });
    }

    // Categories
    let existingCategories = await prisma.category.findMany({ where: { tenantId: masterTenant.id } });
    if (existingCategories.length === 0) {
      const categoriesData = [
        { name: 'Burgers', icon: '🍔', description: 'Juicy handcrafted burgers', sortOrder: 1, tenantId: masterTenant.id },
        { name: 'Chicken', icon: '🍗', description: 'Crispy fried chicken', sortOrder: 2, tenantId: masterTenant.id },
        { name: 'Rice Meals', icon: '🍚', description: 'Hearty rice meals', sortOrder: 3, tenantId: masterTenant.id },
        { name: 'Beverages', icon: '🥤', description: 'Refreshing drinks', sortOrder: 4, tenantId: masterTenant.id },
        { name: 'Milk Tea', icon: '🧋', description: 'Premium milk teas', sortOrder: 5, tenantId: masterTenant.id },
        { name: 'Desserts', icon: '🍰', description: 'Sweet treats', sortOrder: 6, tenantId: masterTenant.id },
        { name: 'Sides & Snacks', icon: '🍟', description: 'Perfect add-ons', sortOrder: 7, tenantId: masterTenant.id }
      ];
      for (const cData of categoriesData) {
        await prisma.category.create({ data: cData });
      }
      existingCategories = await prisma.category.findMany({ where: { tenantId: masterTenant.id } });
    }

    // Products
    const existingProducts = await prisma.product.findMany({ where: { tenantId: masterTenant.id } });
    if (existingProducts.length === 0 && existingCategories.length > 0) {
      const catMap = {};
      existingCategories.forEach(c => { catMap[c.name] = c.id; });

      const products = [
        { categoryId: catMap['Burgers'] || existingCategories[0].id, name: 'Classic Burger', description: 'Beef patty with lettuce, tomato & special sauce', price: 89, stock: 50, tenantId: masterTenant.id },
        { categoryId: catMap['Burgers'] || existingCategories[0].id, name: 'Cheese Burger', description: 'Classic burger with melted cheddar cheese', price: 109, stock: 50, tenantId: masterTenant.id },
        { categoryId: catMap['Burgers'] || existingCategories[0].id, name: 'Double Patty Burger', description: 'Two juicy beef patties with all the fixings', price: 149, stock: 40, tenantId: masterTenant.id },
        { categoryId: catMap['Chicken'] || existingCategories[0].id, name: 'Fried Chicken (2pc)', description: 'Golden crispy fried chicken', price: 99, stock: 60, tenantId: masterTenant.id },
        { categoryId: catMap['Chicken'] || existingCategories[0].id, name: 'Chicken Wings (6pc)', description: 'Spicy buffalo chicken wings', price: 149, stock: 40, tenantId: masterTenant.id },
        { categoryId: catMap['Rice Meals'] || existingCategories[0].id, name: 'Pork Adobo', description: 'Filipino-style braised pork with rice', price: 129, stock: 35, tenantId: masterTenant.id },
        { categoryId: catMap['Rice Meals'] || existingCategories[0].id, name: 'Tapsilog', description: 'Beef tapa with garlic rice & egg', price: 119, stock: 30, tenantId: masterTenant.id },
        { categoryId: catMap['Beverages'] || existingCategories[0].id, name: 'Iced Tea', description: 'House blend iced tea', price: 39, stock: 100, tenantId: masterTenant.id },
        { categoryId: catMap['Beverages'] || existingCategories[0].id, name: 'Fresh Lemonade', description: 'Freshly squeezed lemonade', price: 55, stock: 80, tenantId: masterTenant.id },
        { categoryId: catMap['Milk Tea'] || existingCategories[0].id, name: 'Classic Milk Tea', description: 'Traditional milk tea with pearls', price: 79, stock: 60, tenantId: masterTenant.id },
        { categoryId: catMap['Milk Tea'] || existingCategories[0].id, name: 'Brown Sugar Milk Tea', description: 'Tiger sugar milk tea with boba', price: 99, stock: 50, tenantId: masterTenant.id },
        { categoryId: catMap['Desserts'] || existingCategories[0].id, name: 'Halo-Halo', description: 'Classic Filipino shaved ice dessert', price: 89, stock: 40, tenantId: masterTenant.id },
        { categoryId: catMap['Sides & Snacks'] || existingCategories[0].id, name: 'French Fries', description: 'Crispy golden fries', price: 65, stock: 70, tenantId: masterTenant.id }
      ];

      for (const p of products) {
        if (p.categoryId) await prisma.product.create({ data: p });
      }
    }

    res.json({ success: true, message: 'Database setup and seeded successfully!' });
  } catch (err) {
    console.error('Seed route error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
