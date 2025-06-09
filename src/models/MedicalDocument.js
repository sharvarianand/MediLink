const mongoose = require('mongoose');

const medicalDocumentSchema = new mongoose.Schema({
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
  description: {
    type: String,
    trim: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    enum: ['lab_result', 'prescription', 'medical_report', 'imaging', 'other'],
    required: true
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Index for faster queries
medicalDocumentSchema.index({ patient: 1, doctor: 1, category: 1 });
medicalDocumentSchema.index({ tags: 1 });

const MedicalDocument = mongoose.model('MedicalDocument', medicalDocumentSchema);

module.exports = MedicalDocument; 