import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User, UsersService } from '../users/users.service.js';

/** User đã bỏ password — thứ được trả ra ngoài và ký vào token */
export type SafeUser = Omit<User, 'password'>;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  // Kiểm tra username/password (LocalStrategy gọi qua POST /auth/login)
  async validateUser(username: string, pass: string): Promise<SafeUser | null> {
    const user = await this.usersService.findOne(username);
    if (user && user.password === pass) {
      const { password: _password, ...result } = user;
      return result;
    }
    return null;
  }

  // Cấp access token — phần JWT functionality
  async login(user: { userId: number; username: string }): Promise<{ access_token: string }> {
    const payload = { username: user.username, sub: user.userId };
    return { access_token: await this.jwtService.signAsync(payload) };
  }
}
