const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  timeSlot: {
    start: {
      type: String,
      required: true
    },
    end: {
      type: String,
      required: true
    }
  },
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  type: {
    type: String,
    enum: ['consultation', 'follow-up', 'emergency'],
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  notes: {
    type: String
  },
  prescription: {
    type: String
  },
  followUpDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient querying
appointmentSchema.index({ doctor: 1, date: 1 });
appointmentSchema.index({ patient: 1, date: 1 });

// Method to check if appointment is in the past
appointmentSchema.methods.isPast = function() {
  return new Date(this.date) < new Date();
};

// Method to check if appointment can be cancelled
appointmentSchema.methods.canBeCancelled = function() {
  const appointmentDate = new Date(this.date);
  const now = new Date();
  const hoursUntilAppointment = (appointmentDate - now) / (1000 * 60 * 60);
  return hoursUntilAppointment >= 24; // Can cancel up to 24 hours before
};

const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment; 