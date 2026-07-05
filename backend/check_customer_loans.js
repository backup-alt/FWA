const { MongoClient } = require('mongodb');

async function checkCustomerLoans() {
  const mongoUri = 'mongodb+srv://universeexplorer4_db_user:openloop@cluster0.ftabrot.mongodb.net/vehicleFinanceDB?retryWrites=true&w=majority&appName=Cluster0';

  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    console.log('Connected to MongoDB\n');

    const db = client.db('vehicleFinanceDB');

    // Find customer by name
    const customer = await db.collection('customers').findOne({ name: { $regex: /Vijayanathan/i } });
    if (!customer) {
      console.log('Customer not found');
      return;
    }
    console.log('Customer:', customer._id, customer.name);

    // Find all loans for this customer
    const loans = await db.collection('loans').find({ customerId: customer._id }).toArray();
    console.log('\nLoans for this customer:', loans.length);
    loans.forEach((loan, i) => {
      console.log(`\nLoan ${i + 1}:`);
      console.log('  _id:', loan._id);
      console.log('  status:', loan.status);
      console.log('  vehicleType:', loan.vehicleType);
      console.log('  make:', loan.make);
      console.log('  regNo:', loan.regNo);
      console.log('  vehicles:', loan.vehicles);
      console.log('  outstandingPrincipal:', loan.outstandingPrincipal);
    });

    // Also run the aggregation to see what it returns
    console.log('\n--- Aggregation Test ---');
    const loanAgg = await db.collection('loans').aggregate([
      { $match: { customerId: customer._id } },
      {
        $addFields: {
          vehiclesArray: {
            $cond: [
              { $gt: [{ $size: { $ifNull: ['$vehicles', []] } }, 0] },
              '$vehicles',
              [{ vehicleType: '$vehicleType', make: '$make', model: '$model', regNo: '$regNo' }]
            ]
          }
        }
      },
      { $unwind: { path: '$vehiclesArray', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$_id',
          customerId: { $first: '$customerId' },
          loanCount: { $sum: 1 },
          totalOutstanding: { $first: '$outstandingPrincipal' },
          activeLoans: { $first: { $cond: [{ $eq: ['$status', 'Active'] }, 1, 0] } },
        }
      },
    ]).toArray();

    console.log('Aggregation results:', loanAgg.length, 'documents');
    loanAgg.forEach((doc, i) => {
      console.log(`  Doc ${i + 1}: _id=${doc._id}, loanCount=${doc.loanCount}, customerId=${doc.customerId}`);
    });

    const sumLoanCount = loanAgg.reduce((sum, doc) => sum + doc.loanCount, 0);
    console.log('Sum of loanCount:', sumLoanCount);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

checkCustomerLoans();