import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';


@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post()
  create(@Body() createAdminDto: CreateAdminDto) {
    return this.adminService.create(createAdminDto);
  }

  @Get()
  findAll() {
    return this.adminService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.adminService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAdminDto: UpdateAdminDto) {
    return this.adminService.update(id, updateAdminDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.adminService.remove(id);
  }

  @Post('send')
  async sendMail(@Body() body: { email: string }) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await this.adminService.sendOtpEmail(body.email, otp);
    return { message: `OTP sent to ${body.email}` };
  }

  @Post('verify')
  async verifyOtp(@Body() body: { email: string; otp: string }) {
    const isValid = await this.adminService.verifyOtp(body.email, body.otp);
    return isValid;
  } 
}
