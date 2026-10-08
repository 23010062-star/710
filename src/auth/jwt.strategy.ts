import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { jwtConstants } from './constants.js';

/** Payload mà AuthService.login() đã ký vào token */
export interface JwtPayload {
  sub: number;
  username: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  // Kết quả của hàm này sẽ gắn vào req.user
  async validate(payload: JwtPayload): Promise<{ userId: number; username: string }> {
    return { userId: payload.sub, username: payload.username };
  }
}
