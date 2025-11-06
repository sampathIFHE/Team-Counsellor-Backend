import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { Admin } from './entities/admin.entity';
import { Repository } from 'typeorm';
import * as nodemailer from 'nodemailer';


@Injectable()
export class AdminService {
  private transporter;

  constructor(
    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>
  ) {
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
  }
  async create(createAdminDto: CreateAdminDto) {
    const existingAdmin = await this.adminRepository.findOne({
      where: { email: createAdminDto.email, mobile: createAdminDto.mobile },
    });
    if (existingAdmin) {
      throw new NotFoundException(
        `Admin with email or mobile no already exists`
      );
    }
    const admin = this.adminRepository.create(createAdminDto);
    return await this.adminRepository.save(admin);
  }

  async findAll() {
    const admins = await this.adminRepository.find();
    return admins;
  }

  async sendOtpEmail(email: string, otp: string) {
    await this.transporter.sendMail({
      from: `"Counsellor App" <${process.env.MAIL_USER}>`,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP is ${otp}. It will expire in 5 minutes.`,
    });
    const admin: any = await this.adminRepository.findOne({ where: { email } });
    admin.otp = otp;
    await this.adminRepository.save(admin);
    console.log(`OTP ${otp} sent to ${email}`);
  }

  async verifyOtp(email: string, otp: string) {
    const admin: any = await this.adminRepository.findOne({ where: { email } });
    if (!admin) {
      throw new NotFoundException(`Admin with email ${email} not found`);
    }
    if (admin.otp === otp) {
      admin.otp = null;
      await this.adminRepository.save(admin);
      return admin;
    } else {
      return { message: "Invalid OTP" };
    }
  }

  async findOne(id: string) {
    const admin = await this.adminRepository.findOneBy({ id });
    if (!admin) {
      throw new NotFoundException(`Admin with ID ${id} not found`);
    }
    return admin;
  }

  async update(id: string, updateAdminDto: UpdateAdminDto) {
    const admin = await this.adminRepository.preload({
      id,
      ...updateAdminDto,
    });

    if (!admin) {
      throw new NotFoundException(`Admin with ID ${id} not found`);
    }

    return this.adminRepository.save(admin);
  }

  async remove(id: string) {
    const admin = await this.findOne(id);
    if (!admin) {
      throw new NotFoundException(`Admin with ID ${id} not found`);
    }
    return this.adminRepository.remove(admin);
  }
}
