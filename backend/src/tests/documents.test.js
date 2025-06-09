const request = require('supertest');
const mongoose = require('mongoose');
const path = require('path');
const app = require('../server');
const User = require('../models/User');
const MedicalDocument = require('../models/MedicalDocument');

let doctorToken;
let patientToken;
let doctorId;
let patientId;
let documentId;

beforeAll(async () => {
  // Wait for MongoDB connection
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Create test doctor
  const doctor = await User.create({
    name: 'Test Doctor',
    email: 'doctor@test.com',
    password: 'password123',
    role: 'doctor',
    profile: {
      specialization: 'General Medicine',
      qualifications: [{ degree: 'MD', institution: 'Test University' }],
      availability: [{ day: 'monday', startTime: '09:00', endTime: '17:00' }]
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
      emergencyContact: { name: 'Emergency Contact', phone: '1234567890' }
    }
  });
  patientId = patient._id;

  // Get tokens
  const doctorLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'doctor@test.com', password: 'password123' });
  doctorToken = doctorLogin.body.token;

  const patientLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'patient@test.com', password: 'password123' });
  patientToken = patientLogin.body.token;

  // Create test documents
  const document = await MedicalDocument.create({
    title: 'Test Document',
    description: 'Test Description',
    type: 'report',
    patient: patientId,
    uploadedBy: doctorId,
    filePath: 'test.pdf',
    fileType: 'application/pdf',
    fileSize: 1024,
    category: 'lab_result',
    tags: ['test'],
    isPrivate: false
  });
  documentId = document._id;

  const privateDocument = await MedicalDocument.create({
    title: 'Private Document',
    description: 'Private Description',
    type: 'report',
    patient: patientId,
    uploadedBy: doctorId,
    filePath: 'private.pdf',
    fileType: 'application/pdf',
    fileSize: 1024,
    category: 'lab_result',
    tags: ['private'],
    isPrivate: true
  });
});

afterAll(async () => {
  if (mongoose.connection.readyState === 1) {
    await User.deleteMany({});
    await MedicalDocument.deleteMany({});
    await mongoose.connection.close();
  }
});

describe('Medical Document Endpoints', () => {
  describe('POST /api/documents/upload', () => {
    it('should upload a medical document', async () => {
      const res = await request(app)
        .post('/api/documents/upload')
        .set('Authorization', `Bearer ${doctorToken}`)
        .attach('document', path.join(__dirname, 'test-files/test.pdf'))
        .field('patientId', patientId)
        .field('title', 'Test Document')
        .field('description', 'Test Description')
        .field('category', 'lab_result')
        .field('tags', 'test');

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('title', 'Test Document');
      expect(res.body).toHaveProperty('patient', patientId.toString());
      expect(res.body).toHaveProperty('uploadedBy', doctorId.toString());
      expect(res.body).toHaveProperty('category', 'lab_result');
      expect(res.body.tags).toContain('test');
    });

    it('should not allow patient to upload documents', async () => {
      const res = await request(app)
        .post('/api/documents/upload')
        .set('Authorization', `Bearer ${patientToken}`)
        .attach('document', path.join(__dirname, 'test-files/test.pdf'))
        .field('patientId', patientId)
        .field('title', 'Test Document');

      expect(res.statusCode).toBe(403);
    });
  });

  describe('GET /api/documents/patient/:patientId', () => {
    it('should get all documents for a patient', async () => {
      const res = await request(app)
        .get(`/api/documents/patient/${patientId}`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBe(2);
      expect(res.body[0].title).toBe('Test Document');
    });

    it('should not allow unauthorized access to private documents', async () => {
      const res = await request(app)
        .get(`/api/documents/patient/${patientId}`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.length).toBe(1); // Should only see non-private document
    });
  });

  describe('GET /api/documents/:id', () => {
    it('should get a specific document', async () => {
      const res = await request(app)
        .get(`/api/documents/${documentId}`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.title).toBe('Test Document');
      expect(res.body.uploadedBy).toHaveProperty('name', 'Test Doctor');
      expect(res.body.patient).toHaveProperty('name', 'Test Patient');
    });

    it('should not allow unauthorized access', async () => {
      const res = await request(app)
        .get(`/api/documents/${documentId}`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.statusCode).toBe(403);
    });
  });

  describe('PATCH /api/documents/:id', () => {
    it('should update document metadata', async () => {
      const res = await request(app)
        .patch(`/api/documents/${documentId}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          title: 'Updated Document',
          description: 'Updated Description',
          tags: ['updated', 'test']
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.title).toBe('Updated Document');
      expect(res.body.description).toBe('Updated Description');
      expect(res.body.tags).toContain('updated');
    });

    it('should not allow patient to update document', async () => {
      const res = await request(app)
        .patch(`/api/documents/${documentId}`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          title: 'Updated Document'
        });

      expect(res.statusCode).toBe(403);
    });
  });

  describe('DELETE /api/documents/:id', () => {
    it('should delete a document', async () => {
      const res = await request(app)
        .delete(`/api/documents/${documentId}`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.statusCode).toBe(200);

      // Verify document is deleted
      const deletedDoc = await MedicalDocument.findById(documentId);
      expect(deletedDoc).toBeNull();
    });

    it('should not allow patient to delete document', async () => {
      const res = await request(app)
        .delete(`/api/documents/${documentId}`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.statusCode).toBe(403);
    });
  });
}); 