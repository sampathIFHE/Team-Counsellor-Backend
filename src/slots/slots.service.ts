import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateSlotDto } from './dto/create-slot.dto';
import { UpdateSlotDto } from './dto/update-slot.dto';
import { Slot, SlotStatus } from './entities/slot.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class SlotsService {
  constructor(
    @InjectRepository(Slot)
    private readonly slotRepository: Repository<Slot>,
  ) { }

  async create(createSlotDto: CreateSlotDto) {

  await this.findByCounsellor(createSlotDto.counsellor.id).then(existingSlots => {
      const isConflict = existingSlots.some(slot =>
        slot.date === createSlotDto.date && slot.slotTime === createSlotDto.slotTime
      );
      if (isConflict) {
        throw new BadRequestException('Slot already exists for the given date and time for this counsellor');
      }
    });
    const slot = this.slotRepository.create(createSlotDto);
    return await this.slotRepository.save(slot);
  }
async findByCounsellor(counsellorId: string) {
    console.log(await this.slotRepository.count())
 const slots = await this.slotRepository
    .createQueryBuilder('slot')
    .where(`slot.counsellor->>'id' = :counsellorId`, { counsellorId })
    .getMany();
  console.log(slots, slots.length)
    const now = new Date();
  
    const filteredSlots = slots.filter(slot => {
      const startTimeStr = slot.slotTime.split('-')[0].trim();
      const [hours, minutes] = startTimeStr.split(':').map(Number);
  
      const [year, month, day] = slot.date.split('-').map(Number);
      const slotDateTime = new Date();
      slotDateTime.setFullYear(year, month - 1, day);
      slotDateTime.setHours(hours);
      slotDateTime.setMinutes(minutes);
      slotDateTime.setSeconds(0);
      slotDateTime.setMilliseconds(0);
      return slotDateTime.getTime() > now.getTime();
    });
  
    console.log('✅ Filtered slots count:', filteredSlots.length);
    return filteredSlots;
  }

    async clearAllSlots() {
    await this.slotRepository.clear();
    return {message: 'All slots have been cleared successfully'};
  }

async blockTheSlot(id: string, reason: string) {
    const slot = await this.slotRepository.findOneBy({ id });
    
  if (!slot) {
    throw new NotFoundException('Slot with id ${id} not found');
  }

  if (slot.status !== 'available') {
    throw new BadRequestException('Only available slots can be blocked');
  }
    slot.status = SlotStatus.BLOCKED;
    slot.reason = reason;
     this.slotRepository.save(slot);
     return { message: 'Slot has been blocked successfully' };
  }

  async findAll() {
    const slots = await this.slotRepository.find();
    console.log(slots);
    return slots;
  }

  async findOne(id: string) {
  const slot = await this.slotRepository.findOne({
    where: { id },
  });
      console.log(slot);
    return slot?slot:{ message: 'Slot not found' };
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
    const slot = await this.slotRepository.findOne({
    where: { id },
  });
    if (!slot) {
      throw new Error(`Slot with id ${id} not found`);
    }
    await this.slotRepository.remove(slot);
    return { message: 'Slot has been removed successfully' };
  }
}
