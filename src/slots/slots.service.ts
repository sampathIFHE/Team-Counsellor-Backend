import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateSlotDto } from './dto/create-slot.dto';
import { UpdateSlotDto } from './dto/update-slot.dto';
import { Slot, SlotStatus } from './entities/slot.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Counsellor } from 'src/counsellor/entities/counsellor.entity';
import { Student } from 'src/student/entities/student.entity';
import * as nodemailer from 'nodemailer';


@Injectable()
export class SlotsService {
  private transporter;

  constructor(
    @InjectRepository(Slot)
    private readonly slotRepository: Repository<Slot>,

    @InjectRepository(Counsellor)
    private readonly counsellorRepository: Repository<Counsellor>,

    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>
  ) {
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  async create(createSlotDto: CreateSlotDto) {
    await this.findByCounsellor(createSlotDto.counsellorId).then(
      (existingSlots) => {
        const isConflict = existingSlots.some(
          (slot) =>
            slot.date === createSlotDto.date &&
            slot.slotTime === createSlotDto.slotTime
        );
        if (isConflict) {
          throw new BadRequestException(
            "Slot already exists for the given date and time for this counsellor"
          );
        }
      }
    );
    const slot = this.slotRepository.create(createSlotDto);
    return await this.slotRepository.save(slot);
  }
  async findByCounsellor(counsellorId: string) {
    //  const slots = await this.slotRepository
    //     .createQueryBuilder('slot')
    //     .where(`slot.counsellor->>'id' = :counsellorId`, { counsellorId })
    //     .getMany();

    const slots = await this.slotRepository.find({
      where: { counsellorId },
    });
    const now = new Date();

    const filteredSlots = slots.filter((slot) => {
      const startTimeStr = slot.slotTime.split("-")[0].trim();
      const [hours, minutes] = startTimeStr.split(":").map(Number);

      const [year, month, day] = slot.date.split("-").map(Number);
      const slotDateTime = new Date();
      slotDateTime.setFullYear(year, month - 1, day);
      slotDateTime.setHours(hours);
      slotDateTime.setMinutes(minutes);
      slotDateTime.setSeconds(0);
      slotDateTime.setMilliseconds(0);
      return slotDateTime.getTime() > now.getTime();
    });

    return filteredSlots;
  }

  async clearAllSlots() {
    await this.slotRepository.clear();
    return { message: "All slots have been cleared successfully" };
  }

  async blockTheSlot(id: string, reason: string) {
    const slot: any = await this.slotRepository.findOneBy({ id });

    if (!slot) {
      throw new NotFoundException("Slot with id ${id} not found");
    }
    const counsellor: any = await this.counsellorRepository.findOneBy({
      id: slot.counsellorId,
    });
    if (slot.status !== "available") {
      const student: any = await this.studentRepository.findOneBy({
        id: slot.studentId,
      });
      // throw new BadRequestException('Only available slots can be blocked');
      await this.transporter.sendMail({
        from: `"Safe Minds" <${process.env.MAIL_USER}>`,
        to: student.email,
        subject: `Session Cancelled by ${counsellor.name}`,
        text: `Important: Your session with ${counsellor.name} on ${slot.date} at ${slot.slotTime} has been cancelled by the counsellor. We apologize for any inconvenience. Please book a new session at your convenience.`,
        html: `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px 20px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 600;">Session Cancelled</h1>
        <p style="margin: 8px 0 0; opacity: 0.9; font-size: 16px;">Important update about your booking</p>
      </div>

      <!-- Main Content -->
      <div style="padding: 35px 30px;">
        <!-- Cancellation Card -->
        <div style="background: #fef2f2; border-radius: 12px; padding: 25px; margin-bottom: 25px; border-left: 4px solid #ef4444;">
          <h3 style="margin: 0 0 20px 0; color: #1e293b; font-size: 18px;">❌ Session Cancelled by Counsellor</h3>
          
          <div style="display: grid; gap: 15px;">
            <!-- Counsellor -->
            <div style="display: flex; align-items: center;">
              <div style="background: #fee2e2; padding: 8px; border-radius: 8px; margin-right: 15px;">
                <span style="color: #dc2626;">👨‍⚕️</span>
              </div>
              <div>
                <div style="color: #64748b; font-size: 14px; font-weight: 500;">COUNSELLOR</div>
                <div style="color: #1e293b; font-size: 16px; font-weight: 600;">${counsellor.name}</div>
              </div>
            </div>

            <!-- Date & Time -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <!-- Date -->
              <div style="display: flex; align-items: center;">
                <div style="background: #fecaca; padding: 8px; border-radius: 8px; margin-right: 15px;">
                  <span style="color: #dc2626;">📅</span>
                </div>
                <div>
                  <div style="color: #64748b; font-size: 14px; font-weight: 500;">DATE</div>
                  <div style="color: #1e293b; font-size: 15px; font-weight: 500;">${slot.date}</div>
                </div>
              </div>

              <!-- Time -->
              <div style="display: flex; align-items: center;">
                <div style="background: #fecaca; padding: 8px; border-radius: 8px; margin-right: 15px;">
                  <span style="color: #dc2626;">⏰</span>
                </div>
                <div>
                  <div style="color: #64748b; font-size: 14px; font-weight: 500;">TIME</div>
                  <div style="color: #1e293b; font-size: 15px; font-weight: 500;">${slot.slotTime}</div>
                </div>
              </div>
            </div>

            <!-- Student -->
            <div style="display: flex; align-items: center;">
              <div style="background: #fee2e2; padding: 8px; border-radius: 8px; margin-right: 15px;">
                <span style="color: #dc2626;">🎓</span>
              </div>
              <div>
                <div style="color: #64748b; font-size: 14px; font-weight: 500;">STUDENT</div>
                <div style="color: #1e293b; font-size: 15px; font-weight: 500;">${student.name}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Next Steps Box -->
        <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 20px;">
          <h4 style="margin: 0 0 12px 0; color: #0369a1; font-size: 16px;">🔄 What to Do Next</h4>
          <ul style="margin: 0; color: #0369a1; padding-left: 20px;">
            <li>Book a new session with any available counsellor</li>
            <li>Contact support if you need assistance</li>
            <li>We apologize for any inconvenience caused</li>
          </ul>
        </div>

        <!-- Support Box -->
        <div style="background: #ecfdf5; border-radius: 8px; padding: 20px; text-align: center; margin-top: 20px;">
          <p style="margin: 0; color: #065f46; font-size: 15px;">
            💚 <strong>Your well-being is important to us.</strong> We're here to help you find another suitable session.
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div style="background: #f1f5f9; padding: 25px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0 0 10px 0; color: #475569; font-size: 15px;">
          We're committed to supporting your mental health journey
        </p>
        <p style="margin: 0; color: #64748b; font-size: 14px;">
          With care,<br>
          <strong style="color: #ef4444;">The Safe Minds Team</strong>
        </p>
      </div>
    </div>
  `,
      });

      await this.transporter.sendMail({
        from: `"Safe Minds" <${process.env.MAIL_USER}>`,
        to: counsellor.email,
        subject: `Session Cancelled: ${student.name} - ${slot.date}`,
        text: `Session Cancellation Notice\n\nStudent: ${student.name}\nDate: ${slot.date}\nTime: ${slot.slotTime}\nStatus: Cancelled by Student\n\nThe session scheduled with ${student.name} has been cancelled. This slot is now available for other bookings.`,
        html: `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px 20px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 600;">Session Cancelled</h1>
        <p style="margin: 8px 0 0; opacity: 0.9; font-size: 16px;">Student cancellation notification</p>
      </div>

      <!-- Main Content -->
      <div style="padding: 35px 30px;">
        <!-- Cancellation Card -->
        <div style="background: #fffbeb; border-radius: 12px; padding: 25px; margin-bottom: 25px; border-left: 4px solid #f59e0b;">
          <h3 style="margin: 0 0 20px 0; color: #1e293b; font-size: 18px;">⚠️ Student Cancellation</h3>
          
          <div style="display: grid; gap: 15px;">
            <!-- Student -->
            <div style="display: flex; align-items: center;">
              <div style="background: #fef3c7; padding: 8px; border-radius: 8px; margin-right: 15px;">
                <span style="color: #d97706;">👤</span>
              </div>
              <div>
                <div style="color: #64748b; font-size: 14px; font-weight: 500;">STUDENT</div>
                <div style="color: #1e293b; font-size: 16px; font-weight: 600;">${student.name}</div>
              </div>
            </div>

            <!-- Date & Time -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <!-- Date -->
              <div style="display: flex; align-items: center;">
                <div style="background: #fef3c7; padding: 8px; border-radius: 8px; margin-right: 15px;">
                  <span style="color: #d97706;">📅</span>
                </div>
                <div>
                  <div style="color: #64748b; font-size: 14px; font-weight: 500;">DATE</div>
                  <div style="color: #1e293b; font-size: 15px; font-weight: 500;">${slot.date}</div>
                </div>
              </div>

              <!-- Time -->
              <div style="display: flex; align-items: center;">
                <div style="background: #fef3c7; padding: 8px; border-radius: 8px; margin-right: 15px;">
                  <span style="color: #d97706;">⏰</span>
                </div>
                <div>
                  <div style="color: #64748b; font-size: 14px; font-weight: 500;">TIME</div>
                  <div style="color: #1e293b; font-size: 15px; font-weight: 500;">${slot.slotTime}</div>
                </div>
              </div>
            </div>

            <!-- Counsellor -->
            <div style="display: flex; align-items: center;">
              <div style="background: #fef3c7; padding: 8px; border-radius: 8px; margin-right: 15px;">
                <span style="color: #d97706;">💼</span>
              </div>
              <div>
                <div style="color: #64748b; font-size: 14px; font-weight: 500;">COUNSELLOR</div>
                <div style="color: #1e293b; font-size: 15px; font-weight: 500;">${counsellor.name}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Status Update -->
        <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 20px;">
          <h4 style="margin: 0 0 12px 0; color: #0369a1; font-size: 16px;">📊 Status Update</h4>
          <ul style="margin: 0; color: #0369a1; padding-left: 20px;">
            <li>This time slot is now available for other bookings</li>
            <li>Your schedule has been updated automatically</li>
            <li>No action required from your side</li>
          </ul>
        </div>

        <!-- Availability Reminder -->
        <div style="background: #ecfdf5; border-radius: 8px; padding: 20px; text-align: center; margin-top: 20px;">
          <p style="margin: 0; color: #065f46; font-size: 15px;">
            📅 <strong>Your availability helps students get the support they need.</strong> Thank you for your commitment!
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div style="background: #f1f5f9; padding: 25px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0 0 10px 0; color: #475569; font-size: 15px;">
          Making mental health support accessible to all
        </p>
        <p style="margin: 0; color: #64748b; font-size: 14px;">
          With appreciation,<br>
          <strong style="color: #f59e0b;">The Safe Minds Team</strong>
        </p>
      </div>
    </div>
  `,
      });

      slot.status = SlotStatus.CANCELLED;
      slot.reason = reason;
      this.slotRepository.save(slot);
      return { message: "Slot has been Cancelled successfully" };
    }
    await this.transporter.sendMail({
      from: `"Safe Minds" <${process.env.MAIL_USER}>`,
      to: counsellor.email,
      subject: `Slot Blocked: ${slot.date} at ${slot.slotTime}`,
      text: `Slot Blocking Confirmation\n\nDate: ${slot.date}\nTime: ${slot.slotTime}\nStatus: Successfully Blocked\n\nThis time slot has been blocked and will not be available for student bookings.`,
      html: `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 30px 20px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 600;">Slot Blocked Successfully</h1>
        <p style="margin: 8px 0 0; opacity: 0.9; font-size: 16px;">Your availability has been updated</p>
      </div>

      <!-- Main Content -->
      <div style="padding: 35px 30px;">
        <!-- Blocking Confirmation Card -->
        <div style="background: #faf5ff; border-radius: 12px; padding: 25px; margin-bottom: 25px; border-left: 4px solid #8b5cf6;">
          <h3 style="margin: 0 0 20px 0; color: #1e293b; font-size: 18px;">🔒 Slot Blocking Confirmed</h3>
          
          <div style="display: grid; gap: 15px;">
            <!-- Date & Time -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <!-- Date -->
              <div style="display: flex; align-items: center;">
                <div style="background: #ede9fe; padding: 8px; border-radius: 8px; margin-right: 15px;">
                  <span style="color: #7c3aed;">📅</span>
                </div>
                <div>
                  <div style="color: #64748b; font-size: 14px; font-weight: 500;">DATE</div>
                  <div style="color: #1e293b; font-size: 15px; font-weight: 500;">${slot.date}</div>
                </div>
              </div>

              <!-- Time -->
              <div style="display: flex; align-items: center;">
                <div style="background: #ede9fe; padding: 8px; border-radius: 8px; margin-right: 15px;">
                  <span style="color: #7c3aed;">⏰</span>
                </div>
                <div>
                  <div style="color: #64748b; font-size: 14px; font-weight: 500;">TIME</div>
                  <div style="color: #1e293b; font-size: 15px; font-weight: 500;">${slot.slotTime}</div>
                </div>
              </div>
            </div>

            <!-- Counsellor -->
            <div style="display: flex; align-items: center;">
              <div style="background: #ede9fe; padding: 8px; border-radius: 8px; margin-right: 15px;">
                <span style="color: #7c3aed;">💼</span>
              </div>
              <div>
                <div style="color: #64748b; font-size: 14px; font-weight: 500;">COUNSELLOR</div>
                <div style="color: #1e293b; font-size: 15px; font-weight: 500;">${counsellor.name}</div>
              </div>
            </div>

            <!-- Status -->
            <div style="display: flex; align-items: center;">
              <div style="background: #ede9fe; padding: 8px; border-radius: 8px; margin-right: 15px;">
                <span style="color: #7c3aed;">🔒</span>
              </div>
              <div>
                <div style="color: #64748b; font-size: 14px; font-weight: 500;">STATUS</div>
                <div style="color: #7c3aed; font-size: 15px; font-weight: 600;">BLOCKED</div>
              </div>
            </div>
          </div>
        </div>

        <!-- What This Means -->
        <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 20px;">
          <h4 style="margin: 0 0 12px 0; color: #0369a1; font-size: 16px;">ℹ️ What Does Blocking Mean?</h4>
          <ul style="margin: 0; color: #0369a1; padding-left: 20px;">
            <li>This slot is now unavailable for student bookings</li>
            <li>Students cannot see or book this time slot</li>
            <li>You can unblock it anytime to make it available again</li>
            <li>Perfect for personal time, meetings, or breaks</li>
          </ul>
        </div>

        <!-- Next Steps -->
        <div style="background: #ecfdf5; border-radius: 8px; padding: 20px; text-align: center; margin-top: 20px;">
          <p style="margin: 0; color: #065f46; font-size: 15px;">
            ✅ <strong>Blocking successful!</strong> Your schedule has been updated. You can manage your availability in your dashboard.
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div style="background: #f1f5f9; padding: 25px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0 0 10px 0; color: #475569; font-size: 15px;">
          Taking control of your schedule helps maintain work-life balance
        </p>
        <p style="margin: 0; color: #64748b; font-size: 14px;">
          Best regards,<br>
          <strong style="color: #8b5cf6;">The Safe Minds Team</strong>
        </p>
      </div>
    </div>
  `,
    });
    slot.status = SlotStatus.BLOCKED;
    slot.reason = reason;
    this.slotRepository.save(slot);
    return { message: "Slot has been Blocked successfully" };
  }

  async findAll() {
    const slots = await this.slotRepository.find();
    return slots;
  }

  async findOne(id: string) {
    const slot = await this.slotRepository.findOne({
      where: { id },
    });
    return slot ? slot : { message: "Slot not found" };
  }

  async update(id: string, updateSlotDto: UpdateSlotDto) {
    const slot = await this.slotRepository.preload({
      id: id,
      ...updateSlotDto,
    });
    if (!slot) {
      throw new Error(`Slot with id ${id} not found`);
    }
    return this.slotRepository.save(slot);
  }

  async remove(id: string) {
    const slot = await this.slotRepository.findOne({
      where: { id },
    });
    if (!slot) {
      throw new Error(`Slot with id ${id} not found`);
    }
    await this.slotRepository.remove(slot);
    return { message: "Slot has been removed successfully" };
  }
}
