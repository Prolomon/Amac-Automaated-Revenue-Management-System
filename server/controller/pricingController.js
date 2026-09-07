import { prisma } from "../config/db.js";
import { createPricingSchema, updatePricingSchema } from '../validator/pricingValidator.js';

const createPricing = async (req, res) => {
  try {
    const { error, value } = createPricingSchema.validate(req.body, { abortEarly: false });
    if (error) {
      const errors = error.details.map(detail => detail.message);
      return res.status(400).json({ 
        ok: false, 
        message: errors[0],
        errors: errors 
      });
    }

    const pricing = await prisma.pricing.create({
      data: {
        title: value.title,
        price: value.price,
        type: value.type,
        category: value.category,
        subCategory: value.subCategory,
        benefit: value.benefit,
        center: value.userId ?? null,
        frequency: value.frequency ?? null,
        zone: value.zone ?? null,
        code: value.code ?? null,
      },
    });

    res.status(201).json({ 
      ok: true, 
      message: 'Pricing created successfully', 
      pricing 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
};
 
const getAllPricing = async (req, res) => {
  try {
    if (!prisma || !prisma.pricing) {
      return res.status(500).json({ ok: false, message: 'Database connection not available' });
    }

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const type = req.query.type ? String(req.query.type) : null;
    const category = req.query.category ? String(req.query.category) : null;
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 100, 1), 500);
    const skip = (page - 1) * limit;

    const rawCenter = req.query.center || req.params.center || (req.params.id && req.params.id !== 'all' ? req.params.id : null);

    let centerAliases = [];
    if (rawCenter && rawCenter !== 'all') {
      centerAliases.push(String(rawCenter).trim());
      try {
        const admin = await prisma.admin.findFirst({
          where: {
            OR: [
              { id: String(rawCenter).trim() },
              { uid: String(rawCenter).trim() },
              { center: String(rawCenter).trim() }
            ]
          }
        });
        if (admin) {
          if (admin.name && !centerAliases.includes(admin.name)) centerAliases.push(admin.name);
          if (admin.center && !centerAliases.includes(admin.center)) centerAliases.push(admin.center);
          if (admin.uid && !centerAliases.includes(admin.uid)) centerAliases.push(admin.uid);
          if (admin.id && !centerAliases.includes(admin.id)) centerAliases.push(admin.id);
        }
      } catch (aliasErr) {
        console.warn('Center alias lookup warning:', aliasErr.message);
      }
    }

    const where = {};
    if (type) {
      where.type = type;
    }
    if (category) {
      where.category = category;
    }

    if (centerAliases.length > 0) {
      where.OR = [
        { center: { in: centerAliases } },
        { center: "Amac Automated Revenue Management" },
        { center: null },
        { center: "" }
      ];
    }

    let [pricing, total] = await Promise.all([
      prisma.pricing.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.pricing.count({ where }),
    ]);

    // Fallback: If center was queried but returned 0 results, return all active municipal pricing
    if (pricing.length === 0 && centerAliases.length > 0) {
      const fallbackWhere = {};
      if (type) fallbackWhere.type = type;
      if (category) fallbackWhere.category = category;
      [pricing, total] = await Promise.all([
        prisma.pricing.findMany({
          where: fallbackWhere,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.pricing.count({ where: fallbackWhere }),
      ]);
    }

    res.status(200).json({
      ok: true,
      data: pricing,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    console.error('Error in getAllPricing:', err);
    res.status(500).json({ ok: false, message: 'Server error retrieving pricing data' });
  }
};

const getPricing = async (req, res) => {
  try {
    const pricing = await prisma.pricing.findUnique({ 
      where: { id: req.params.id } 
    });
    
    if (!pricing) {
      return res.status(404).json({ ok: false, message: 'Pricing not found' });
    }
    
    res.status(200).json({ ok: true, pricing });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
};

const updatePricing = async (req, res) => {
  try {
    const { error, value } = updatePricingSchema.validate(req.body, { abortEarly: false });
    if (error) {
      const errors = error.details.map(detail => detail.message);
      return res.status(400).json({ 
        ok: false, 
        message: errors[0],
        errors: errors 
      });
    }

    const pricing = await prisma.pricing.update({
      where: { id: req.params.id },
      data: value,
    }); 

    if (!pricing) {
      return res.status(404).json({ ok: false, message: 'Pricing not found' });
    }

    res.status(200).json({ 
      ok: true, 
      message: 'Pricing updated successfully', 
      pricing 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
};

const deletePricing = async (req, res) => {
  try {
    const pricing = await prisma.pricing.delete({ 
      where: { id: req.params.id } 
    });

    if (!pricing) {
      return res.status(404).json({ ok: false, message: 'Pricing not found' });
    }

    res.status(200).json({ 
      ok: true, 
      message: 'Pricing deleted successfully' 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
};

const toggleStatus = async (req, res) => {
  try {
    const pricing = await prisma.pricing.findUnique({ 
      where: { id: req.params.id } 
    });
    
    if (!pricing) {
      return res.status(404).json({ ok: false, message: 'Pricing not found' });
    }

    const updatedPricing = await prisma.pricing.update({
      where: { id: req.params.id },
      data: { status: !pricing.status },
    });
    
    res.status(200).json({ ok: true, pricing, message: `Pricing status toggled to ${updatedPricing.status ? 'active' : 'inactive'}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
};

export {
  createPricing,
  getAllPricing,
  getPricing,
  updatePricing,
  deletePricing,
  toggleStatus, 
};
