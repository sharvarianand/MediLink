const mongoose = require('mongoose');

// Set test environment variables
process.env.JWT_SECRET = 'test-secret-key';
process.env.NODE_ENV = 'test';

// Mock email service
jest.mock('../utils/emailService', () => ({
  sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
  sendAppointmentEmail: jest.fn().mockResolvedValue(true)
}));

beforeAll(async () => {
  const mongoURI = 'mongodb://localhost:27017/medilink_test';
  await mongoose.connect(mongoURI);
});

afterAll(async () => {
  await mongoose.disconnect();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany();
  }
}); 