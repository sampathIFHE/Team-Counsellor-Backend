import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CounsellorService } from './counsellor.service';
import { CreateCounsellorDto } from './dto/create-counsellor.dto';
import { UpdateCounsellorDto } from './dto/update-counsellor.dto';

@Controller("counsellor")
export class CounsellorController {
  constructor(private readonly counsellorService: CounsellorService) {}

  @Post()
  create(@Body() createCounsellorDto: CreateCounsellorDto) {
    return this.counsellorService.create(createCounsellorDto);
  }

  @Get()
  findAll() {
    return this.counsellorService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.counsellorService.findOne(id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() updateCounsellorDto: UpdateCounsellorDto
  ) {
    return this.counsellorService.update(id, updateCounsellorDto);
  }

  @Delete('clear')
  clearAllCounsellors() {
    return this.counsellorService.clearAllCounsellors();
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.counsellorService.remove(id);
  }

  @Post("send")
  async sendMail(@Body() body: { email: string }) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await this.counsellorService.sendOtpEmail(body.email, otp);
    return { message: `OTP sent to ${body.email}` };
  }

  @Post("verify")
  async verifyOtp(@Body() body: { email: string; otp: string }) {
    const isValid = await this.counsellorService.verifyOtp(
      body.email,
      body.otp
    );
    return isValid;
  }

  @Post("updateSlotTimings/:id")
  updateSlotTimings(@Param("id") id: string, @Body() data: any) {
    return this.counsellorService.updateSlotTimings(id, data);
  }

  @Post("generate")
  async manualGenerateSlots() {
    const result: any = await this.counsellorService.autogenrateSlots();
  }
}
