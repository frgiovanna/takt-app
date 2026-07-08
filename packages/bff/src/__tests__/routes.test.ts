import { describe, test, expect } from 'vitest';
import request from 'supertest';
import { createServer } from '../server';

const app = createServer();

describe('BFF API Endpoints', () => {
  test('GET /health returns status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('POST /api/auth/login returns token and user data', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@takt.com', password: 'password123' });
    
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe('test@takt.com');
  });

  test('POST /api/auth/login fails when parameters are missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@takt.com' });
    
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Email and password are required');
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

  test('POST /api/activities validates note character length', async () => {
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
      .post('/api/activities')
      .send(activityPayload);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Note cannot exceed 500 characters');
  });
});
