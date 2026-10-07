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
