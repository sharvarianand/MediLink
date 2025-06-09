const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const MedicalDocument = require('../models/MedicalDocument');
const path = require('path');
const fs = require('fs');

describe('Medical Document Endpoints', () => {
  let doctorToken;
  let patientToken;
  let doctor;
  let patient;
  let document;

  beforeEach(async () => {
    // Clear collections
    await User.deleteMany({});
    await MedicalDocument.deleteMany({});

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

  describe('POST /api/documents/upload', () => {
    it('should upload a medical document', async () => {
      const res = await request(app)
        .post('/api/documents/upload')
        .set('Authorization', `Bearer ${doctorToken}`)
        .attach('document', path.join(__dirname, 'test-files/test.pdf'))
        .field('patientId', patient.id)
        .field('title', 'Test Document')
        .field('description', 'Test Description')
        .field('category', 'lab_result')
        .field('tags', 'test,medical');

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('title', 'Test Document');
      expect(res.body).toHaveProperty('patient', patient.id);
      expect(res.body).toHaveProperty('doctor', doctor.id);
      expect(res.body).toHaveProperty('category', 'lab_result');
      expect(res.body.tags).toContain('test');
      expect(res.body.tags).toContain('medical');
    });

    it('should not allow patient to upload documents', async () => {
      const res = await request(app)
        .post('/api/documents/upload')
        .set('Authorization', `Bearer ${patientToken}`)
        .attach('document', path.join(__dirname, 'test-files/test.pdf'))
        .field('patientId', patient.id)
        .field('title', 'Test Document');

      expect(res.statusCode).toBe(403);
    });
  });

  describe('GET /api/documents/patient/:patientId', () => {
    beforeEach(async () => {
      // Create a test document
      document = await MedicalDocument.create({
        patient: patient.id,
        doctor: doctor.id,
        title: 'Test Document',
        description: 'Test Description',
        filePath: 'test.pdf',
        fileType: 'application/pdf',
        fileSize: 1024,
        category: 'lab_result',
        tags: ['test']
      });
    });

    it('should get all documents for a patient', async () => {
      const res = await request(app)
        .get(`/api/documents/patient/${patient.id}`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBe(1);
      expect(res.body[0].title).toBe('Test Document');
    });

    it('should not allow unauthorized access to private documents', async () => {
      // Create a private document
      await MedicalDocument.create({
        patient: patient.id,
        doctor: doctor.id,
        title: 'Private Document',
        description: 'Private Description',
        filePath: 'private.pdf',
        fileType: 'application/pdf',
        fileSize: 1024,
        category: 'lab_result',
        isPrivate: true
      });

      const res = await request(app)
        .get(`/api/documents/patient/${patient.id}`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.length).toBe(1); // Should only see non-private document
    });
  });

  describe('GET /api/documents/:id', () => {
    beforeEach(async () => {
      document = await MedicalDocument.create({
        patient: patient.id,
        doctor: doctor.id,
        title: 'Test Document',
        description: 'Test Description',
        filePath: 'test.pdf',
        fileType: 'application/pdf',
        fileSize: 1024,
        category: 'lab_result'
      });
    });

    it('should get a specific document', async () => {
      const res = await request(app)
        .get(`/api/documents/${document.id}`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.title).toBe('Test Document');
      expect(res.body.doctor).toHaveProperty('name', 'Test Doctor');
      expect(res.body.patient).toHaveProperty('name', 'Test Patient');
    });

    it('should not allow unauthorized access', async () => {
      const res = await request(app)
        .get(`/api/documents/${document.id}`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.statusCode).toBe(403);
    });
  });

  describe('PATCH /api/documents/:id', () => {
    beforeEach(async () => {
      document = await MedicalDocument.create({
        patient: patient.id,
        doctor: doctor.id,
        title: 'Test Document',
        description: 'Test Description',
        filePath: 'test.pdf',
        fileType: 'application/pdf',
        fileSize: 1024,
        category: 'lab_result'
      });
    });

    it('should update document metadata', async () => {
      const res = await request(app)
        .patch(`/api/documents/${document.id}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          title: 'Updated Document',
          description: 'Updated Description',
          isPrivate: true
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.title).toBe('Updated Document');
      expect(res.body.description).toBe('Updated Description');
      expect(res.body.isPrivate).toBe(true);
    });

    it('should not allow patient to update document', async () => {
      const res = await request(app)
        .patch(`/api/documents/${document.id}`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          title: 'Updated Document'
        });

      expect(res.statusCode).toBe(403);
    });
  });

  describe('DELETE /api/documents/:id', () => {
    beforeEach(async () => {
      document = await MedicalDocument.create({
        patient: patient.id,
        doctor: doctor.id,
        title: 'Test Document',
        description: 'Test Description',
        filePath: 'test.pdf',
        fileType: 'application/pdf',
        fileSize: 1024,
        category: 'lab_result'
      });
    });

    it('should delete a document', async () => {
      const res = await request(app)
        .delete(`/api/documents/${document.id}`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Document deleted successfully');

      // Verify document is deleted
      const deletedDoc = await MedicalDocument.findById(document.id);
      expect(deletedDoc).toBeNull();
    });

    it('should not allow patient to delete document', async () => {
      const res = await request(app)
        .delete(`/api/documents/${document.id}`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.statusCode).toBe(403);
    });
  });
}); 