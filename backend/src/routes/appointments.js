const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const { auth } = require('../middleware/auth');
const { sendAppointmentEmail } = require('../utils/emailService');
const User = require('../models/User');

// Create new appointment
router.post('/', auth, async (req, res) => {
  try {
    const { doctorId, date, timeSlot, type, reason } = req.body;
    
    // Check if user is a patient
    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Only patients can book appointments' });
    }

    // Check if doctor exists
    const doctor = await User.findOne({ _id: doctorId, role: 'doctor' });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Check if time slot is available
    const existingAppointment = await Appointment.findOne({
      doctor: doctorId,
      date,
      'timeSlot.start': timeSlot.start,
      'timeSlot.end': timeSlot.end,
      status: { $ne: 'cancelled' }
    });

    if (existingAppointment) {
      return res.status(400).json({ message: 'Time slot is not available' });
    }

    const appointment = new Appointment({
      doctor: doctorId,
      patient: req.user._id,
      date,
      timeSlot,
      type,
      reason
    });

    await appointment.save();

    // Populate doctor and patient details for email
    await appointment.populate([
      { path: 'doctor', select: 'name email' },
      { path: 'patient', select: 'name email' }
    ]);

    // Send confirmation email
    await sendAppointmentEmail(appointment, 'confirmation');

    res.status(201).json(appointment);
  } catch (error) {
    console.error('Appointment creation error:', error);
    res.status(400).json({ message: error.message });
  }
});

// Get appointments for current user
router.get('/my-appointments', auth, async (req, res) => {
  try {
    const query = req.user.role === 'doctor' 
      ? { doctor: req.user._id }
      : { patient: req.user._id };

    const appointments = await Appointment.find(query)
      .populate('doctor', 'name email profile')
      .populate('patient', 'name email profile')
      .sort({ date: 1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get appointment by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('doctor', 'name email profile')
      .populate('patient', 'name email profile');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check if user is authorized to view this appointment
    if (req.user.role !== 'doctor' && 
        appointment.patient._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update appointment status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check if user is authorized to update status
    if (req.user.role === 'patient' && appointment.patient.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this appointment' });
    }

    // Only doctors can mark appointments as completed
    if (req.body.status === 'completed' && req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Only doctors can mark appointments as completed' });
    }

    // Only doctors can update status if they are the assigned doctor
    if (req.user.role === 'doctor' && appointment.doctor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this appointment' });
    }

    appointment.status = req.body.status;
    await appointment.save();

    // Populate doctor and patient details for email
    await appointment.populate('doctor patient');

    // Send email notification
    await sendAppointmentEmail(appointment);

    res.json(appointment);
  } catch (error) {
    console.error('Error updating appointment status:', error);
    res.status(500).json({ message: 'Error updating appointment status' });
  }
});

// Add prescription/notes to appointment
router.patch('/:id/notes', auth, async (req, res) => {
  try {
    const { notes, prescription } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Only doctors can add notes/prescriptions
    if (req.user.role !== 'doctor' || 
        appointment.doctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (notes) appointment.notes = notes;
    if (prescription) appointment.prescription = prescription;

    await appointment.save();
    res.json(appointment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get available time slots for a doctor on a specific date
router.get('/available-slots/:doctorId/:date', auth, async (req, res) => {
  try {
    const { doctorId, date } = req.params;
    
    // Get all appointments for the doctor on the specified date
    const appointments = await Appointment.find({
      doctor: doctorId,
      date,
      status: { $ne: 'cancelled' }
    });

    // Generate available time slots (assuming 30-minute slots from 9 AM to 5 PM)
    const allSlots = generateTimeSlots();
    const bookedSlots = appointments.map(apt => apt.timeSlot);
    
    const availableSlots = allSlots.filter(slot => 
      !bookedSlots.some(booked => 
        booked.start === slot.start && booked.end === slot.end
      )
    );

    res.json(availableSlots);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Helper function to generate time slots
function generateTimeSlots() {
  const slots = [];
  const startHour = 9; // 9 AM
  const endHour = 17; // 5 PM

  for (let hour = startHour; hour < endHour; hour++) {
    slots.push({
      start: `${hour.toString().padStart(2, '0')}:00`,
      end: `${hour.toString().padStart(2, '0')}:30`
    });
    slots.push({
      start: `${hour.toString().padStart(2, '0')}:30`,
      end: `${(hour + 1).toString().padStart(2, '0')}:00`
    });
  }

  return slots;
}

module.exports = router; 