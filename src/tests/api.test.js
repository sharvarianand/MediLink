const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');

describe('API Endpoints', () => {
  let authToken;
  let testUser;

  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('Authentication', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          role: 'patient',
          profile: {
            age: 25,
            gender: 'male'
          }
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('email', 'test@example.com');
      
      authToken = res.body.token;
      testUser = res.body.user;
    });

    it('should login existing user', async () => {
      // First create a user
      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'patient'
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
    });

    it('should get current user profile', async () => {
      // First create a user and get token
      const signupRes = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          role: 'patient'
        });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${signupRes.body.token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.user).toHaveProperty('email', 'test@example.com');
    });
  });

  describe('Password Reset', () => {
    it('should send password reset email', async () => {
      // First create a user
      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'patient'
      });

      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'test@example.com'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message', 'Password reset email sent');
    });
  });

  describe('User Profile', () => {
    it('should get user profile', async () => {
      // First create a user and get token
      const signupRes = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          role: 'patient'
        });

      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${signupRes.body.token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('user');
    });
  });
}); 