const mongoose = require('mongoose');

const medicalDocumentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['report', 'image', 'lab_result', 'prescription', 'other'],
    default: 'report'
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
    enum: ['lab_result', 'imaging', 'prescription', 'report', 'other'],
    default: 'other'
  },
  tags: [{
    type: String
  }],
  isPrivate: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for faster queries
medicalDocumentSchema.index({ patient: 1, uploadedBy: 1, category: 1 });
medicalDocumentSchema.index({ tags: 1 });

const MedicalDocument = mongoose.model('MedicalDocument', medicalDocumentSchema);

module.exports = MedicalDocument; 