const mongoose = require('mongoose');

const ALLOWED_ID_STATUS = ['Yes', 'No', ''];

function normalizeIdStatus(value) {
  if (typeof value !== 'string') return '';
  const candidate = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  return ALLOWED_ID_STATUS.includes(candidate) ? candidate : '';
}

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    fileId: { type: String, default: '' },
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
      mobile: { type: String, default: '' },
    },
    profileImageFileId: { type: String, default: '' },
    profileImageUrl: { type: String, default: '' },
    idProofType: { type: String, default: '' },
    idProofNumber: { type: String, default: '' },
    idStatus: {
      type: String,
      enum: ALLOWED_ID_STATUS,
      default: '',
      set: normalizeIdStatus,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Customer', customerSchema);
