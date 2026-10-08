import { Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth/auth.service.js';
import { LocalAuthGuard } from './auth/local-auth.guard.js';
import { JwtAuthGuard } from './auth/jwt-auth.guard.js';

/** req.user do LocalAuthGuard / JwtAuthGuard gắn vào */
interface AuthenticatedRequest {
  user: { userId: number; username: string };
}

@Controller()
export class AppController {
  constructor(private readonly authService: AuthService) {}

  // POST /auth/login  { "username": "john", "password": "changeme" }
  // → { "access_token": "..." }
  @UseGuards(LocalAuthGuard)
  @Post('auth/login')
  async login(@Request() req: AuthenticatedRequest) {
    return this.authService.login(req.user);
  }

  // GET /profile với header "Authorization: Bearer <access_token>"
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req: AuthenticatedRequest) {
    return req.user;
  }
}
