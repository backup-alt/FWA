const { MongoClient } = require('mongodb');

async function findOrphanedLoans() {
  const mongoUri = 'mongodb+srv://universeexplorer4_db_user:VrAJcf7MJqgcTejr@cluster0.ftabrot.mongodb.net/vehicleFinanceDB?retryWrites=true&w=majority&appName=Cluster0';

  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    console.log('Connected to MongoDB\n');

    const db = client.db('vehicleFinanceDB');

    // Get all customers
    const customers = await db.collection('customers').find({}).project({ _id: 1 }).toArray();
    const customerIds = new Set(customers.map(c => c._id.toString()));

    console.log(`Total customers: ${customerIds.size}`);

    // Get all loans
    const loans = await db.collection('loans').find({}).project({ _id: 1, customerId: 1, customerName: 1, vehicleType: 1, regNo: 1, status: 1 }).toArray();

    console.log(`Total loans: ${loans.length}\n`);

    // Find orphaned loans (customerId exists but not in customers collection)
    const orphanedLoans = loans.filter(loan => {
      const customerIdStr = loan.customerId ? loan.customerId.toString() : null;
      return customerIdStr && !customerIds.has(customerIdStr);
    });

    console.log('='.repeat(80));
    console.log(`ORPHANED LOANS - customerId not in customers table (${orphanedLoans.length} found)`);
    console.log('='.repeat(80));

    if (orphanedLoans.length === 0) {
      console.log('\nNo orphaned loans found. All loans have valid customer references.');
    } else {
      orphanedLoans.forEach((loan, index) => {
        console.log(`\n${index + 1}. Loan ID: ${loan._id}`);
        console.log(`   CustomerID: ${loan.customerId}`);
        console.log(`   CustomerName: ${loan.customerName || 'N/A'}`);
        console.log(`   VehicleType: ${loan.vehicleType || 'N/A'}`);
        console.log(`   RegNo: ${loan.regNo || 'N/A'}`);
        console.log(`   Status: ${loan.status || 'N/A'}`);
      });
    }

    // Also find loans where customerId is null or missing
    const noCustomerIdLoans = loans.filter(loan => {
      return !loan.customerId;
    });

    if (noCustomerIdLoans.length > 0) {
      console.log('\n' + '='.repeat(80));
      console.log(`LOANS WITH NO CUSTOMER ID (${noCustomerIdLoans.length} found)`);
      console.log('='.repeat(80));

      noCustomerIdLoans.forEach((loan, index) => {
        console.log(`\n${index + 1}. Loan ID: ${loan._id}`);
        console.log(`   CustomerName: ${loan.customerName || 'N/A'}`);
        console.log(`   VehicleType: ${loan.vehicleType || 'N/A'}`);
        console.log(`   RegNo: ${loan.regNo || 'N/A'}`);
        console.log(`   Status: ${loan.status || 'N/A'}`);
      });
    }

    console.log('\n' + '='.repeat(80));
    console.log('SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total orphaned loans (customerId doesn't exist in customers): ${orphanedLoans.length}`);
    console.log(`Total loans with null/missing customerId: ${noCustomerIdLoans.length}`);
    console.log(`Total problematic loans: ${orphanedLoans.length + noCustomerIdLoans.length}`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

findOrphanedLoans();