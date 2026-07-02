require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Customer = require('../models/Customer');

const CUSTOMERS_DIR = path.join(__dirname, '..', '..', 'pdf_images', 'customers');

async function parseFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  const data = {};
  for (const line of lines) {
    const match = line.match(/^\s*([A-Za-z][A-Za-z ]*?)\s*:\s*(.*?)\s*$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      data[key] = value;
    }
  }

  const customerName = data['Customer Name'] || '';
  const call = data['Call'] || '';
  const guarantorRaw = data['guarantor Number'] || '';

  const guarantorPhone = guarantorRaw
    .split(',')
    .map(p => p.trim())
    .filter(Boolean)[0] || '';

  return {
    name: customerName,
    cellNumbers: call ? [{ number: call }] : [],
    guarantor: {
      name: '',
      address: '',
      mobile: guarantorPhone,
    },
    address: '',
    temporaryAddress: '',
    monthlySalary: 0,
    idProofType: '',
    idProofNumber: '',
    profileImageFileId: '',
    profileImageUrl: '',
  };
}

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI not found in backend/.env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const files = fs.readdirSync(CUSTOMERS_DIR)
    .filter(f => f.endsWith('.txt'))
    .sort();

  console.log(`Found ${files.length} customer files\n`);

  let imported = 0;
  let failed = 0;

  for (const file of files) {
    try {
      const filePath = path.join(CUSTOMERS_DIR, file);
      const data = await parseFile(filePath);

      const customer = await Customer.create(data);
      console.log(`[${imported + failed + 1}/${files.length}] Created customer: _id=${customer._id}, name=${data.name}, phone=${data.cellNumbers[0]?.number}, guarantor=${data.guarantor.mobile}`);
      imported++;
    } catch (err) {
      console.error(`[${file}] Error: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n=== Import Summary ===`);
  console.log(`Total: ${files.length} | Imported: ${imported} | Failed: ${failed}`);

  await mongoose.disconnect();
}

main();