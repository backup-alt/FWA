require('dotenv').config();
const mongoose = require('mongoose');
const Customer = require('../models/Customer');
const Loan = require('../models/Loan');
const { uploadBase64ToPcloud, deleteFromPcloud, getPublicLink, base64ToBuffer } = require('../utils/pcloud');
const pcloudConfig = require('../config/pcloud');

async function migrateCustomerProfileImages() {
  console.log('\n=== Migrating Customer Profile Images ===');

  const customers = await Customer.find({
    $or: [
      { profileImage: { $exists: true, $ne: '' } },
      { profileImageFileId: { $exists: false } },
    ]
  }).lean();

  console.log(`Found ${customers.length} customers with profile images to migrate`);

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const customer of customers) {
    try {
      const existingBase64 = customer.profileImage;
      const existingFileId = customer.profileImageFileId;

      if (!existingBase64 && !existingFileId) {
        skipped++;
        continue;
      }

      if (existingFileId && !existingBase64) {
        console.log(`  [SKIP] Customer ${customer._id} already has fileId, no Base64 to migrate`);
        skipped++;
        continue;
      }

      if (existingBase64 && existingBase64.startsWith('data:')) {
        console.log(`  Migrating profile image for customer ${customer._id} (${customer.name})...`);

        const filename = `profile_${customer._id}_${Date.now()}`;
        const fileId = await uploadBase64ToPcloud(
          existingBase64,
          filename,
          pcloudConfig.folders.profilePictures
        );

        const url = await getPublicLink(fileId);

        await Customer.updateOne(
          { _id: customer._id },
          {
            $set: { profileImageFileId: fileId, profileImageUrl: url },
            $unset: { profileImage: 1 }
          }
        );

        console.log(`    -> Uploaded to pcloud, fileId: ${fileId}`);
        migrated++;
      } else if (existingBase64 && !existingBase64.startsWith('data:')) {
        await Customer.updateOne(
          { _id: customer._id },
          { $set: { profileImageUrl: existingBase64, profileImageFileId: '' }, $unset: { profileImage: 1 } }
        );
        migrated++;
      } else {
        skipped++;
      }
    } catch (err) {
      console.error(`    [ERROR] Failed to migrate customer ${customer._id}:`, err.message);
      errors++;
    }
  }

  console.log(`\nCustomer migration complete: ${migrated} migrated, ${skipped} skipped, ${errors} errors`);
  return { migrated, skipped, errors };
}

async function migrateLoanDocuments() {
  console.log('\n=== Migrating Loan Documents ===');

  const loans = await Loan.find({
    'documents.0': { $exists: true }
  }).lean();

  console.log(`Found ${loans.length} loans with documents`);

  let totalDocs = 0;
  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const loan of loans) {
    const docUpdates = [];

    for (const doc of loan.documents) {
      totalDocs++;

      try {
        const hasBase64 = doc.data && doc.data.startsWith('data:');
        const hasFileId = doc.fileId && doc.fileId.length > 0;

        if (hasFileId && !hasBase64) {
          skipped++;
          continue;
        }

        if (hasBase64) {
          console.log(`  Migrating document "${doc.name}" for loan ${loan._id}...`);

          const filename = `doc_${loan._id}_${doc._id}_${Date.now()}`;
          const fileId = await uploadBase64ToPcloud(
            doc.data,
            filename,
            pcloudConfig.folders.documents
          );

          docUpdates.push({ docId: doc._id.toString(), fileId, clearData: true });
          console.log(`    -> Uploaded to pcloud, fileId: ${fileId}`);
          migrated++;
        } else if (doc.data && !hasBase64) {
          docUpdates.push({ docId: doc._id.toString(), clearData: true });
          migrated++;
        } else {
          skipped++;
        }
      } catch (err) {
        console.error(`    [ERROR] Failed to migrate document ${doc._id}:`, err.message);
        errors++;
      }
    }

    if (docUpdates.length > 0) {
      for (const upd of docUpdates) {
        const updateOps = { $set: { 'documents.$.fileId': upd.fileId || '' } };
        if (upd.clearData) updateOps.$unset = { 'documents.$.data': 1 };
        await Loan.updateOne(
          { _id: loan._id, 'documents._id': upd.docId },
          updateOps
        );
      }
      console.log(`    Updated ${docUpdates.length} documents for loan ${loan._id}`);
    }
  }

  console.log(`\nLoan documents migration complete: ${migrated} migrated, ${skipped} skipped, ${errors} errors (of ${totalDocs} total)`);
  return { migrated, skipped, errors, total: totalDocs };
}

async function cleanupOldFields() {
  console.log('\n=== Cleaning up old fields ===');

  try {
    const customerResult = await Customer.updateMany(
      { profileImage: { $exists: true } },
      { $unset: { profileImage: 1 } }
    );
    console.log(`  Cleared profileImage from ${customerResult.modifiedCount} customers`);

    const loanResult = await Loan.updateMany(
      { 'documents.data': { $exists: true } },
      { $unset: { 'documents.$.data': 1 } }
    );
    console.log(`  Cleared data field from documents`);
  } catch (err) {
    console.error('  [ERROR] Cleanup error:', err.message);
  }
}

async function main() {
  console.log('===========================================');
  console.log('  pcloud Migration Script');
  console.log('  Migrating Base64 images to pcloud storage');
  console.log('===========================================');

  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/vehicle_finance';
  console.log(`\nConnecting to MongoDB: ${mongoUri}`);

  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB\n');
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  }

  const startTime = Date.now();

  try {
    const customerStats = await migrateCustomerProfileImages();
    const loanStats = await migrateLoanDocuments();

    console.log('\n===========================================');
    console.log('  Migration Summary');
    console.log('===========================================');
    console.log(`  Customer profiles: ${customerStats.migrated} migrated, ${customerStats.skipped} skipped, ${customerStats.errors} errors`);
    console.log(`  Loan documents: ${loanStats.migrated} migrated, ${loanStats.skipped} skipped, ${loanStats.errors} errors`);
    console.log(`  Total time: ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
    console.log('===========================================\n');

    console.log('NOTE: You can now run the cleanup to remove old fields, or run it later.');
    console.log('Cleanup command: node backend/scripts/migrateImagesToPcloud.js --cleanup\n');

  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

if (require.main === module) {
  main();
}

module.exports = { migrateCustomerProfileImages, migrateLoanDocuments, cleanupOldFields };