import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { StudentService } from './student.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

@Controller('student')
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Post()
  create(@Body() createStudentDto: CreateStudentDto) {
    return this.studentService.create(createStudentDto);
  }

  @Get()
  findAll() {
    return this.studentService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.studentService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateStudentDto: UpdateStudentDto) {
    return this.studentService.update(id, updateStudentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.studentService.remove(id);
  }

  @Post('send-otp')
  async sendOtp(@Body() body: { email: string }) {
     const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await this.studentService.sendOTPEmail(body.email, otp);
    return { message: `OTP sent to ${body.email}` };
  }

  @Post('verify-otp')
  async verifyOtp(@Body() body: { email: string; otp: string }) {
    const isValid = await this.studentService.verifyOTP(body.email, body.otp);
    return isValid;
  }

  @Post('book-slot')
  async bookSlot(@Body() body: { studentId: string; slotId: string }) {
    const slot = await this.studentService.slotbooking(body.studentId, body.slotId);
    return slot;
  }
}
