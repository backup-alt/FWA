const express = require('express');
const Customer = require('../models/Customer');
const Loan = require('../models/Loan');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// Create customer
router.post('/', async (req, res) => {
  try {
    const { name, address, monthlySalary, cellNumbers, guarantor, profileImage, idProofType, idProofNumber } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Customer name is required.' });
    }
    const customer = new Customer({
      name,
      address,
      monthlySalary,
      cellNumbers: (cellNumbers || []).filter(c => c.number),
      guarantor,
      profileImage,
      idProofType,
      idProofNumber,
    });
    await customer.save();
    res.status(201).json(customer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error creating customer.' });
  }
});

// List all customers (with loan count)
router.get('/', async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 }).lean();

    // Aggregate loan counts and totals per customer
    const loanAgg = await Loan.aggregate([
      {
        $group: {
          _id: '$customerId',
          loanCount: { $sum: 1 },
          totalOutstanding: { $sum: '$outstandingPrincipal' },
          activeLoans: {
            $sum: { $cond: [{ $eq: ['$status', 'Active'] }, 1, 0] },
          },
        },
      },
    ]);

    const loanMap = {};
    loanAgg.forEach(agg => {
      loanMap[agg._id?.toString()] = agg;
    });

    const result = customers.map(c => {
      const agg = loanMap[c._id.toString()] || {};
      return {
        ...c,
        loanCount: agg.loanCount || 0,
        totalOutstanding: agg.totalOutstanding || 0,
        activeLoans: agg.activeLoans || 0,
      };
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching customers.' });
  }
});

// Get single customer with their loans
router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).lean();
    if (!customer) return res.status(404).json({ message: 'Customer not found.' });

    const loans = await Loan.find({ customerId: customer._id }).sort({ createdAt: -1 }).lean();

    res.json({ customer, loans });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching customer.' });
  }
});

// Update customer
router.put('/:id', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found.' });

    const updatableFields = [
      'name', 'address', 'monthlySalary', 'cellNumbers',
      'guarantor', 'profileImage', 'idProofType', 'idProofNumber',
    ];

    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        customer[field] = req.body[field];
      }
    });

    await customer.save();
    res.json(customer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating customer.' });
  }
});

// Delete customer (and all their loans)
router.delete('/:id', async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found.' });
    await Loan.deleteMany({ customerId: req.params.id });
    res.json({ message: 'Customer and associated loans deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error deleting customer.' });
  }
});

module.exports = router;
