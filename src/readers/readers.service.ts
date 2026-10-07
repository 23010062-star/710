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
