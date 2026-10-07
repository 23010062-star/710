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
