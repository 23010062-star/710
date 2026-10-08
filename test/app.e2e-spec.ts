import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('POST /auth/login với sai mật khẩu → 401', () => {
    return request(app.getHttpServer()).post('/auth/login').send({ username: 'john', password: 'wrong' }).expect(401);
  });

  it('POST /auth/login hợp lệ → 200 + access_token', async () => {
    const res = await request(app.getHttpServer()).post('/auth/login').send({ username: 'john', password: 'changeme' }).expect(201);

    expect(res.body.access_token).toEqual(expect.any(String));
  });

  it('GET /profile không token → 401', () => {
    return request(app.getHttpServer()).get('/profile').expect(401);
  });

  it('GET /profile với Bearer token → 200 + user', async () => {
    const login = await request(app.getHttpServer()).post('/auth/login').send({ username: 'john', password: 'changeme' }).expect(201);

    return request(app.getHttpServer())
      .get('/profile')
      .set('Authorization', `Bearer ${login.body.access_token}`)
      .expect(200)
      .expect({ userId: 1, username: 'john' });
  });
});
