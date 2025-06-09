const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Report = require('../models/Report');
const MedicalDocument = require('../models/MedicalDocument');

// Create a new report
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const {
      patientId,
      title,
      content,
      diagnosis,
      medications,
      recommendations,
      followUpDate,
      isPrivate,
      type
    } = req.body;

    let diagnosisValue = diagnosis;
    if (typeof diagnosis === 'string') {
      diagnosisValue = [{ description: diagnosis }];
    } else if (Array.isArray(diagnosis) && typeof diagnosis[0] === 'string') {
      diagnosisValue = diagnosis.map(d => ({ description: d }));
    }

    const report = new Report({
      patient: patientId,
      doctor: req.user._id,
      title,
      content,
      diagnosis: diagnosisValue,
      medications,
      recommendations,
      followUpDate,
      isPrivate,
      type: type || 'consultation'
    });
    await report.save();
    res.status(201).json(report);
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ message: 'Error creating report' });
  }
});

// Get all reports for a patient
router.get('/patient/:patientId', auth, async (req, res) => {
  try {
    const reports = await Report.find({
      patient: req.params.patientId,
      $or: [
        { doctor: req.user.id },
        { isPrivate: false }
      ]
    })
    .populate('doctor', 'name email')
    .populate('attachments')
    .sort({ createdAt: -1 });

    res.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ message: 'Error fetching reports' });
  }
});

// Get a specific report
router.get('/:id', auth, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('doctor', 'name email')
      .populate('patient', 'name email')
      .populate('attachments');

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Check if user has access to the report
    if (report.doctor._id.toString() !== req.user.id && 
        report.patient._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to access this report' });
    }

    res.json(report);
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ message: 'Error fetching report' });
  }
});

// Update a report
router.patch('/:id', auth, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Only the creating doctor can update the report
    if (report.doctor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this report' });
    }

    const updates = {
      title: req.body.title,
      content: req.body.content,
      type: req.body.type,
      status: req.body.status,
      attachments: req.body.attachments,
      diagnosis: req.body.diagnosis,
      medications: req.body.medications,
      recommendations: req.body.recommendations,
      followUpDate: req.body.followUpDate,
      isPrivate: req.body.isPrivate
    };

    Object.assign(report, updates);
    await report.save();
    await report.populate('patient doctor', 'name email');
    await report.populate('attachments');

    res.json(report);
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({ message: 'Error updating report' });
  }
});

// Delete a report
router.delete('/:id', auth, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Only the creating doctor can delete the report
    if (report.doctor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this report' });
    }

    await report.remove();
    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ message: 'Error deleting report' });
  }
});

// Get reports by type
router.get('/type/:type', auth, async (req, res) => {
  try {
    const reports = await Report.find({
      type: req.params.type,
      $or: [
        { doctor: req.user.id },
        { patient: req.user.id },
        { isPrivate: false }
      ]
    })
    .populate('doctor patient', 'name email')
    .populate('attachments')
    .sort({ createdAt: -1 });

    res.json(reports);
  } catch (error) {
    console.error('Error fetching reports by type:', error);
    res.status(500).json({ message: 'Error fetching reports' });
  }
});

module.exports = router; 