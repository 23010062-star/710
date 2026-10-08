// Bí mật ký JWT - nên đặt trong .env (JWT_SECRET) ở môi trường thật
export const jwtConstants = {
  secret: process.env.JWT_SECRET ?? 'library-secret-key-change-me',
};
