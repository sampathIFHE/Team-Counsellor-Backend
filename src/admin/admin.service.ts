import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { Admin } from './entities/admin.entity';
import { Repository } from 'typeorm';
import * as nodemailer from 'nodemailer';
import { Counsellor } from 'src/counsellor/entities/counsellor.entity';


@Injectable()
export class AdminService {
  private transporter;

  constructor(
    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>,
    @InjectRepository(Counsellor)
    private counsellorRepository: Repository<Counsellor>,
  ) {
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
  tls: {
      rejectUnauthorized: false  
    }
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
    let mail:any
    const admin: any = await this.adminRepository.findOne({ where: [{ email }, {employeeId:email} ]});
   if(!admin){
    const counsellor:any = await this.counsellorRepository.findOne({ where: [{ email }, {employeeId:email} ]});
    if(counsellor){
      counsellor.otp = otp;
      await this.counsellorRepository.save(counsellor);
      mail = counsellor.email;
    }
   }else{
    mail = admin.email;
    admin.otp = otp;
    await this.adminRepository.save(admin);
   }
   if(mail){
    await this.transporter.sendMail({
      from: `"Safe Minds" <${process.env.MAIL_USER}>`,
      to: mail,
      subject: "Your OTP Code",
      text: `Your OTP is ${otp}. It will expire in 5 minutes.`,
    });
    
   }else{
    throw new NotFoundException(`No user found with email or employeeId ${email}`);
   }

  }

  async verifyOtp(email: string, otp: string) {
    const admin: any = await this.adminRepository.findOne({ where: [{ email },{employeeId:email}] });
    if (!admin) {
    const counsellor:any = await this.counsellorRepository.findOne({ where: [{ email }, {employeeId:email} ]});
    if(counsellor){
      if(counsellor.otp === otp){
        counsellor.otp = null;
        await this.counsellorRepository.save(counsellor);
        return counsellor;
      }else{
        return { message: "Invalid OTP" };
      }
    }else{
      throw new NotFoundException(`No user found with email or employeeId ${email}`);
    }
    }else{
    if (admin.otp === otp) {
      admin.otp = null;
      await this.adminRepository.save(admin);
      return admin;
    } else {
      return { message: "Invalid OTP" };
    }
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
