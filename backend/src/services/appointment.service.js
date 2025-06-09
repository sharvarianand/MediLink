const Appointment = require('../models/Appointment');
const User = require('../models/User');

class AppointmentService {
  async create(appointmentData) {
    const { patientId, doctorId, date, timeSlot, type, reason } = appointmentData;

    // Validate patient exists
    const patient = await User.findOne({ _id: patientId, role: 'patient' });
    if (!patient) {
      throw new Error('Patient not found');
    }

    // Validate doctor exists
    const doctor = await User.findOne({ _id: doctorId, role: 'doctor' });
    if (!doctor) {
      throw new Error('Doctor not found');
    }

    // Check if doctor is available
    const isAvailable = await this.isDoctorAvailable(doctorId, date, timeSlot);
    if (!isAvailable) {
      throw new Error('Doctor is not available at the requested time');
    }

    const appointment = new Appointment({
      doctor: doctorId,
      patient: patientId,
      date,
      timeSlot,
      type,
      reason,
      status: 'scheduled'
    });

    return appointment.save();
  }

  async findAll() {
    return Appointment.find()
      .populate('doctor', 'name email profile.specialization')
      .populate('patient', 'name email');
  }

  async findOne(id) {
    const appointment = await Appointment.findById(id)
      .populate('doctor', 'name email profile.specialization')
      .populate('patient', 'name email');

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    return appointment;
  }

  async update(id, updateData) {
    const appointment = await this.findOne(id);

    // Validate appointment date if provided
    if (updateData.date && updateData.timeSlot) {
      const isAvailable = await this.isDoctorAvailable(
        appointment.doctor._id,
        updateData.date,
        updateData.timeSlot,
        id
      );
      if (!isAvailable) {
        throw new Error('Doctor is not available at the requested time');
      }
    }

    Object.assign(appointment, updateData);
    return appointment.save();
  }

  async remove(id) {
    const appointment = await this.findOne(id);
    await appointment.remove();
  }

  async findByPatient(patientId) {
    return Appointment.find({ patient: patientId })
      .populate('doctor', 'name email profile.specialization')
      .populate('patient', 'name email');
  }

  async findByDoctor(doctorId) {
    return Appointment.find({ doctor: doctorId })
      .populate('doctor', 'name email profile.specialization')
      .populate('patient', 'name email');
  }

  async updateStatus(id, status) {
    const appointment = await this.findOne(id);
    
    if (!this.isValidStatusTransition(appointment.status, status)) {
      throw new Error(`Invalid status transition from ${appointment.status} to ${status}`);
    }

    appointment.status = status;
    return appointment.save();
  }

  async isDoctorAvailable(doctorId, date, timeSlot, excludeAppointmentId = null) {
    const query = {
      doctor: doctorId,
      date: date,
      'timeSlot.start': timeSlot.start,
      'timeSlot.end': timeSlot.end,
      status: { $ne: 'cancelled' }
    };

    if (excludeAppointmentId) {
      query._id = { $ne: excludeAppointmentId };
    }

    const existingAppointment = await Appointment.findOne(query);
    return !existingAppointment;
  }

  isValidStatusTransition(currentStatus, newStatus) {
    const validTransitions = {
      'scheduled': ['confirmed', 'cancelled'],
      'confirmed': ['completed', 'cancelled'],
      'completed': [],
      'cancelled': []
    };

    return validTransitions[currentStatus]?.includes(newStatus) ?? false;
  }
}

module.exports = new AppointmentService(); 