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
