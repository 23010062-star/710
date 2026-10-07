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
