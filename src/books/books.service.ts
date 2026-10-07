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
