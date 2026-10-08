import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller.js';
import { AuthService } from './auth/auth.service.js';

describe('AppController', () => {
  let appController: AppController;
  const authService = { login: vi.fn() };

  beforeEach(async () => {
    authService.login.mockReset();
    authService.login.mockResolvedValue({ access_token: 'test-token' });

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('POST /auth/login', () => {
    it('trả về access_token từ AuthService.login', async () => {
      const req = { user: { userId: 1, username: 'john' } };
      const result = await appController.login(req);

      expect(authService.login).toHaveBeenCalledWith(req.user);
      expect(result).toEqual({ access_token: 'test-token' });
    });
  });

  describe('GET /profile', () => {
    it('trả về user hiện tại (đã verify qua JWT)', () => {
      const req = { user: { userId: 1, username: 'john' } };
      expect(appController.getProfile(req)).toEqual({ userId: 1, username: 'john' });
    });
  });
});
