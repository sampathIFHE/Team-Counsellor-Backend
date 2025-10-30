import { Injectable } from '@nestjs/common';
import { CreateSlotDto } from './dto/create-slot.dto';
import { UpdateSlotDto } from './dto/update-slot.dto';
import { Slot } from './entities/slot.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class SlotsService {
  constructor(
    @InjectRepository(Slot)
    private readonly slotRepository: Repository<Slot>,
  ) { }

  async create(createSlotDto: CreateSlotDto) {
    const slot = this.slotRepository.create(createSlotDto);
    return await this.slotRepository.save(slot);
  }

  async findAll() {
    const slots = await this.slotRepository.find();
    return slots;
  }

  async findOne(id: string) {
    const slot = await this.slotRepository.findOneBy({ id });
    return slot;
  }


  async update(id: string, updateSlotDto: UpdateSlotDto) {
    const slot = await this.slotRepository.preload({
      id: id,
      ...updateSlotDto,
    });
    if (!slot) {
      throw new Error(`Slot with id ${id} not found`);
    }
    return this.slotRepository.save(slot);
  }

  async remove(id: string) {
    const slot = await this.slotRepository.findOneBy({ id });
    if (!slot) {
      throw new Error(`Slot with id ${id} not found`);
    }
    await this.slotRepository.remove(slot);
  }
}
