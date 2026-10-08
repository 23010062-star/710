import { Test, TestingModule } from '@nestjs/testing';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service.js';
import { UsersService } from '../users/users.service.js';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: 'test-secret', signOptions: { expiresIn: '60s' } })],
      providers: [AuthService, UsersService],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('trả về user không kèm password khi đúng mật khẩu', async () => {
      const user = await service.validateUser('john', 'changeme');
      expect(user).toEqual({ userId: 1, username: 'john' });
      expect(user).not.toHaveProperty('password');
    });

    it('trả về null khi sai mật khẩu', async () => {
      expect(await service.validateUser('john', 'wrong-password')).toBeNull();
    });

    it('trả về null khi username không tồn tại', async () => {
      expect(await service.validateUser('nobody', 'changeme')).toBeNull();
    });
  });

  describe('login', () => {
    it('trả về access_token là chuỗi JWT có payload sub/username', async () => {
      const result = await service.login({ userId: 1, username: 'john' });

      expect(result.access_token).toEqual(expect.any(String));
      // decode payload để kiểm tra
      const payload = JSON.parse(Buffer.from(result.access_token.split('.')[1], 'base64url').toString());
      expect(payload).toMatchObject({ sub: 1, username: 'john' });
    });
  });
});
