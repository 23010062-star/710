import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { BooksModule } from './books/books.module.js';
import { ReadersModule } from './readers/readers.module.js';
import { BorrowedRecordsModule } from './borrowed-records/borrowed-records.module.js';

@Module({
  imports: [
    // Đọc cấu hình từ .env
    ConfigModule.forRoot({ isGlobal: true }),

    // 3.1: Kết nối CSDL - Local (SQLite) hoặc Aiven/MySQL
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
            // Aiven yêu cầu kết nối SSL
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
