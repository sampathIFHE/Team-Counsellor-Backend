import { Injectable } from '@nestjs/common';
import { CreateCounsellorDto } from './dto/create-counsellor.dto';
import { UpdateCounsellorDto } from './dto/update-counsellor.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Counsellor } from './entities/counsellor.entity';
import { Repository } from 'typeorm';
import * as nodemailer from 'nodemailer';
import { Slot } from 'src/slots/entities/slot.entity';
import { SlotStatus } from 'src/slots/entities/slot.entity'; 



@Injectable()
export class CounsellorService {
  private transporter;

  constructor(
    @InjectRepository(Counsellor) 
    private counsellorRepository: Repository<Counsellor>,
    @InjectRepository(Slot)
    private slotRepository: Repository<Slot>,
  ) {
        this.transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS,
          },
        });
  }

  async create(createCounsellorDto: CreateCounsellorDto) {
    const counsellor =  this.counsellorRepository.create(createCounsellorDto);
    return await this.counsellorRepository.save(counsellor);
  }

  async findAll() {
    const counsellors = await this.counsellorRepository.find();
    return counsellors;
  }

  async sendOtpEmail(email: string, otp: string) {
    await this.transporter.sendMail({
      from: `"Counsellor App" <${process.env.MAIL_USER}>`,
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP is ${otp}. It will expire in 5 minutes.`,
    });
    const admin:any =  await this.counsellorRepository.findOne({where: {email}});
     admin.otp = otp;
    await this.counsellorRepository.save(admin);
    console.log(`OTP ${otp} sent to ${email}`); 
  }


async updateSlotTimings(
  id: string,
  slotTimings: Record<string, string[]>
) {
  const counsellor: any = await this.findOne(id);
  if (!counsellor) {
    throw new Error(`Counsellor with id ${id} not found`);
  }

  // Check if slots already exist for today
  const todayStr = new Date().toISOString().split('T')[0];
  const presentSlots = await this.slotRepository.findBy({
    counsellor: { id },
    date: todayStr,
  });

  if (presentSlots.length === 0) {
    const slotsToCreate: Slot[] = [];
    const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const now = new Date();
    const bufferMinutes = 60; // minimum time from now to allow slot creation


    for (let i = 0; i < 14; i++) { // next 2 weeks
      const date = new Date();
      date.setDate(date.getDate() + i);
      const dayName = weekdays[date.getDay()];

      // Skip weekends
      if (dayName === "saturday" || dayName === "sunday") continue;

      // Create slots only if counsellor has timings for this day
      if (slotTimings[dayName] && slotTimings[dayName].length > 0) {
        for (const timing of slotTimings[dayName]) {

             const [hourStr, minuteStr] = timing.split(':');
      const slotDateTime = new Date(date);
      slotDateTime.setHours(Number(hourStr), Number(minuteStr), 0, 0);

      // Only for today, skip past slots
      if (date.toDateString() === now.toDateString() && 
      slotDateTime.getTime() <= now.getTime() + bufferMinutes * 60 * 1000) {
        continue;
      }

          slotsToCreate.push(
            this.slotRepository.create({
              counsellor: { id: counsellor.id, name: counsellor.name },
              date: date.toISOString().split('T')[0],
              slotTime: timing,
              status: SlotStatus.AVAILABLE,
            })
          );
        }
      }
    }

    // Bulk save
    await this.slotRepository.save(slotsToCreate);
  }

  // Update counsellor's slotTimings JSON
  counsellor.slotTimings = slotTimings;
  return this.counsellorRepository.save(counsellor);
}


 async findOne(id: string) {
  const counsellor = await this.counsellorRepository.findOne({where: {id}});
  return counsellor;
  }

 async  update(id: string, updateCounsellorDto: UpdateCounsellorDto) {
  const counsellor = await this.counsellorRepository.preload({
    id: id,
    ...updateCounsellorDto,
  });
  if(!counsellor){
    throw new Error(`Counsellor with id ${id} not found`);
  }
  return this.counsellorRepository.save(counsellor);
  }

  async remove(id: string) {
    const counsellor = await this.findOne(id);
    if(!counsellor){
      throw new Error(`Counsellor with id ${id} not found`);
    }
    return this.counsellorRepository.remove(counsellor);
  }
}
