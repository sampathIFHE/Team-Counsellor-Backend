import { BadRequestException, Injectable } from '@nestjs/common';
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
    private slotRepository: Repository<Slot>
  ) {
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
  }

  async create(createCounsellorDto: CreateCounsellorDto) {
    // Check if email already exists
    const existing = await this.counsellorRepository.findOneBy({
      email: createCounsellorDto.email,
      mobile: createCounsellorDto.mobile,
    });

    if (existing) {
      throw new BadRequestException(
        "Counsellor with email or mobile number already exists"
      );
    }

    const counsellor = this.counsellorRepository.create(createCounsellorDto);
    return await this.counsellorRepository.save(counsellor);
  }

  async findAll() {
    const counsellors = await this.counsellorRepository.find();
    return counsellors;
  }

  async sendOtpEmail(email: string, otp: string) {
    await this.transporter.sendMail({
      from: `"Safe Minds" <${process.env.MAIL_USER}>`,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP is ${otp}. It will expire in 5 minutes.`,
    });
    const admin: any = await this.counsellorRepository.findOne({
      where: { email },
    });
    admin.otp = otp;
    await this.counsellorRepository.save(admin);
    console.log(`OTP ${otp} sent to ${email}`);
  }

  async verifyOtp(email: string, otp: string) {
    const counsellor: any = await this.counsellorRepository.findOne({
      where: { email },
    });
    if (!counsellor) {
      return false;
    }
    if (counsellor.otp === otp) {
      counsellor.otp = null; // Clear OTP after successful verification
      await this.counsellorRepository.save(counsellor);
      return counsellor;
    } else {
      return { message: "Invalid OTP" };
    }
  }
  async updateSlotTimings(id: string, slotTimings: Record<string, string[]>) {
    const counsellor: any = await this.counsellorRepository.findOne({
      where: { id },
    });
    if (!counsellor) {
      throw new Error(`Counsellor with id ${id} not found`);
    }
    if (!counsellor.slotTimings) {
      const weekdays = [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ];

      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);

      const slotsToCreate: Slot[] = [];

      for (let i = 0; i < 7; i++) {
        tomorrow.setDate(now.getDate() + i);
        const presentSlots = await this.slotRepository.findBy({
          counsellorId: id,
          date: tomorrow.toISOString().split("T")[0],
        });
        const dayName = weekdays[tomorrow.getDay()];
        const daySlots = slotTimings[dayName];
        if (
          !daySlots ||
          dayName === "saturday" ||
          dayName === "sunday" ||
          presentSlots.length > 0
        ) {
          continue;
        }
        for (
          let i = 0;
          i < slotTimings[weekdays[tomorrow.getDay()]]?.length;
          i++
        ) {
          slotsToCreate.push(
            this.slotRepository.create({
              counsellorId: id,
              date: tomorrow.toISOString().split("T")[0],
              slotTime: slotTimings[weekdays[tomorrow.getDay()]][i],
              status: SlotStatus.AVAILABLE,
            })
          );
        }

        if (slotsToCreate.length>0) {
          await this.slotRepository.save(slotsToCreate);
        }
      }
      counsellor.slotTimings = slotTimings;
      this.counsellorRepository.save(counsellor);
      return { message: 'Slot timings created successfully', slots: slotsToCreate };
    }
    counsellor.slotTimings = slotTimings;
    this.counsellorRepository.save(counsellor);
   return { message: 'Slot timings updated successfully', counsellor: counsellor }
  }

  // async updateSlotTimings(
  //   id: string,
  //   slotTimings: Record<string, string[]>
  // ) {
  //   const counsellor: any = await this.findOne(id);
  //   if (!counsellor) {
  //     throw new Error(`Counsellor with id ${id} not found`);
  //   }
  //   const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  //   const todayStr = new Date().toISOString().split('T')[0];
  //   const presentSlots = await this.slotRepository.findBy({
  //     counsellor: { id },
  //   });
  //   console.log(presentSlots);
  //   const now = new Date();
  //   const plus60Mins = new Date(now.getTime() + 60 * 60000);

  //   // // Defensive logging (guard against undefined access)
  //   // try {
  //   //   const todayKey = weekdays[new Date().getDay()];
  //   //   const todayArr = slotTimings[todayKey] || [];
  //   //   const lastToday = todayArr.length ? todayArr[todayArr.length - 1] : 'none';
  //   //   console.log(todayKey, lastToday, todayStr);
  //   // } catch (err) {
  //   //   console.log('slotTimings logging error', err);
  //   // }

  //   // // Determine whether there is any future slot for today (beyond buffer). If none, we should create slots for the upcoming days.
  //   // const bufferMinutes = 60; // minimum time from now to allow slot creation
  //   // const hasFutureSlotToday = presentSlots.some(s => {
  //   //   if (!s.slotTime) return false;
  //   //   const [start] = s.slotTime.split(' - ');
  //   //   const [h, m] = start.split(':');
  //   //   const slotDt = new Date();
  //   //   slotDt.setHours(Number(h), Number(m), 0, 0);
  //   //   return slotDt.getTime() > now.getTime() + bufferMinutes * 60 * 1000;
  //   // });

  //   // // If there is no future slot today (either there are no slots or all are past), create slots for the coming days
  //   // if (!hasFutureSlotToday) {
  //   //   const slotsToCreate: Slot[] = [];
  //   //   // loop the next 7 days starting from tomorrow. We'll skip weekends.
  //   //   for (let i = 1; i <= 7; i++) {
  //   //     const date = new Date();
  //   //     date.setDate(date.getDate() + i);
  //   //     const dayName = weekdays[date.getDay()];

  //   //     if (dayName === 'saturday' || dayName === 'sunday') continue;

  //   //     if (slotTimings[dayName] && slotTimings[dayName].length > 0) {
  //   //       for (const timing of slotTimings[dayName]) {
  //   //         const [startTime] = timing.split(' - ');
  //   //         const [hourStr, minuteStr] = startTime.split(':');
  //   //         const slotDateTime = new Date(date);
  //   //         slotDateTime.setHours(Number(hourStr), Number(minuteStr), 0, 0);
  //   //         console.log('Slot DateTime:', slotDateTime);

  //   //         const dateStr = date.toISOString().split('T')[0];

  //   //         // check if slot already exists for this date/time in DB
  //   //         const slotExists = await this.slotRepository.findOneBy({
  //   //           counsellor: { id },
  //   //           date: dateStr,
  //   //           slotTime: timing,
  //   //         });
  //   //         if (slotExists) continue;

  //   //         const counsellorJson = { id: counsellor.id, name: counsellor.name };
  //   //         slotsToCreate.push(
  //   //           this.slotRepository.create({
  //   //             counsellor: counsellorJson,
  //   //             date: dateStr,
  //   //             slotTime: timing,
  //   //             status: SlotStatus.AVAILABLE,
  //   //           }),
  //   //         );
  //   //       }
  //   //     }
  //   //   }

  //   //   if (slotsToCreate.length) {
  //   //     await this.slotRepository.save(slotsToCreate);
  //   //   }
  //   // }

  //   // counsellor.slotTimings = slotTimings;
  //   // return this.counsellorRepository.save(counsellor);
  // }

  async findOne(id: string) {
    const counsellor = await this.counsellorRepository.findOne({
      where: { id },
    });
    return counsellor;
  }

  async update(id: string, updateCounsellorDto: UpdateCounsellorDto) {
    const counsellor = await this.counsellorRepository.preload({
      id: id,
      ...updateCounsellorDto,
    });
    if (!counsellor) {
      throw new Error(`Counsellor with id ${id} not found`);
    }
    return this.counsellorRepository.save(counsellor);
  }

  async remove(id: string) {
    const counsellor = await this.findOne(id);
    if (!counsellor) {
      throw new Error(`Counsellor with id ${id} not found`);
    }
    return this.counsellorRepository.remove(counsellor);
  }
}
