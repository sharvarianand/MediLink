const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middleware/auth');
const upload = require('../utils/fileUpload');
const MedicalDocument = require('../models/MedicalDocument');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');

// Upload medical document
router.post('/upload', auth, checkRole(['doctor']), upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const document = new MedicalDocument({
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      filePath: req.file.path,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      doctor: req.user._id,
      patient: req.body.patientId,
      isPrivate: req.body.isPrivate === 'true',
      tags: req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : []
    });

    await document.save();
    res.status(201).json(document);
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ message: 'Error uploading document' });
  }
});

// Get all documents (filtered by role)
router.get('/', auth, async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role === 'patient') {
      query = { patientId: req.user._id };
    } else if (req.user.role === 'doctor') {
      query = { uploadedBy: req.user._id };
    }

    const documents = await MedicalDocument.find(query)
      .populate('uploadedBy', 'name')
      .populate('patientId', 'name');
    
    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching documents' });
  }
});

// Get documents for a patient
router.get('/patient/:patientId', auth, async (req, res) => {
  try {
    const { patientId } = req.params;
    const user = await User.findById(req.user.id);

    // Check if user is authorized to view these documents
    const isAuthorized = user.role === 'admin' || 
                        (user.role === 'doctor' && user.profile.patients?.includes(patientId)) ||
                        (user.role === 'patient' && user.id === patientId);

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to view these documents' });
    }

    const query = { patient: patientId };
    // If not admin or doctor, only show non-private documents
    if (user.role === 'patient') {
      query.isPrivate = false;
    }

    const documents = await MedicalDocument.find(query)
      .populate('patient', 'name')
      .populate('uploadedBy', 'name');

    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching documents' });
  }
});

// Get a specific document
router.get('/:id', auth, async (req, res) => {
  try {
    const document = await MedicalDocument.findById(req.params.id)
      .populate('patient', 'name')
      .populate('uploadedBy', 'name');

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const user = await User.findById(req.user.id);
    const isAuthorized = user.role === 'admin' || 
                        (user.role === 'doctor' && user.profile.patients?.includes(document.patient._id)) ||
                        (user.role === 'patient' && user.id === document.patient._id && !document.isPrivate);

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to view this document' });
    }

    res.json(document);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching document' });
  }
});

// Download a document
router.get('/:id/download', auth, async (req, res) => {
  try {
    const document = await MedicalDocument.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check if user has access to the document
    if (document.isPrivate && 
        req.user.role === 'patient' && 
        document.patient._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const filePath = document.fileUrl;
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    res.download(filePath);
  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({ message: 'Error downloading document' });
  }
});

// Update document
router.patch('/:id', auth, checkRole(['doctor']), async (req, res) => {
  try {
    const document = await MedicalDocument.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (document.doctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updates = req.body;
    Object.keys(updates).forEach(key => {
      document[key] = updates[key];
    });

    await document.save();
    res.json(document);
  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({ message: 'Error updating document' });
  }
});

// Delete document
router.delete('/:id', auth, checkRole(['doctor']), async (req, res) => {
  try {
    const document = await MedicalDocument.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (document.doctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await MedicalDocument.deleteOne({ _id: req.params.id });
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ message: 'Error deleting document' });
  }
});

module.exports = router; 