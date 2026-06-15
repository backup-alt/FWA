const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    // Active session tokens (optional - useful if you want to support logout/revoke)
    tokens: [
      {
        token: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    role: {
      type: String,
      enum: ['owner', 'staff'],
      default: 'owner',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
