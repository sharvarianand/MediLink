const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middleware/auth');
const Report = require('../models/Report');
const MedicalDocument = require('../models/MedicalDocument');
const User = require('../models/User');
const MedicalReport = require('../models/MedicalReport');

// Create a new report
router.post('/', auth, checkRole(['doctor']), async (req, res) => {
  try {
    const report = new MedicalReport({
      ...req.body,
      doctor: req.user.id,
    });

    await report.save();
    res.status(201).json(report);
  } catch (error) {
    res.status(500).json({ message: 'Error creating report' });
  }
});

// Get all reports for a patient
router.get('/patient/:patientId', auth, async (req, res) => {
  try {
    const { patientId } = req.params;

    // Check if user is authorized to view these reports
    const isAuthorized = req.user.role === 'admin' || 
                        (req.user.role === 'doctor' && req.user.profile.patients?.includes(patientId)) ||
                        (req.user.role === 'patient' && req.user.id === patientId);

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to view these reports' });
    }

    const reports = await MedicalReport.find({ patient: patientId })
      .populate('doctor', 'name')
      .populate('patient', 'name');

    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reports' });
  }
});

// Get all reports created by a doctor
router.get('/doctor/:doctorId', auth, async (req, res) => {
  try {
    const { doctorId } = req.params;

    // Check if user is authorized to view these reports
    const isAuthorized = req.user.role === 'admin' || 
                        (req.user.role === 'doctor' && req.user.id === doctorId) ||
                        (req.user.role === 'patient' && req.user.profile.doctors?.includes(doctorId));

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to view these reports' });
    }

    const reports = await MedicalReport.find({ doctor: doctorId })
      .populate('doctor', 'name')
      .populate('patient', 'name');

    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reports' });
  }
});

// Get a specific report
router.get('/:id', auth, async (req, res) => {
  try {
    const report = await MedicalReport.findById(req.params.id)
      .populate('doctor', 'name email')
      .populate('patient', 'name email')
      .populate('attachments');

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Check if user has access to the report
    const isAuthorized = req.user.role === 'admin' ||
                        (req.user.role === 'doctor' && report.doctor._id.toString() === req.user.id) ||
                        (req.user.role === 'patient' && report.patient._id.toString() === req.user.id);

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to access this report' });
    }

    res.json(report);
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ message: 'Error fetching report' });
  }
});

// Update a report
router.patch('/:id', auth, checkRole(['doctor']), async (req, res) => {
  try {
    const report = await MedicalReport.findById(req.params.id);

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
router.delete('/:id', auth, checkRole(['doctor']), async (req, res) => {
  try {
    const report = await MedicalReport.findById(req.params.id);

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