const express = require('express');
const mongoose = require('mongoose');
const authMiddleware = require('../middleware/auth');
const Loan = require('../models/Loan');
const User = require('../models/User');

const router = express.Router();

router.use(authMiddleware);

router.get('/db-status', async (req, res) => {
  try {
    const { connection } = mongoose;
    const collections = connection.db
      ? await connection.db.listCollections().toArray()
      : [];

    res.json({
      readyState: connection.readyState,
      host: connection.host,
      port: connection.port,
      database: connection.name,
      collections: collections.map(collection => collection.name).sort(),
      counts: {
        loans: await Loan.countDocuments(),
        users: await User.countDocuments(),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error reading database status.' });
  }
});

module.exports = router;
