import { Module } from '@nestjs/common';
import { StudentService } from './student.service';
import { StudentController } from './student.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Student } from './entities/student.entity';
import { Slot } from 'src/slots/entities/slot.entity';
import { Counsellor } from 'src/counsellor/entities/counsellor.entity';

@Module({
  imports:[TypeOrmModule.forFeature([Student,Slot,Counsellor]),],
  controllers: [StudentController],
  providers: [StudentService],
})
export class StudentModule {}
