const dns = require('dns');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// On Windows the default DNS resolver sometimes can't reach MongoDB Atlas SRV
// records, so we point Node at well-known public resolvers before connecting.
dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);

const connectDB = async () => {
  try {
    let uri = process.env.MONGODB_URI || '';
    if (!uri.includes('/vehicleFinanceDB') || uri.includes('->')) {
      uri = 'mongodb+srv://universeexplorer4_db_user:openloop@cluster0.ftabrot.mongodb.net/vehicleFinanceDB?retryWrites=true&w=majority&appName=Cluster0';
      console.warn('MONGODB_URI appears misconfigured — using fallback. Please update the env var in Render dashboard.');
    }
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
    
    // Seed default user if database is empty
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('No users found in database. Seeding default owner user...');
      const passwordHash = await bcrypt.hash('owner123', 10);
      const defaultUser = new User({
        username: 'owner',
        passwordHash,
        role: 'owner'
      });
      await defaultUser.save();
      console.log('Default owner user created successfully: owner / owner123');
    }
  } catch (err) {
    console.error(`MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
