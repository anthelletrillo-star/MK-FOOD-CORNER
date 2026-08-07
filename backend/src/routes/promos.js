const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { authenticate, authorize } = require('../middleware/auth');

// Public endpoint to validate and calculate promo code
router.post('/validate', async (req, res) => {
  try {
    const { tenantSlug, code, items } = req.body; // items = [{ productId, quantity, price, categoryId }]

    if (!tenantSlug || !code || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug }
    });

    if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found' });
    
    // Check if Super Admin killed the promo system
    if (tenant.saPromoDisabled) {
      return res.status(400).json({ success: false, message: 'Promotions are currently disabled for this store.' });
    }

    const promo = await prisma.promoCode.findUnique({
      where: {
        tenantId_code: {
          tenantId: tenant.id,
          code: code.toUpperCase()
        }
      }
    });

    if (!promo || !promo.isActive) {
      return res.status(400).json({ success: false, message: 'Invalid or expired promo code' });
    }

    // Check dates
    const now = new Date();
    if (promo.startDate && now < promo.startDate) {
      return res.status(400).json({ success: false, message: 'This promo code is not yet active.' });
    }
    if (promo.endDate && now > promo.endDate) {
      return res.status(400).json({ success: false, message: 'This promo code has expired.' });
    }

    // Check usage limits
    if (promo.maxUses && promo.currentUses >= promo.maxUses) {
      return res.status(400).json({ success: false, message: 'This promo code has reached its usage limit.' });
    }

    let subtotal = 0;
    let applicableSubtotal = 0;

    // Calculate how much of the cart applies to the discount
    items.forEach(item => {
      const itemTotal = parseFloat(item.price) * parseInt(item.quantity);
      subtotal += itemTotal;

      let isApplicable = false;
      if (promo.appliesTo === 'ALL') {
        isApplicable = true;
      } else if (promo.appliesTo === 'PRODUCT' && promo.targetId === item.productId) {
        isApplicable = true;
      } else if (promo.appliesTo === 'CATEGORY' && promo.targetId === item.categoryId) {
        isApplicable = true;
      }

      if (isApplicable) {
        applicableSubtotal += itemTotal;
      }
    });

    if (applicableSubtotal === 0) {
      return res.status(400).json({ success: false, message: 'This promo code does not apply to any items in your cart.' });
    }

    // Calculate discount
    let discountAmount = 0;
    if (promo.type === 'PERCENTAGE') {
      discountAmount = applicableSubtotal * (promo.value / 100);
    } else if (promo.type === 'FIXED') {
      // Don't discount more than the applicable amount
      discountAmount = Math.min(applicableSubtotal, promo.value);
    }

    // Round to 2 decimals
    const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
    discountAmount = round2(discountAmount || 0);

    // Return the response without applying it, just so frontend can display
    res.json({
      success: true,
      data: {
        promoId: promo.id,
        code: promo.code,
        discountAmount: discountAmount
      }
    });

  } catch (error) {
    console.error('Validate promo error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Admin endpoints (require auth & admin)
router.use(authenticate, authorize('admin'));

// GET /api/promos
router.get('/', async (req, res) => {
  try {
    const promos = await prisma.promoCode.findMany({
      where: { tenantId: req.user.tenantId },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: promos });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch promos' });
  }
});

// POST /api/promos
router.post('/', async (req, res) => {
  try {
    const data = req.body;
    data.tenantId = req.user.tenantId;
    data.code = data.code.toUpperCase();
    
    // Check if code exists
    const existing = await prisma.promoCode.findUnique({
      where: {
        tenantId_code: {
          tenantId: req.user.tenantId,
          code: data.code
        }
      }
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'A promo code with this name already exists' });
    }

    const promo = await prisma.promoCode.create({
      data: {
        tenantId: req.user.tenantId,
        code: data.code,
        type: data.type,
        value: parseFloat(data.value),
        appliesTo: data.appliesTo || 'ALL',
        targetId: data.targetId ? parseInt(data.targetId) : null,
        maxUses: data.maxUses ? parseInt(data.maxUses) : null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        isActive: data.isActive !== undefined ? data.isActive : true
      }
    });

    res.status(201).json({ success: true, data: promo });
  } catch (error) {
    console.error('Create promo error:', error);
    res.status(500).json({ success: false, message: 'Failed to create promo code' });
  }
});

// PUT /api/promos/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    
    if (data.code) data.code = data.code.toUpperCase();
    if (data.value) data.value = parseFloat(data.value);
    if (data.targetId) data.targetId = parseInt(data.targetId);
    if (data.maxUses) data.maxUses = parseInt(data.maxUses);
    if (data.startDate) data.startDate = new Date(data.startDate);
    if (data.endDate) data.endDate = new Date(data.endDate);

    const promo = await prisma.promoCode.updateMany({
      where: { id: parseInt(id), tenantId: req.user.tenantId },
      data
    });

    res.json({ success: true, data: promo });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update promo' });
  }
});

// DELETE /api/promos/:id
router.delete('/:id', async (req, res) => {
  try {
    await prisma.promoCode.deleteMany({
      where: { id: parseInt(req.params.id), tenantId: req.user.tenantId }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete promo' });
  }
});

module.exports = router;
