const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const MedicalReport = require('../models/MedicalReport');

let doctorToken;
let patientToken;
let doctorId;
let patientId;

beforeAll(async () => {
  // Create test doctor
  const doctor = await User.create({
    name: 'Test Doctor',
    email: 'doctor@test.com',
    password: 'password123',
    role: 'doctor',
    profile: {
      specialization: 'General Medicine',
      qualifications: [{ degree: 'MD', institution: 'Test University' }],
      availability: [{ day: 'monday', startTime: '09:00', endTime: '17:00' }],
      patients: []
    }
  });
  doctorId = doctor._id;

  // Create test patient
  const patient = await User.create({
    name: 'Test Patient',
    email: 'patient@test.com',
    password: 'password123',
    role: 'patient',
    profile: {
      bloodGroup: 'A+',
      allergies: ['Penicillin'],
      emergencyContact: { name: 'Emergency Contact', phone: '1234567890' },
      doctors: [doctorId]
    }
  });
  patientId = patient._id;

  // Update doctor's patients list
  await User.findByIdAndUpdate(doctorId, {
    $push: { 'profile.patients': patientId }
  });

  // Get tokens
  const doctorLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'doctor@test.com', password: 'password123' });
  doctorToken = doctorLogin.body.token;

  const patientLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'patient@test.com', password: 'password123' });
  patientToken = patientLogin.body.token;

  // Create test report
  await MedicalReport.create({
    patient: patientId,
    doctor: doctorId,
    title: 'Test Report',
    content: 'Test content',
    diagnosis: [{ description: 'Test diagnosis' }],
    medications: [{ name: 'Test medication', dosage: '10mg' }],
    recommendations: ['Test recommendation'],
    type: 'consultation'
  });
});

afterAll(async () => {
  await User.deleteMany({});
  await MedicalReport.deleteMany({});
});

describe('Medical Reports Endpoints', () => {
  describe('POST /api/reports', () => {
    it('should create a new report', async () => {
      const res = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          patient: patientId,
          title: 'New Test Report',
          content: 'Test content',
          diagnosis: [{ description: 'Test diagnosis' }],
          medications: [{ name: 'Test medication', dosage: '10mg' }],
          recommendations: ['Test recommendation'],
          type: 'consultation'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.title).toBe('New Test Report');
    });

    it('should not allow patients to create reports', async () => {
      const res = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          patient: patientId,
          title: 'Test Report',
          content: 'Test content'
        });

      expect(res.statusCode).toBe(403);
    });
  });

  describe('GET /api/reports/patient/:patientId', () => {
    it('should get all reports for a patient', async () => {
      const res = await request(app)
        .get(`/api/reports/patient/${patientId}`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].title).toBe('Test Report');
    });

    it('should not allow unauthorized access to patient reports', async () => {
      const unauthorizedUser = await User.create({
        name: 'Unauthorized User',
        email: 'unauthorized@test.com',
        password: 'password123',
        role: 'patient',
        profile: {
          bloodGroup: 'O+',
          allergies: [],
          emergencyContact: { name: 'Emergency Contact', phone: '1234567890' }
        }
      });

      const unauthorizedLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: 'unauthorized@test.com', password: 'password123' });

      const res = await request(app)
        .get(`/api/reports/patient/${patientId}`)
        .set('Authorization', `Bearer ${unauthorizedLogin.body.token}`);

      expect(res.statusCode).toBe(403);
    });
  });

  describe('GET /api/reports/doctor/:doctorId', () => {
    it('should get all reports created by a doctor', async () => {
      const res = await request(app)
        .get(`/api/reports/doctor/${doctorId}`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].title).toBe('Test Report');
    });

    it('should not allow unauthorized access to doctor reports', async () => {
      const res = await request(app)
        .get(`/api/reports/doctor/${doctorId}`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.statusCode).toBe(403);
    });
  });
}); 