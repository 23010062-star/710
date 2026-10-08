import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Bảo vệ route: yêu cầu header Authorization: Bearer <access_token>
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
