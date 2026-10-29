// Set required env vars BEFORE any module imports
process.env.JWT_SECRET = 'test-secret-key-for-testing';
process.env.JWT_EXPIRES_IN = '1h';
process.env.BCRYPT_ROUNDS = '12';
process.env.NODE_ENV = 'test';

// ===== Create mock functions FIRST in the test file scope =====
const mockHashPassword = jest.fn().mockImplementation(async (pwd: string) => `$2a$12$hashed_${pwd}`);
const mockComparePassword = jest.fn().mockResolvedValue(true);
const mockGenerateToken = jest.fn().mockReturnValue('mock-jwt-token');
const mockVerifyToken = jest.fn().mockReturnValue({
  userId: 'mock-user-id',
  username: 'testuser123',
  email: 'test@example.com',
  iat: 1000000000,
  exp: 1000000007,
});

const mockUserFindFirst = jest.fn();
const mockUserFindUnique = jest.fn();
const mockUserCreate = jest.fn();
const mockUserDeleteMany = jest.fn();
const mockUserFindMany = jest.fn();

// ===== Mock ALL modules using the pre-created mocks =====
jest.mock('../src/db/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findFirst: mockUserFindFirst,
      findUnique: mockUserFindUnique,
      create: mockUserCreate,
      deleteMany: mockUserDeleteMany,
      findMany: mockUserFindMany,
    },
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../src/utils/password', () => ({
  hashPassword: mockHashPassword,
  comparePassword: mockComparePassword,
}));

jest.mock('../src/utils/jwt', () => ({
  generateToken: mockGenerateToken,
  verifyToken: mockVerifyToken,
}));

// NOW import modules - they will bind to our pre-created mocks
import request from 'supertest';
import app from '../src/app';

describe('Authentication API', () => {
  const testUser = {
    username: 'testuser123',
    email: 'test@example.com',
    password: 'TestPassword123!',
  };

  beforeEach(() => {
    // Fully reset all mock functions (clears implementations and call history)
    mockHashPassword.mockReset().mockImplementation(async (pwd: string) => `$2a$12$hashed_${pwd}`);
    mockComparePassword.mockReset().mockResolvedValue(true);
    mockGenerateToken.mockReset().mockReturnValue('mock-jwt-token');
    mockVerifyToken.mockReset().mockReturnValue({
      userId: 'mock-user-id',
      username: 'testuser123',
      email: 'test@example.com',
      iat: 1000000000,
      exp: 1000000007,
    });
    mockUserFindFirst.mockReset();
    mockUserFindUnique.mockReset();
    mockUserCreate.mockReset();
    mockUserDeleteMany.mockReset();
    mockUserFindMany.mockReset();
  });

  describe('POST /api/auth/signup', () => {
    it('should create a new user successfully', async () => {
      mockUserFindFirst.mockResolvedValue(null);
      mockUserCreate.mockResolvedValue({
        id: 'mock-id',
        username: testUser.username,
        email: testUser.email,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const res = await request(app)
        .post('/api/auth/signup')
        .send(testUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.username).toBe(testUser.username);
      expect(res.body.data.token).toBe('mock-jwt-token');
      expect(mockHashPassword).toHaveBeenCalledWith(testUser.password);
    });

    it('should not allow duplicate usernames', async () => {
      mockUserFindFirst
        .mockResolvedValueOnce({ id: '1', username: testUser.username, email: '', password: '', createdAt: new Date(), updatedAt: new Date() } as any)
        .mockResolvedValueOnce(null);

      const res = await request(app)
        .post('/api/auth/signup')
        .send({ ...testUser, email: 'other@example.com' });

      expect(res.status).toBe(409);
      expect(res.body.message).toContain('Username already taken');
    });

    it('should not allow duplicate emails', async () => {
      mockUserFindFirst
        .mockResolvedValueOnce(null) // username not found
        .mockResolvedValueOnce({ id: '1', username: 'existing', email: testUser.email, password: '', createdAt: new Date(), updatedAt: new Date() } as any); // email found

      const res = await request(app)
        .post('/api/auth/signup')
        .send({ ...testUser, username: 'otheruser' });

      expect(res.status).toBe(409);
      expect(res.body.message).toContain('Email already registered');
    });

    it('should reject weak passwords', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ ...testUser, password: 'weak' });

      expect(res.status).toBe(400);
      expect(res.body.errors?.password).toBeDefined();
    });

    it('should reject invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ ...testUser, email: 'not-an-email' });

      expect(res.status).toBe(400);
      expect(res.body.errors?.email).toBeDefined();
    });

    it('should hash passwords and not store plaintext', async () => {
      mockUserFindFirst.mockResolvedValue(null);
      mockUserCreate.mockResolvedValue({
        id: 'mock-id',
        username: testUser.username,
        email: testUser.email,
        password: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      await request(app)
        .post('/api/auth/signup')
        .send(testUser);

      expect(mockHashPassword).toHaveBeenCalledWith(testUser.password);
      expect(mockUserCreate).toHaveBeenCalled();
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      mockUserFindUnique.mockResolvedValue({
        id: 'mock-id',
        username: testUser.username,
        email: testUser.email,
        password: '$2a$12$hashed',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: testUser.username, password: testUser.password });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBe('mock-jwt-token');
      expect(res.body.data.user.password).toBeUndefined();
      expect(mockComparePassword).toHaveBeenCalledWith(testUser.password, '$2a$12$hashed');
    });

    it('should reject wrong password', async () => {
      mockUserFindUnique.mockResolvedValue({
        id: 'mock-id',
        username: testUser.username,
        email: testUser.email,
        password: '$2a$12$hashed',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      mockComparePassword.mockResolvedValue(false);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: testUser.username, password: 'WrongPassword123!' });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Invalid credentials');
    });

    it('should reject non-existent username', async () => {
      mockUserFindUnique.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'nonexistent', password: 'AnyPassword123!' });

      expect(res.status).toBe(401);
    });

    it('should reject missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: testUser.username });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user profile with valid token', async () => {
      mockUserFindUnique.mockResolvedValue({
        id: 'mock-id',
        username: testUser.username,
        email: testUser.email,
        password: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer mock-jwt-token');

      expect(res.status).toBe(200);
      expect(res.body.data.username).toBe(testUser.username);
    });

    it('should reject requests without token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('should reject invalid token', async () => {
      mockVerifyToken.mockReturnValue(null);

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
    });
  });

  describe('Security', () => {
    it('should not expose password in signup response', async () => {
      mockUserFindFirst.mockResolvedValue(null);
      mockUserCreate.mockResolvedValue({
        id: 'mock-id',
        username: testUser.username,
        email: testUser.email,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const signupRes = await request(app)
        .post('/api/auth/signup')
        .send(testUser);

      expect(signupRes.body.data.user.password).toBeUndefined();
    });

    it('should handle SQL injection attempts', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          username: "'; DROP TABLE users; --",
          email: 'test@test.com',
          password: 'TestPassword123!',
        });

      expect(res.status).toBe(400);
    });
  });
});