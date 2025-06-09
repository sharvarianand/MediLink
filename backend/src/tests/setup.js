const mongoose = require('mongoose');

// Set up test environment variables
process.env.JWT_SECRET = 'test-secret-key';
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/medilink_test';

// Increase timeout for tests
jest.setTimeout(30000);

// Mock email service
jest.mock('../utils/emailService', () => ({
  sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
  sendAppointmentEmail: jest.fn().mockResolvedValue(true)
}));

// Connect to test database
beforeAll(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  } catch (error) {
    console.error('Error connecting to test database:', error);
    process.exit(1);
  }
});

// Clear database after each test
afterEach(async () => {
  const collections = await mongoose.connection.db.collections();
  for (let collection of collections) {
    await collection.deleteMany({});
  }
});

// Close database connection after all tests
afterAll(async () => {
  await mongoose.connection.close();
}); 