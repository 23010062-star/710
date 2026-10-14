# Đồ án: Hệ thống Quản lý Thư viện

**Stack:** NestJS 12 + TypeORM + SQLite + React 19 + Vite + Axios

---

## Mục lục

1. [Backend — NestJS](#backend--nestjs)
2. [Frontend — React + Vite](#frontend--react--vite)
3. [Cấu trúc project](#cấu-trúc-project)
4. [API Endpoints](#api-endpoints)

---

## Backend — NestJS

### `src/main.ts`

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Cho phép frontend (Vite) gọi API cross-origin
  app.enableCors();

  // Validation toàn cục: tự động validate DTO và transform query/body
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Library API đang chạy tại: http://localhost:${port}`);
}
void bootstrap();
```

### `src/app.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { BooksModule } from './books/books.module.js';
import { ReadersModule } from './readers/readers.module.js';
import { BorrowedRecordsModule } from './borrowed-records/borrowed-records.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // Kết nối CSDL - Local (SQLite) hoặc Aiven/MySQL
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
        const dbType = configService.get<string>('DB_TYPE', 'sqlite');

        // ----- Aiven / MySQL -----
        if (dbType === 'mysql') {
          return {
            type: 'mysql',
            host: configService.get<string>('DB_HOST'),
            port: configService.get<number>('DB_PORT', 3306),
            username: configService.get<string>('DB_USERNAME'),
            password: configService.get<string>('DB_PASSWORD'),
            database: configService.get<string>('DB_NAME'),
            ssl: { rejectUnauthorized: false },
            autoLoadEntities: true,
            synchronize: true,
          };
        }

        // ----- Local: SQLite (mặc định) -----
        return {
          type: 'better-sqlite3',
          database: configService.get<string>('DATABASE_FILE', 'library.db'),
          autoLoadEntities: true,
          synchronize: true,
        };
      },
    }),

    BooksModule,
    ReadersModule,
    BorrowedRecordsModule,
    AuthModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

### `src/app.controller.ts`

```typescript
import { Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth/auth.service.js';
import { LocalAuthGuard } from './auth/local-auth.guard.js';
import { JwtAuthGuard } from './auth/jwt-auth.guard.js';

interface AuthenticatedRequest {
  user: { userId: number; username: string };
}

@Controller()
export class AppController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('auth/login')
  async login(@Request() req: AuthenticatedRequest) {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req: AuthenticatedRequest) {
    return req.user;
  }
}
```

### `src/app.service.ts`

```typescript
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
}
```

---

### Module Sách (Books)

#### `src/books/entities/book.entity.ts`

```typescript
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum BookStatus {
  AVAILABLE = 'AVAILABLE',
  BORROWED = 'BORROWED',
}

@Entity('books')
export class Book {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  title: string;

  @Column({ length: 255 })
  author: string;

  @Column({ length: 32, unique: true })
  isbn: string;

  @Column({ name: 'published_year', nullable: true })
  publishedYear?: number;

  @Column({ nullable: true })
  description?: string;

  @Column({
    type: 'simple-enum',
    enum: BookStatus,
    default: BookStatus.AVAILABLE,
  })
  status: BookStatus;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;
}
```

#### `src/books/dto/create-book.dto.ts`

```typescript
import {
  IsInt,
  IsISBN,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateBookDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  author: string;

  @IsString()
  @IsNotEmpty()
  @IsISBN()
  isbn: string;

  @IsInt()
  @Min(1000)
  @IsOptional()
  publishedYear?: number;

  @IsString()
  @IsOptional()
  description?: string;
}
```

#### `src/books/books.controller.ts`

```typescript
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { BooksService } from './books.service.js';
import { CreateBookDto } from './dto/create-book.dto.js';
import { Book } from './entities/book.entity.js';

@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Get()
  findAll(): Promise<Book[]> {
    return this.booksService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Book> {
    return this.booksService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateBookDto): Promise<Book> {
    return this.booksService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateBookDto>,
  ): Promise<Book> {
    return this.booksService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.booksService.remove(id);
  }
}
```

#### `src/books/books.service.ts`

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateBookDto } from './dto/create-book.dto.js';
import { Book } from './entities/book.entity.js';

@Injectable()
export class BooksService {
  constructor(
    @InjectRepository(Book)
    private readonly booksRepository: Repository<Book>,
  ) {}

  findAll(): Promise<Book[]> {
    return this.booksRepository.find({ order: { id: 'ASC' } });
  }

  async findOne(id: number): Promise<Book> {
    const book = await this.booksRepository.findOne({ where: { id } });
    if (!book) {
      throw new NotFoundException(`Không tìm thấy sách có id = ${id}`);
    }
    return book;
  }

  create(dto: CreateBookDto): Promise<Book> {
    return this.booksRepository.save(this.booksRepository.create(dto));
  }

  async update(id: number, dto: Partial<CreateBookDto>): Promise<Book> {
    await this.findOne(id);
    await this.booksRepository.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const result = await this.booksRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Không tìm thấy sách có id = ${id}`);
    }
  }
}
```

#### `src/books/books.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BooksController } from './books.controller.js';
import { BooksService } from './books.service.js';
import { Book } from './entities/book.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Book])],
  controllers: [BooksController],
  providers: [BooksService],
  exports: [BooksService],
})
export class BooksModule {}
```

---

### Module Độc giả (Readers)

#### `src/readers/entities/reader.entity.ts`

```typescript
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('readers')
export class Reader {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  fullName: string;

  @Column({ length: 255, unique: true })
  email: string;

  @Column({ length: 20, nullable: true })
  phone?: string;

  @Column({ length: 500, nullable: true })
  address?: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;
}
```

#### `src/readers/dto/create-reader.dto.ts`

```typescript
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateReaderDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;
}
```

#### `src/readers/readers.controller.ts`

```typescript
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ReadersService } from './readers.service.js';
import { CreateReaderDto } from './dto/create-reader.dto.js';
import { Reader } from './entities/reader.entity.js';

@Controller('readers')
export class ReadersController {
  constructor(private readonly readersService: ReadersService) {}

  @Get()
  findAll(): Promise<Reader[]> {
    return this.readersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Reader> {
    return this.readersService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateReaderDto): Promise<Reader> {
    return this.readersService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateReaderDto>,
  ): Promise<Reader> {
    return this.readersService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.readersService.remove(id);
  }
}
```

#### `src/readers/readers.service.ts`

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateReaderDto } from './dto/create-reader.dto.js';
import { Reader } from './entities/reader.entity.js';

@Injectable()
export class ReadersService {
  constructor(
    @InjectRepository(Reader)
    private readonly readersRepository: Repository<Reader>,
  ) {}

  findAll(): Promise<Reader[]> {
    return this.readersRepository.find({ order: { id: 'ASC' } });
  }

  async findOne(id: number): Promise<Reader> {
    const reader = await this.readersRepository.findOne({ where: { id } });
    if (!reader) {
      throw new NotFoundException(`Không tìm thấy độc giả có id = ${id}`);
    }
    return reader;
  }

  create(dto: CreateReaderDto): Promise<Reader> {
    return this.readersRepository.save(this.readersRepository.create(dto));
  }

  async update(id: number, dto: Partial<CreateReaderDto>): Promise<Reader> {
    await this.findOne(id);
    await this.readersRepository.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const result = await this.readersRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Không tìm thấy độc giả có id = ${id}`);
    }
  }
}
```

#### `src/readers/readers.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReadersController } from './readers.controller.js';
import { ReadersService } from './readers.service.js';
import { Reader } from './entities/reader.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Reader])],
  controllers: [ReadersController],
  providers: [ReadersService],
  exports: [ReadersService],
})
export class ReadersModule {}
```

---

### Module Phiếu mượn (Borrowed Records)

#### `src/borrowed-records/entities/borrowed-record.entity.ts`

```typescript
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Book } from '../../books/entities/book.entity.js';
import { Reader } from '../../readers/entities/reader.entity.js';

export enum BorrowStatus {
  BORROWING = 'BORROWING',
  RETURNED = 'RETURNED',
}

@Entity('borrowed_records')
export class BorrowedRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Book, { eager: true })
  @JoinColumn({ name: 'book_id' })
  book: Book;

  @ManyToOne(() => Reader, { eager: true })
  @JoinColumn({ name: 'reader_id' })
  reader: Reader;

  @CreateDateColumn({ name: 'borrowed_date', type: 'datetime' })
  borrowedDate: Date;

  @Column({ name: 'due_date', type: 'datetime' })
  dueDate: Date;

  @Column({ name: 'returned_date', type: 'datetime', nullable: true })
  returnedDate: Date | null;

  @Column({
    type: 'simple-enum',
    enum: BorrowStatus,
    default: BorrowStatus.BORROWING,
  })
  status: BorrowStatus;
}
```

#### `src/borrowed-records/dto/borrow-book.dto.ts`

```typescript
import { IsDateString, IsInt, IsOptional, Min } from 'class-validator';

export class BorrowBookDto {
  @IsInt()
  @Min(1)
  readerId: number;

  @IsInt()
  @Min(1)
  bookId: number;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
```

#### `src/borrowed-records/borrowed-records.controller.ts`

```typescript
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { BorrowedRecordsService } from './borrowed-records.service.js';
import { BorrowBookDto } from './dto/borrow-book.dto.js';
import { BorrowStatus, BorrowedRecord } from './entities/borrowed-record.entity.js';

@Controller('borrowed-records')
export class BorrowedRecordsController {
  constructor(
    private readonly borrowedRecordsService: BorrowedRecordsService,
  ) {}

  @Post('borrow')
  borrow(@Body() dto: BorrowBookDto): Promise<BorrowedRecord> {
    return this.borrowedRecordsService.borrow(dto);
  }

  @Get()
  findAll(@Query('status') status?: BorrowStatus): Promise<BorrowedRecord[]> {
    if (status && !Object.values(BorrowStatus).includes(status)) {
      throw new BadRequestException(
        'status chỉ được phép: BORROWING hoặc RETURNED',
      );
    }
    return this.borrowedRecordsService.findAll(status);
  }

  @Put(':id/return')
  returnBook(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<BorrowedRecord> {
    return this.borrowedRecordsService.returnBook(id);
  }
}
```

#### `src/borrowed-records/borrowed-records.service.ts`

```typescript
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Book, BookStatus } from '../books/entities/book.entity.js';
import { Reader } from '../readers/entities/reader.entity.js';
import { BorrowBookDto } from './dto/borrow-book.dto.js';
import { BorrowStatus, BorrowedRecord } from './entities/borrowed-record.entity.js';

const DEFAULT_LOAN_DAYS = 14;

@Injectable()
export class BorrowedRecordsService {
  constructor(
    @InjectRepository(BorrowedRecord)
    private readonly borrowedRecordsRepository: Repository<BorrowedRecord>,
    private readonly dataSource: DataSource,
  ) {}

  async borrow(dto: BorrowBookDto): Promise<BorrowedRecord> {
    return this.dataSource.transaction(async (manager) => {
      const reader = await manager.findOne(Reader, {
        where: { id: dto.readerId },
      });
      if (!reader) {
        throw new NotFoundException(
          `Không tìm thấy độc giả có id = ${dto.readerId}`,
        );
      }

      const book = await manager.findOne(Book, { where: { id: dto.bookId } });
      if (!book) {
        throw new NotFoundException(
          `Không tìm thấy sách có id = ${dto.bookId}`,
        );
      }
      if (book.status !== BookStatus.AVAILABLE) {
        throw new BadRequestException(
          `Sách "${book.title}" hiện đang được mượn`,
        );
      }

      const dueDate = dto.dueDate
        ? new Date(dto.dueDate)
        : new Date(Date.now() + DEFAULT_LOAN_DAYS * 24 * 60 * 60 * 1000);

      const record = manager.create(BorrowedRecord, { book, reader, dueDate });
      const savedRecord = await manager.save(record);

      book.status = BookStatus.BORROWED;
      await manager.save(book);

      const result = await manager.findOne(BorrowedRecord, {
        where: { id: savedRecord.id },
        relations: { book: true, reader: true },
      });
      if (!result) {
        throw new NotFoundException(
          `Không tìm thấy phiếu mượn có id = ${savedRecord.id}`,
        );
      }
      return result;
    });
  }

  findAll(status?: BorrowStatus): Promise<BorrowedRecord[]> {
    const query = this.borrowedRecordsRepository
      .createQueryBuilder('record')
      .innerJoinAndSelect('record.book', 'book')
      .innerJoinAndSelect('record.reader', 'reader')
      .orderBy('record.borrowedDate', 'DESC');

    if (status) {
      query.andWhere('record.status = :status', { status });
    }

    return query.getMany();
  }

  async returnBook(id: number): Promise<BorrowedRecord> {
    return this.dataSource.transaction(async (manager) => {
      const record = await manager.findOne(BorrowedRecord, {
        where: { id },
        relations: { book: true },
      });
      if (!record) {
        throw new NotFoundException(
          `Không tìm thấy phiếu mượn có id = ${id}`,
        );
      }
      if (record.status === BorrowStatus.RETURNED) {
        throw new BadRequestException('Sách này đã được trả rồi');
      }

      record.status = BorrowStatus.RETURNED;
      record.returnedDate = new Date();

      if (record.book) {
        record.book.status = BookStatus.AVAILABLE;
        await manager.save(record.book);
      }

      const savedRecord = await manager.save(record);

      const result = await manager.findOne(BorrowedRecord, {
        where: { id: savedRecord.id },
        relations: { book: true, reader: true },
      });
      if (!result) {
        throw new NotFoundException(
          `Không tìm thấy phiếu mượn có id = ${savedRecord.id}`,
        );
      }
      return result;
    });
  }
}
```

#### `src/borrowed-records/borrowed-records.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BorrowedRecordsController } from './borrowed-records.controller.js';
import { BorrowedRecordsService } from './borrowed-records.service.js';
import { BorrowedRecord } from './entities/borrowed-record.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([BorrowedRecord])],
  controllers: [BorrowedRecordsController],
  providers: [BorrowedRecordsService],
  exports: [BorrowedRecordsService],
})
export class BorrowedRecordsModule {}
```

---

### Module Auth

#### `src/auth/auth.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service.js';
import { UsersModule } from '../users/users.module.js';
import { LocalStrategy } from './local.strategy.js';
import { JwtStrategy } from './jwt.strategy.js';
import { jwtConstants } from './constants.js';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '60s' },
    }),
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```

#### `src/auth/auth.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User, UsersService } from '../users/users.service.js';

export type SafeUser = Omit<User, 'password'>;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(username: string, pass: string): Promise<SafeUser | null> {
    const user = await this.usersService.findOne(username);
    if (user && user.password === pass) {
      const { password: _password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: { userId: number; username: string }): Promise<{ access_token: string }> {
    const payload = { username: user.username, sub: user.userId };
    return { access_token: await this.jwtService.signAsync(payload) };
  }
}
```

#### `src/auth/constants.ts`

```typescript
// Bí mật ký JWT - nên đặt trong .env (JWT_SECRET) ở môi trường thật
export const jwtConstants = {
  secret: process.env.JWT_SECRET ?? 'library-secret-key-change-me',
};
```

#### `src/auth/jwt-auth.guard.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

#### `src/auth/jwt.strategy.ts`

```typescript
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { jwtConstants } from './constants.js';

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

  async validate(payload: JwtPayload): Promise<{ userId: number; username: string }> {
    return { userId: payload.sub, username: payload.username };
  }
}
```

#### `src/auth/local-auth.guard.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}
```

#### `src/auth/local.strategy.ts`

```typescript
import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service.js';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super();
  }

  async validate(username: string, password: string): Promise<any> {
    const user = await this.authService.validateUser(username, password);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
```

---

### Module Users

#### `src/users/users.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { UsersService } from './users.service.js';

@Module({
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

#### `src/users/users.service.ts`

```typescript
import { Injectable } from '@nestjs/common';

// User entity (ví dụ tutorial: lưu trong bộ nhớ)
export interface User {
  userId: number;
  username: string;
  password: string;
}

@Injectable()
export class UsersService {
  private readonly users: User[] = [
    {
      userId: 1,
      username: 'john',
      password: 'changeme',
    },
    {
      userId: 2,
      username: 'maria',
      password: 'guess',
    },
  ];

  async findOne(username: string): Promise<User | undefined> {
    return this.users.find((user) => user.username === username);
  }
}
```

---

## Frontend — React + Vite

### `frontend/package.json`

```json
{
  "name": "library-frontend",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "axios": "^1.10.0",
    "react": "^19.1.0",
    "react-dom": "^19.1.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.5.0",
    "vite": "^6.3.0"
  }
}
```

### `frontend/vite.config.js`

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
```

### `frontend/index.html`

```html
<!DOCTYPE html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Quản lý Thư viện</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

### `frontend/src/main.jsx`

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

### `frontend/src/App.jsx`

```jsx
import { useState } from 'react';
import Header from './components/Header.jsx';
import Banner from './components/Banner.jsx';
import Content from './components/Content.jsx';
import Footer from './components/Footer.jsx';

export default function App() {
  const [activeTab, setActiveTab] = useState('books');

  return (
    <div className="app">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      <Banner />
      <Content activeTab={activeTab} />
      <Footer />
    </div>
  );
}
```

### `frontend/src/api.js`

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

// ---- Sách ----
export const fetchBooks = () => api.get('/books').then((res) => res.data);

// ---- Độc giả ----
export const fetchReaders = () => api.get('/readers').then((res) => res.data);

// ---- Phiếu mượn ----
export const fetchBorrowedRecords = (status) => {
  const params = status ? { status } : {};
  return api.get('/borrowed-records', { params }).then((res) => res.data);
};
```

### `frontend/src/components/Header.jsx`

```jsx
export default function Header({ activeTab, onTabChange }) {
  const tabs = [
    { key: 'books', label: 'Sách' },
    { key: 'readers', label: 'Độc giả' },
    { key: 'borrowed', label: 'Phiếu mượn' },
  ];

  return (
    <header className="header">
      <div className="header-inner">
        <h1 className="logo">Quản lý Thư viện</h1>
        <nav className="nav">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={`nav-btn ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => onTabChange(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
```

### `frontend/src/components/Banner.jsx`

```jsx
export default function Banner() {
  return (
    <section className="banner">
      <h2>Hệ thống Quản lý Thư viện</h2>
      <p>Quản lý sách, độc giả và phiến mượn trả một cách dễ dàng</p>
    </section>
  );
}
```

### `frontend/src/components/Footer.jsx`

```jsx
export default function Footer() {
  return (
    <footer className="footer">
      <p>&copy; 2026 Quản lý Thư viện. Đồ án NestJS + React.</p>
    </footer>
  );
}
```

### `frontend/src/components/Content.jsx`

```jsx
import { useEffect, useState } from 'react';
import { fetchBooks, fetchReaders, fetchBorrowedRecords } from '../api.js';

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('vi-VN');
}

function BooksTable() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBooks()
      .then(setBooks)
      .catch((err) => setError('Không thể tải dữ liệu sách'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="loading">Đang tải...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Tiêu đề</th>
          <th>Tác giả</th>
          <th>ISBN</th>
          <th>Năm XB</th>
          <th>Trạng thái</th>
        </tr>
      </thead>
      <tbody>
        {books.map((book) => (
          <tr key={book.id}>
            <td>{book.id}</td>
            <td>{book.title}</td>
            <td>{book.author}</td>
            <td>{book.isbn}</td>
            <td>{book.publishedYear ?? '-'}</td>
            <td>
              <span className={`badge ${book.status === 'AVAILABLE' ? 'badge-green' : 'badge-red'}`}>
                {book.status === 'AVAILABLE' ? 'Có sẵn' : 'Đã mượn'}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ReadersTable() {
  const [readers, setReaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReaders()
      .then(setReaders)
      .catch((err) => setError('Không thể tải dữ liệu độc giả'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="loading">Đang tải...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Họ tên</th>
          <th>Email</th>
          <th>Số điện thoại</th>
          <th>Địa chỉ</th>
        </tr>
      </thead>
      <tbody>
        {readers.map((reader) => (
          <tr key={reader.id}>
            <td>{reader.id}</td>
            <td>{reader.fullName}</td>
            <td>{reader.email}</td>
            <td>{reader.phone ?? '-'}</td>
            <td>{reader.address ?? '-'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function BorrowedTable() {
  const [records, setRecords] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetchBorrowedRecords(status || undefined)
      .then(setRecords)
      .catch((err) => setError('Không thể tải dữ liệu phiếu mượn'))
      .finally(() => setLoading(false));
  }, [status]);

  return (
    <div>
      <div className="filter-bar">
        <label>Lọc theo trạng thái: </label>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Tất cả</option>
          <option value="BORROWING">Đang mượn</option>
          <option value="RETURNED">Đã trả</option>
        </select>
      </div>
      {loading && <p className="loading">Đang tải...</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && (
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Sách</th>
              <th>Người mượn</th>
              <th>Ngày mượn</th>
              <th>Hạn trả</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id}>
                <td>{record.id}</td>
                <td>{record.book?.title ?? '-'}</td>
                <td>{record.reader?.fullName ?? '-'}</td>
                <td>{formatDate(record.borrowedDate)}</td>
                <td>{formatDate(record.dueDate)}</td>
                <td>
                  <span className={`badge ${record.status === 'BORROWING' ? 'badge-yellow' : 'badge-green'}`}>
                    {record.status === 'BORROWING' ? 'Đang mượn' : 'Đã trả'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function Content({ activeTab }) {
  return (
    <main className="content">
      {activeTab === 'books' && <BooksTable />}
      {activeTab === 'readers' && <ReadersTable />}
      {activeTab === 'borrowed' && <BorrowedTable />}
    </main>
  );
}
```

### `frontend/src/styles.css`

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: Arial, sans-serif;
  background: #f5f5f5;
  color: #333;
}

.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Header */
.header {
  background: #fff;
  border-bottom: 1px solid #ddd;
  padding: 12px 24px;
}

.header-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  font-size: 20px;
  font-weight: bold;
}

.nav {
  display: flex;
  gap: 8px;
}

.nav-btn {
  padding: 8px 16px;
  border: 1px solid #ccc;
  background: #fff;
  cursor: pointer;
  border-radius: 4px;
  font-size: 14px;
}

.nav-btn:hover {
  background: #eee;
}

.nav-btn.active {
  background: #333;
  color: #fff;
  border-color: #333;
}

/* Banner */
.banner {
  background: #fff;
  border-bottom: 1px solid #ddd;
  padding: 32px 24px;
  text-align: center;
}

.banner h2 {
  font-size: 24px;
  margin-bottom: 8px;
}

.banner p {
  color: #666;
  font-size: 14px;
}

/* Content */
.content {
  flex: 1;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 24px;
}

/* Table */
.data-table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  border: 1px solid #ddd;
}

.data-table th,
.data-table td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
  font-size: 14px;
}

.data-table th {
  background: #fafafa;
  font-weight: 600;
}

.data-table tr:hover {
  background: #f9f9f9;
}

/* Badge */
.badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
}

.badge-green {
  background: #e6f4ea;
  color: #2e7d32;
}

.badge-red {
  background: #fce8e6;
  color: #c62828;
}

.badge-yellow {
  background: #fff8e1;
  color: #f57f17;
}

/* Filter */
.filter-bar {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-bar select {
  padding: 6px 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
}

/* Loading / Error */
.loading {
  text-align: center;
  padding: 40px;
  color: #666;
}

.error {
  text-align: center;
  padding: 40px;
  color: #c62828;
}

/* Footer */
.footer {
  background: #fff;
  border-top: 1px solid #ddd;
  padding: 16px 24px;
  text-align: center;
  font-size: 13px;
  color: #888;
}
```

---

## Cấu trúc project

```
.
├── src/                              # Backend (NestJS)
│   ├── main.ts                       # Bootstrap + CORS + ValidationPipe
│   ├── app.module.ts                 # ConfigModule + TypeOrmModule
│   ├── app.controller.ts             # POST /auth/login, GET /profile
│   ├── app.service.ts                # Hello World scaffold
│   ├── books/                        # Module Sách
│   │   ├── entities/book.entity.ts
│   │   ├── dto/create-book.dto.ts
│   │   ├── books.controller.ts
│   │   ├── books.service.ts
│   │   └── books.module.ts
│   ├── readers/                      # Module Độc giả
│   │   ├── entities/reader.entity.ts
│   │   ├── dto/create-reader.dto.ts
│   │   ├── readers.controller.ts
│   │   ├── readers.service.ts
│   │   └── readers.module.ts
│   ├── borrowed-records/             # Module Phiếu mượn
│   │   ├── entities/borrowed-record.entity.ts
│   │   ├── dto/borrow-book.dto.ts
│   │   ├── borrowed-records.controller.ts
│   │   ├── borrowed-records.service.ts
│   │   └── borrowed-records.module.ts
│   ├── auth/                         # Module Auth (JWT + Local)
│   │   ├── auth.module.ts
│   │   ├── auth.service.ts
│   │   ├── constants.ts
│   │   ├── jwt-auth.guard.ts
│   │   ├── jwt.strategy.ts
│   │   ├── local-auth.guard.ts
│   │   └── local.strategy.ts
│   └── users/                        # Module Users (in-memory)
│       ├── users.module.ts
│       └── users.service.ts
├── frontend/                         # Frontend (React + Vite)
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── api.js
│       ├── styles.css
│       └── components/
│           ├── Header.jsx
│           ├── Banner.jsx
│           ├── Content.jsx
│           └── Footer.jsx
├── test/                             # E2E tests
│   └── app.e2e-spec.ts
├── package.json
├── tsconfig.json
└── nest-cli.json
```

---

## API Endpoints

| Method | URL | Mô tả |
|---|---|---|
| GET | `/books` | Danh sách sách |
| GET | `/books/:id` | Chi tiết sách |
| POST | `/books` | Thêm sách |
| PATCH | `/books/:id` | Sửa sách |
| DELETE | `/books/:id` | Xóa sách |
| GET | `/readers` | Danh sách độc giả |
| GET | `/readers/:id` | Chi tiết độc giả |
| POST | `/readers` | Thêm độc giả |
| PATCH | `/readers/:id` | Sửa độc giả |
| DELETE | `/readers/:id` | Xóa độc giả |
| POST | `/borrowed-records/borrow` | Mượn sách |
| GET | `/borrowed-records?status=BORROWING` | Lọc phiếu mượn |
| PUT | `/borrowed-records/:id/return` | Trả sách |
| POST | `/auth/login` | Đăng nhập → JWT |
| GET | `/profile` | Thông tin user (cần Bearer token) |

---

## Hướng dẫn chạy

```bash
# 1. Chạy backend (Terminal 1)
npm install
npm run start:dev
# → http://localhost:3000

# 2. Chạy frontend (Terminal 2)
cd frontend
npm install
npm run dev
# → http://localhost:5173
```
