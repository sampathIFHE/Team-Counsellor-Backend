import { Module } from '@nestjs/common';
import { CounsellorService } from './counsellor.service';
import { CounsellorController } from './counsellor.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Counsellor } from './entities/counsellor.entity';
import { Slot } from 'src/slots/entities/slot.entity';
import { SlotsModule } from 'src/slots/slots.module';

@Module({
  imports: [TypeOrmModule.forFeature([Counsellor, Slot]), SlotsModule],
  controllers: [CounsellorController],
  providers: [CounsellorService],
})
export class CounsellorModule {}
