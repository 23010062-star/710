import { IsDateString, IsInt, IsOptional, Min } from 'class-validator';

export class BorrowBookDto {
  @IsInt()
  @Min(1)
  readerId: number;

  @IsInt()
  @Min(1)
  bookId: number;

  // Nếu không truyền, mặc định hạn trả = ngày mượn + 14 ngày
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
