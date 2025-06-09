const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Appointment = require('../models/Appointment');

describe('Appointment Endpoints', () => {
  let doctorToken;
  let patientToken;
  let doctor;
  let patient;
  let appointment;

  beforeEach(async () => {
    // Clear collections
    await User.deleteMany({});
    await Appointment.deleteMany({});

    // Create test doctor
    const doctorRes = await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'Test Doctor',
        email: 'doctor@test.com',
        password: 'password123',
        role: 'doctor',
        profile: {
          specialization: 'General Medicine'
        }
      });
    doctorToken = doctorRes.body.token;
    doctor = doctorRes.body.user;

    // Create test patient
    const patientRes = await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'Test Patient',
        email: 'patient@test.com',
        password: 'password123',
        role: 'patient',
        profile: {
          age: 25,
          gender: 'male'
        }
      });
    patientToken = patientRes.body.token;
    patient = patientRes.body.user;
  });

  describe('POST /api/appointments', () => {
    it('should create a new appointment', async () => {
      const res = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          doctorId: doctor.id,
          date: new Date().toISOString(),
          timeSlot: {
            start: '09:00',
            end: '09:30'
          },
          type: 'consultation',
          reason: 'Regular checkup'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('doctor');
      expect(res.body).toHaveProperty('patient');
      expect(res.body.status).toBe('scheduled');
    });

    it('should not allow doctor to create appointment', async () => {
      const res = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          doctorId: doctor.id,
          date: new Date().toISOString(),
          timeSlot: {
            start: '09:00',
            end: '09:30'
          },
          type: 'consultation',
          reason: 'Regular checkup'
        });

      expect(res.statusCode).toBe(403);
    });
  });

  describe('GET /api/appointments/my-appointments', () => {
    beforeEach(async () => {
      // Create a test appointment
      appointment = await Appointment.create({
        doctor: doctor.id,
        patient: patient.id,
        date: new Date(),
        timeSlot: {
          start: '09:00',
          end: '09:30'
        },
        type: 'consultation',
        reason: 'Regular checkup'
      });
    });

    it('should get appointments for doctor', async () => {
      const res = await request(app)
        .get('/api/appointments/my-appointments')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBe(1);
      expect(res.body[0].patient).toHaveProperty('name', 'Test Patient');
    });

    it('should get appointments for patient', async () => {
      const res = await request(app)
        .get('/api/appointments/my-appointments')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBe(1);
      expect(res.body[0].doctor).toHaveProperty('name', 'Test Doctor');
    });
  });

  describe('PATCH /api/appointments/:id/status', () => {
    beforeEach(async () => {
      // Create a test appointment
      appointment = await Appointment.create({
        doctor: doctor.id,
        patient: patient.id,
        date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        timeSlot: {
          start: '09:00',
          end: '09:30'
        },
        type: 'consultation',
        reason: 'Regular checkup'
      });
    });

    it('should update appointment status', async () => {
      const res = await request(app)
        .patch(`/api/appointments/${appointment.id}/status`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ status: 'confirmed' });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('confirmed');
    });

    it('should not allow patient to update status to completed', async () => {
      const res = await request(app)
        .patch(`/api/appointments/${appointment.id}/status`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({ status: 'completed' });

      expect(res.statusCode).toBe(403);
    });
  });

  describe('GET /api/appointments/available-slots/:doctorId/:date', () => {
    it('should get available time slots', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];

      const res = await request(app)
        .get(`/api/appointments/available-slots/${doctor.id}/${dateStr}`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('start');
      expect(res.body[0]).toHaveProperty('end');
    });
  });
}); 