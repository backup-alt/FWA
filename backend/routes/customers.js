const express = require('express');
const mongoose = require('mongoose');
const Customer = require('../models/Customer');
const Loan = require('../models/Loan');
const authMiddleware = require('../middleware/auth');
const {
  uploadBase64ToPcloud,
  deleteFromPcloud,
} = require('../utils/pcloud');
const pcloudConfig = require('../config/pcloud');

const router = express.Router();
router.use(authMiddleware);

async function shapeCustomerResponse(customer) {
  if (!customer) return customer;
  const obj = typeof customer.toObject === 'function' ? customer.toObject() : { ...customer };
  const fileId = obj.profileImageFileId || '';

  if (fileId) {
    try {
      const { getPublicLink } = require('../utils/pcloud');
      obj.profileImage = await getPublicLink(fileId, pcloudConfig.publinkCode.profilePictures);
    } catch {
      obj.profileImage = '';
    }
  } else {
    obj.profileImage = '';
  }
  return obj;
}

async function uploadProfileImage(base64Data) {
  if (!base64Data || !base64Data.startsWith('data:')) {
    return { fileId: '' };
  }
  const filename = `profile_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const fileId = await uploadBase64ToPcloud(
    base64Data,
    filename,
    pcloudConfig.folders.profilePictures,
    true
  );
  return { fileId };
}

async function deleteProfileImage(fileId) {
  if (!fileId) return;
  try {
    await deleteFromPcloud(fileId);
  } catch (err) {
    console.error(`Failed to delete profile image ${fileId} from pcloud:`, err.message);
  }
}

router.post('/', async (req, res) => {
  try {
    const {
      name, address, temporaryAddress, monthlySalary, cellNumbers, guarantor,
      profileImage, idProofType, idProofNumber,
    } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Customer name is required.' });
    }

    let profileImageFileId = '';

    if (profileImage && profileImage.startsWith('data:')) {
      try {
        const uploaded = await uploadProfileImage(profileImage);
        profileImageFileId = uploaded.fileId;
      } catch (err) {
        console.error('Profile image upload failed:', err.message);
        return res.status(500).json({ message: 'Failed to upload profile image.' });
      }
    }

    const customer = new Customer({
      name,
      address,
      temporaryAddress,
      monthlySalary,
      cellNumbers: (cellNumbers || []).filter(c => c.number),
      guarantor,
      profileImageFileId,
      idProofType,
      idProofNumber,
    });

    await customer.save();
    const shapedCustomer = await shapeCustomerResponse(customer);
    res.status(201).json(shapedCustomer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error creating customer.' });
  }
});

router.get('/', async (req, res) => {
  try {
    const { search, searchType } = req.query;
    let customers = await Customer.find().sort({ createdAt: -1 }).lean();
    let customerIds = null;

    if (search && searchType === 'regNo') {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const matchingLoans = await Loan.find({
        regNo: { $regex: escapedSearch, $options: 'i' }
      }).select('customerId regNo').lean();

      customerIds = [...new Set(
        matchingLoans
          .map(l => l.customerId ? l.customerId.toString() : null)
          .filter(Boolean)
      )];
      customers = customers.filter(c => customerIds.includes(c._id.toString()));
    }

    const loanAgg = await Loan.aggregate([
      customerIds ? { $match: { customerId: { $in: customerIds.map(id => new mongoose.Types.ObjectId(id)) } } } : { $match: {} },
      {
        $group: {
          _id: '$customerId',
          loanCount: { $sum: 1 },
          totalOutstanding: { $sum: '$outstandingPrincipal' },
          activeLoans: {
            $sum: { $cond: [{ $eq: ['$status', 'Active'] }, 1, 0] },
          },
          bikeRegNos: {
            $push: {
              $cond: [
                { $eq: ['$vehicleType', 'Bike'] },
                '$regNo',
                '$$REMOVE'
              ]
            }
          },
          carRegNos: {
            $push: {
              $cond: [
                { $eq: ['$vehicleType', 'Car'] },
                '$regNo',
                '$$REMOVE'
              ]
            }
          },
          bikeCount: { $sum: { $cond: [{ $eq: ['$vehicleType', 'Bike'] }, 1, 0] } },
          carCount: { $sum: { $cond: [{ $eq: ['$vehicleType', 'Car'] }, 1, 0] } },
        },
      },
    ]);

    const loanMap = {};
    loanAgg.forEach(agg => {
      loanMap[agg._id?.toString()] = agg;
    });

    const result = await Promise.all(customers.map(async c => {
      const agg = loanMap[c._id.toString()] || {};
      const shaped = await shapeCustomerResponse(c);
      return {
        ...shaped,
        loanCount: agg.loanCount || 0,
        totalOutstanding: agg.totalOutstanding || 0,
        activeLoans: agg.activeLoans || 0,
        bikeRegNos: (agg.bikeRegNos || []).filter(r => r),
        carRegNos: (agg.carRegNos || []).filter(r => r),
        bikeCount: agg.bikeCount || 0,
        carCount: agg.carCount || 0,
      };
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching customers.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).lean();
    if (!customer) return res.status(404).json({ message: 'Customer not found.' });

    const loans = await Loan.find({ customerId: customer._id }).sort({ createdAt: -1 }).lean();

    const shapedCustomer = await shapeCustomerResponse(customer);
    res.json({
      customer: shapedCustomer,
      loans,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching customer.' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found.' });

    const oldName = customer.name;
    const oldProfileFileId = customer.profileImageFileId;

    const scalarFields = [
      'name', 'address', 'temporaryAddress', 'monthlySalary',
      'idProofType', 'idProofNumber',
    ];
    scalarFields.forEach(field => {
      if (req.body[field] !== undefined) {
        customer[field] = req.body[field];
      }
    });

    if (req.body.cellNumbers !== undefined) {
      customer.cellNumbers = (req.body.cellNumbers || []).filter(c => c.number);
    }
    if (req.body.guarantor !== undefined) {
      customer.guarantor = req.body.guarantor;
    }

    if (req.body.profileImage !== undefined) {
      const incoming = req.body.profileImage;

      if (!incoming || incoming === '') {
        if (customer.profileImageFileId) {
          await deleteProfileImage(customer.profileImageFileId);
        }
        customer.profileImageFileId = '';
      } else if (incoming.startsWith('data:')) {
        let uploaded;
        try {
          uploaded = await uploadProfileImage(incoming);
        } catch (err) {
          console.error('Profile image upload failed:', err.message);
          return res.status(500).json({ message: 'Failed to upload profile image.' });
        }

        if (customer.profileImageFileId && customer.profileImageFileId !== uploaded.fileId) {
          await deleteProfileImage(customer.profileImageFileId);
        }
        customer.profileImageFileId = uploaded.fileId;
      }
    }

    await customer.save();

    if (req.body.name !== undefined && req.body.name !== oldName) {
      await Loan.updateMany(
        { customerId: customer._id },
        { $set: { customerName: req.body.name } }
      );
    }

    const shapedCustomer = await shapeCustomerResponse(customer);
    res.json(shapedCustomer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating customer.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found.' });

    if (customer.profileImageFileId) {
      await deleteProfileImage(customer.profileImageFileId);
    }

    await Customer.findByIdAndDelete(req.params.id);
    await Loan.deleteMany({ customerId: req.params.id });

    res.json({ message: 'Customer and associated loans deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error deleting customer.' });
  }
});

module.exports = router;
