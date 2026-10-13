import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-that-is-definitely-long-enough';
process.env.CLIENT_ORIGIN = 'http://localhost:5173';
process.env.MONGO_URI = 'mongodb://127.0.0.1/test';

let replSet;
let app;
let adminAgent;
let guestAgent;
let otherAgent;
let roomType;
let reservation;

async function csrf(agent) {
  const res = await agent.get('/api/auth/me');
  const cookie = res.headers['set-cookie']?.find((c) => c.startsWith('hotel_csrf='));
  return cookie?.split(';')[0].split('=')[1];
}

async function postWithCsrf(agent, url, payload) {
  const token = await csrf(agent);
  return agent.post(url).set('x-csrf-token', token).send(payload);
}

beforeAll(async () => {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  process.env.MONGO_URI = replSet.getUri();
  app = (await import('../app.js')).createApp();
  await mongoose.connect(process.env.MONGO_URI);
});

afterAll(async () => {
  await mongoose.disconnect();
  await replSet.stop();
});

beforeEach(async () => {
  await mongoose.connection.dropDatabase();
  const { User } = await import('../models/User.js');
  const { RoomType } = await import('../models/RoomType.js');
  const { Room } = await import('../models/Room.js');
  const { createReservation } = await import('../services/reservationService.js');
  roomType = await RoomType.create({ name: 'Deluxe', description: 'A large room with city views.', baseRate: 5000 });
  await Room.create({ roomNumber: '301', name: 'Deluxe 301', roomType: roomType._id, floor: 3, capacity: 2, bedType: 'King', sizeSqm: 34, nightlyRate: 5000, description: 'A comfortable deluxe room with practical amenities.', amenities: ['Wi-Fi'], images: [{ url: 'https://example.com/room.jpg' }] });
  const admin = await User.create({ name: 'Admin', email: 'admin@test.dev', password: 'Password1234', role: 'admin' });
  const guest = await User.create({ name: 'Guest', email: 'guest@test.dev', password: 'Password1234', role: 'guest' });
  await User.create({ name: 'Other', email: 'other@test.dev', password: 'Password1234', role: 'guest' });
  adminAgent = request.agent(app);
  guestAgent = request.agent(app);
  otherAgent = request.agent(app);
  await adminAgent.post('/api/auth/login').send({ email: 'admin@test.dev', password: 'Password1234' });
  await guestAgent.post('/api/auth/login').send({ email: 'guest@test.dev', password: 'Password1234' });
  await otherAgent.post('/api/auth/login').send({ email: 'other@test.dev', password: 'Password1234' });
  const checkIn = new Date(Date.now() + 5 * 86400000);
  const checkOut = new Date(Date.now() + 7 * 86400000);
  reservation = await createReservation({ user: guest, actor: admin, payload: { roomType: roomType._id, checkIn, checkOut, guests: 2, guestInfo: { name: guest.name, email: guest.email }, idempotencyKey: 'base-reservation' } });
});

describe('security and booking API', () => {
  it('blocks unauthenticated protected APIs', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(401);
  });

  it('prevents guests from reading another guest reservation', async () => {
    const res = await otherAgent.get(`/api/reservations/${reservation._id}`);
    expect(res.status).toBe(403);
  });

  it('prevents guest role escalation', async () => {
    const res = await postWithCsrf(guestAgent, `/api/users/${reservation.guest}/status`, { isActive: false });
    expect([403, 404]).toContain(res.status);
  });

  it('rejects unsafe query operators', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: { $gt: '' }, password: 'Password1234' });
    expect(res.status).toBe(400);
  });

  it('rejects overlapping reservations for the same physical inventory', async () => {
    const checkIn = new Date(Date.now() + 5 * 86400000).toISOString();
    const checkOut = new Date(Date.now() + 7 * 86400000).toISOString();
    const res = await postWithCsrf(guestAgent, '/api/reservations', { roomType: roomType._id.toString(), checkIn, checkOut, guests: 2, guestInfo: { name: 'Guest', email: 'guest@test.dev' }, idempotencyKey: 'overlap-key' });
    expect(res.status).toBe(409);
  });

  it('deduplicates payment records with idempotency keys', async () => {
    const body = { reservation: reservation._id, method: 'pay-at-reception', status: 'paid', amount: 1000, idempotencyKey: 'payment-key' };
    const first = await postWithCsrf(adminAgent, '/api/payments', body);
    const second = await postWithCsrf(adminAgent, '/api/payments', body);
    expect(first.status).toBe(201);
    expect(second.status).toBe(200);
  });

  it('rejects invalid status transitions', async () => {
    const res = await postWithCsrf(adminAgent, `/api/reservations/${reservation._id}/status`, { status: 'checked-out' });
    expect(res.status).toBe(404);
    const token = await csrf(adminAgent);
    const patch = await adminAgent.patch(`/api/reservations/${reservation._id}/status`).set('x-csrf-token', token).send({ status: 'checked-out' });
    expect(patch.status).toBe(400);
  });

  it('sets security headers', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-dns-prefetch-control']).toBe('off');
  });
});

