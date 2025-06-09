const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['consultation', 'lab_result', 'imaging', 'prescription', 'other'],
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'final', 'archived'],
    default: 'draft'
  },
  attachments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MedicalDocument'
  }],
  diagnosis: [{
    code: String,
    description: String
  }],
  medications: [{
    name: String,
    dosage: String,
    frequency: String,
    duration: String,
    notes: String
  }],
  recommendations: [{
    type: String,
    trim: true
  }],
  followUpDate: Date,
  isPrivate: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for faster queries
reportSchema.index({ patient: 1, doctor: 1, type: 1 });
reportSchema.index({ status: 1 });
reportSchema.index({ followUpDate: 1 });

const Report = mongoose.model('Report', reportSchema);

module.exports = Report; 