import { Module } from '@nestjs/common';
import { StudentService } from './student.service';
import { StudentController } from './student.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Student } from './entities/student.entity';
import { Slot } from 'src/slots/entities/slot.entity';

@Module({
  imports:[TypeOrmModule.forFeature([Student,Slot]),],
  controllers: [StudentController],
  providers: [StudentService],
})
export class StudentModule {}
