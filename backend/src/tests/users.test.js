const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const path = require('path');

describe('User Profile Management Endpoints', () => {
  let doctorToken;
  let patientToken;
  let doctor;
  let patient;

  beforeEach(async () => {
    // Clear collections
    await User.deleteMany({});

    // Create test doctor
    const doctorRes = await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'Test Doctor',
        email: 'doctor@test.com',
        password: 'password123',
        role: 'doctor',
        profile: {
          specialization: 'General Medicine',
          qualifications: [{
            degree: 'MD',
            institution: 'Test University',
            year: 2020
          }],
          experience: 5,
          licenseNumber: 'DOC123',
          availability: [{
            day: 'monday',
            slots: [{
              start: '09:00',
              end: '17:00'
            }]
          }]
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
          dateOfBirth: '1995-01-01',
          gender: 'male',
          phone: '1234567890',
          address: {
            street: '123 Test St',
            city: 'Test City',
            state: 'Test State',
            zipCode: '12345',
            country: 'Test Country'
          },
          bloodGroup: 'A+',
          height: 180,
          weight: 75,
          allergies: ['Penicillin'],
          chronicConditions: ['Hypertension'],
          emergencyContact: {
            name: 'Emergency Contact',
            relationship: 'Spouse',
            phone: '9876543210'
          },
          insurance: {
            provider: 'Test Insurance',
            policyNumber: 'POL123',
            groupNumber: 'GRP123',
            expiryDate: '2024-12-31'
          }
        }
      });
    patientToken = patientRes.body.token;
    patient = patientRes.body.user;
  });

  describe('GET /api/users/profile', () => {
    it('should get doctor profile', async () => {
      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.user.name).toBe('Test Doctor');
      expect(res.body.user.profile.specialization).toBe('General Medicine');
      expect(res.body.user.profile.qualifications[0].degree).toBe('MD');
      expect(res.body.user.profile.availability[0].day).toBe('monday');
    });

    it('should get patient profile', async () => {
      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.user.name).toBe('Test Patient');
      expect(res.body.user.profile.bloodGroup).toBe('A+');
      expect(res.body.user.profile.allergies).toContain('Penicillin');
      expect(res.body.user.profile.emergencyContact.name).toBe('Emergency Contact');
    });
  });

  describe('PATCH /api/users/profile', () => {
    it('should update doctor profile', async () => {
      const res = await request(app)
        .patch('/api/users/profile')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          name: 'Updated Doctor',
          'profile.specialization': 'Cardiology',
          'profile.qualifications': [{
            degree: 'MD',
            institution: 'Updated University',
            year: 2021
          }]
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.name).toBe('Updated Doctor');
      expect(res.body.profile.specialization).toBe('Cardiology');
      expect(res.body.profile.qualifications[0].institution).toBe('Updated University');
    });

    it('should update patient profile', async () => {
      const res = await request(app)
        .patch('/api/users/profile')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          name: 'Updated Patient',
          'profile.bloodGroup': 'B+',
          'profile.allergies': ['Penicillin', 'Aspirin'],
          'profile.emergencyContact.phone': '1112223333'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.name).toBe('Updated Patient');
      expect(res.body.profile.bloodGroup).toBe('B+');
      expect(res.body.profile.allergies).toContain('Aspirin');
      expect(res.body.profile.emergencyContact.phone).toBe('1112223333');
    });
  });

  describe('POST /api/users/profile/picture', () => {
    it('should upload profile picture', async () => {
      const res = await request(app)
        .post('/api/users/profile/picture')
        .set('Authorization', `Bearer ${doctorToken}`)
        .attach('picture', path.join(__dirname, 'test-files/test.jpg'));

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Profile picture uploaded successfully');
    });
  });

  describe('GET /api/users/doctors/:id/availability', () => {
    it('should get doctor availability', async () => {
      const res = await request(app)
        .get(`/api/users/doctors/${doctor.id}/availability`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body[0].day).toBe('monday');
      expect(res.body[0].slots[0].start).toBe('09:00');
    });
  });

  describe('PATCH /api/users/availability', () => {
    it('should update doctor availability', async () => {
      const newAvailability = [{
        day: 'tuesday',
        slots: [{
          start: '10:00',
          end: '18:00'
        }]
      }];

      const res = await request(app)
        .patch('/api/users/availability')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ availability: newAvailability });

      expect(res.statusCode).toBe(200);
      expect(res.body[0].day).toBe('tuesday');
      expect(res.body[0].slots[0].start).toBe('10:00');
    });

    it('should not allow patient to update availability', async () => {
      const res = await request(app)
        .patch('/api/users/availability')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({ availability: [] });

      expect(res.statusCode).toBe(403);
    });
  });

  describe('GET /api/users/doctors', () => {
    it('should get all doctors', async () => {
      const res = await request(app)
        .get('/api/users/doctors')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBe(1);
      expect(res.body[0].name).toBe('Test Doctor');
      expect(res.body[0].profile.specialization).toBe('General Medicine');
    });
  });

  describe('GET /api/users/doctors/search', () => {
    it('should search doctors by specialization', async () => {
      const res = await request(app)
        .get('/api/users/doctors/search?specialization=General Medicine')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBe(1);
      expect(res.body[0].profile.specialization).toBe('General Medicine');
    });

    it('should search doctors by name', async () => {
      const res = await request(app)
        .get('/api/users/doctors/search?name=Test Doctor')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBe(1);
      expect(res.body[0].name).toBe('Test Doctor');
    });
  });

  describe('PATCH /api/users/preferences/notifications', () => {
    it('should update notification preferences', async () => {
      const res = await request(app)
        .patch('/api/users/preferences/notifications')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          email: false,
          sms: true,
          appointmentReminders: false
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.email).toBe(false);
      expect(res.body.sms).toBe(true);
      expect(res.body.appointmentReminders).toBe(false);
    });
  });
}); 