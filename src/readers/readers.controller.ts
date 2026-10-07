import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ReadersService } from './readers.service.js';
import { CreateReaderDto } from './dto/create-reader.dto.js';
import { Reader } from './entities/reader.entity.js';

@Controller('readers')
export class ReadersController {
  constructor(private readonly readersService: ReadersService) {}

  @Get()
  findAll(): Promise<Reader[]> {
    return this.readersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Reader> {
    return this.readersService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateReaderDto): Promise<Reader> {
    return this.readersService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateReaderDto>,
  ): Promise<Reader> {
    return this.readersService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.readersService.remove(id);
  }
}
