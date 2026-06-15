const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
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
