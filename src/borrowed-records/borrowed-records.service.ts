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

  /**
   * 3.3: Độc giả mượn sách
   * - Kiểm tra độc giả & sách tồn tại
   * - Kiểm tra sách còn trống
   * - Tạo BorrowedRecord và cập nhật trạng thái sách (transaction)
   */
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

      // Trả về phiếu mượn với đầy đủ thông tin sách & độc giả
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

  /**
   * 3.4: Liệt kê danh sách sách đã được mượn
   * (thông tin: sách, ngày mượn, người mượn, hạn trả)
   */
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

  /** Trả sách: cập nhật phiếu mượn và trả trạng thái sách về AVAILABLE */
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

      // Trả về phiếu mượn với đầy đủ thông tin sách & độc giả
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
