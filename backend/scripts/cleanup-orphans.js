require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const Loan = require('../models/Loan');
const Customer = require('../models/Customer');

async function cleanupOrphans() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all loans
    const loans = await Loan.find({});
    console.log(`Found ${loans.length} total loans.`);

    let deletedCount = 0;

    for (const loan of loans) {
      if (!loan.customerId) {
        console.log(`Deleting loan ${loan._id} (No customerId)`);
        await Loan.findByIdAndDelete(loan._id);
        deletedCount++;
        continue;
      }

      const customerExists = await Customer.findById(loan.customerId);
      if (!customerExists) {
        console.log(`Deleting loan ${loan._id} (Orphaned, customer ${loan.customerId} not found)`);
        await Loan.findByIdAndDelete(loan._id);
        deletedCount++;
      }
    }

    console.log(`Cleanup complete. Deleted ${deletedCount} orphaned loans.`);
    process.exit(0);
  } catch (err) {
    console.error('Error during cleanup:', err);
    process.exit(1);
  }
}

cleanupOrphans();
