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

  /** 3.3: Độc giả mượn sách */
  @Post('borrow')
  borrow(@Body() dto: BorrowBookDto): Promise<BorrowedRecord> {
    return this.borrowedRecordsService.borrow(dto);
  }

  /** 3.4: Liệt kê sách đã mượn (?status=BORROWING | RETURNED) */
  @Get()
  findAll(@Query('status') status?: BorrowStatus): Promise<BorrowedRecord[]> {
    if (status && !Object.values(BorrowStatus).includes(status)) {
      throw new BadRequestException(
        'status chỉ được phép: BORROWING hoặc RETURNED',
      );
    }
    return this.borrowedRecordsService.findAll(status);
  }

  /** Trả sách */
  @Put(':id/return')
  returnBook(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<BorrowedRecord> {
    return this.borrowedRecordsService.returnBook(id);
  }
}
