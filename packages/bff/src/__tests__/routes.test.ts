import { afterEach, describe, test, expect, vi } from 'vitest';
import request from 'supertest';
import { createServer } from '../server.js';

const app = createServer();

function mockTaktApiResponses(responses: unknown[]) {
  const queue = [...responses];
  process.env.TAKT_API_BASE_URL = 'https://api.test/takt';

  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => queue.shift(),
    })),
  );
}

describe('BFF API Endpoints', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.TAKT_API_BASE_URL;
  });

  test('GET /health returns status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('POST /api/auth/login returns token and user data', async () => {
    mockTaktApiResponses([
      {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        accessTokenExpiresInMs: 3600000,
      },
      {
        id: 'usr-1',
        username: 'giovanna',
        email: 'giovanna@takt.com',
        fullName: 'Giovanna Freitas',
      },
    ]);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'giovanna', password: 'password123' });
    
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBe('access-token');
    expect(res.body.refreshToken).toBe('refresh-token');
    expect(res.body.user.username).toBe('giovanna');
  });

  test('POST /api/auth/login fails when parameters are missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'giovanna' });
    
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Username and password are required');
  });

  test('POST /api/auth/register returns an authenticated session', async () => {
    mockTaktApiResponses([
      {
        id: 'usr-1',
        username: 'giovanna',
        email: 'giovanna@takt.com',
      },
      {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        accessTokenExpiresInMs: 3600000,
      },
      {
        id: 'usr-1',
        username: 'giovanna',
        email: 'giovanna@takt.com',
        fullName: 'Giovanna Freitas',
      },
    ]);

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'giovanna',
        email: 'giovanna@takt.com',
        password: 'Senha@123',
      });

    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBe('access-token');
    expect(res.body.refreshToken).toBe('refresh-token');
    expect(res.body.user.email).toBe('giovanna@takt.com');
  });

  test('GET /api/categories returns category list', async () => {
    const res = await request(app).get('/api/categories');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(4); // Default 4 categories
  });

  test('POST and DELETE /api/categories handles custom categories', async () => {
    const newCat = { name: 'Coding Session', color: '#123456' };
    const createRes = await request(app)
      .post('/api/categories')
      .send(newCat);
    
    expect(createRes.status).toBe(201);
    expect(createRes.body.name).toBe('Coding Session');
    expect(createRes.body.isCustom).toBe(true);
    
    const deleteRes = await request(app)
      .delete(`/api/categories/${createRes.body.id}`);
    
    expect(deleteRes.status).toBe(200);
  });

  test('POST /api/categories validates name length', async () => {
    const longName = 'a'.repeat(51);
    const res = await request(app)
      .post('/api/categories')
      .send({ name: longName });
    
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Category name must be maximum 50 characters');
  });

  test('POST /api/time-entries validates note character length', async () => {
    const activityPayload = {
      categoryId: 'cat-global-2',
      categoryName: 'Programação',
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      productivityLevel: 4,
      title: 'Dev coding',
      note: 'a'.repeat(501), // over 500 characters
    };

    const res = await request(app)
      .post('/api/time-entries')
      .send(activityPayload);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Note cannot exceed 500 characters');
  });
});
