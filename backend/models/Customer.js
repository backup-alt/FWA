const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    address: { type: String, default: '' },
    temporaryAddress: { type: String, default: '' },
    monthlySalary: { type: Number, default: 0 },
    cellNumbers: [
      {
        number: { type: String, required: true },
      },
    ],
    guarantor: {
      name: { type: String, default: '' },
      address: { type: String, default: '' },
    },
    profileImageFileId: { type: String, default: '' },
    profileImageUrl: { type: String, default: '' },
    idProofType: { type: String, default: '' },
    idProofNumber: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Customer', customerSchema);
