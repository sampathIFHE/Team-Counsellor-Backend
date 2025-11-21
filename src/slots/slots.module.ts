import { Module } from '@nestjs/common';
import { SlotsService } from './slots.service';
import { SlotsController } from './slots.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Slot } from './entities/slot.entity';
import { Counsellor } from 'src/counsellor/entities/counsellor.entity';
import { Student } from 'src/student/entities/student.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Slot, Counsellor, Student])],
  controllers: [SlotsController],
  providers: [SlotsService],
})
export class SlotsModule {}
