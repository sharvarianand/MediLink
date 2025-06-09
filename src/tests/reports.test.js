const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Report = require('../models/Report');

describe('Medical Reports Endpoints', () => {
  let doctorToken;
  let patientToken;
  let doctorId;
  let patientId;

  beforeAll(async () => {
    // Create test doctor
    const doctor = new User({
      name: 'Test Doctor',
      email: 'doctor@test.com',
      password: 'password123',
      role: 'doctor'
    });
    await doctor.save();
    doctorId = doctor._id;

    // Create test patient
    const patient = new User({
      name: 'Test Patient',
      email: 'patient@test.com',
      password: 'password123',
      role: 'patient'
    });
    await patient.save();
    patientId = patient._id;

    // Get tokens
    const doctorRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'doctor@test.com', password: 'password123' });
    doctorToken = doctorRes.body.token;

    const patientRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'patient@test.com', password: 'password123' });
    patientToken = patientRes.body.token;
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Report.deleteMany({});
  });

  describe('POST /api/reports', () => {
    it('should create a new medical report', async () => {
      const res = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          patientId: patientId,
          title: 'Test Report',
          content: 'Test Content',
          diagnosis: 'Test Diagnosis',
          recommendations: 'Test Recommendations'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('title', 'Test Report');
      expect(res.body).toHaveProperty('content', 'Test Content');
    });

    it('should not allow patients to create reports', async () => {
      const res = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          patientId: patientId,
          title: 'Test Report',
          content: 'Test Content'
        });

      expect(res.statusCode).toBe(403);
    });
  });

  describe('GET /api/reports', () => {
    it('should get all reports for a patient', async () => {
      const res = await request(app)
        .get('/api/reports')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
    });

    it('should get all reports created by a doctor', async () => {
      const res = await request(app)
        .get('/api/reports')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
    });
  });
}); 