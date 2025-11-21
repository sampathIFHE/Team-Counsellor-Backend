import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CreateStudentDto } from "./dto/create-student.dto";
import { UpdateStudentDto } from "./dto/update-student.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { Student } from "./entities/student.entity";
import { Repository } from "typeorm";
import * as nodemailer from 'nodemailer';
import { Slot , SlotStatus} from "src/slots/entities/slot.entity";
import { Counsellor } from "src/counsellor/entities/counsellor.entity";


@Injectable()
export class StudentService {
    private transporter;

  constructor(
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,

    @InjectRepository(Slot)
    private slotRepository: Repository<Slot>,

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

  async create(createStudentDto: CreateStudentDto) {
    const existing = await this.studentRepository.findOneBy({
      email: createStudentDto.email,
      mobile: createStudentDto.mobile,
      enrollmentId: createStudentDto.enrollmentId,
    });

    if (existing) {
      throw new HttpException(
        "Student with email, mobile number or enrollment ID already exists",
        HttpStatus.CONFLICT
      );
    }

    const student = this.studentRepository.create(createStudentDto);
    return await this.studentRepository.save(student);
  }

  async clearAllStudents() {
    await this.studentRepository.clear();
    return {message: 'All students have been cleared successfully'};
  }

async sendOTPEmail(email: string, otp: string) {
let student:any = await this.studentRepository.findOne({where: [{email},{enrollmentId:email}]});
if(!student){
const newStudent =  await this.studentRepository.create({email});
await this.studentRepository.save(newStudent);
student = newStudent;
}
student.otp = otp;
await this.studentRepository.save(student);
    // await this.transporter.sendMail({
    //   from: `"Safe Minds" <${process.env.MAIL_USER}>`,
    //   to: stundent.email,
    //   subject: "Your OTP Code",
    //   text: `Your OTP is ${otp}. It will expire in 5 minutes.`,
    // });

     try {
    // Verify connection first
    await this.transporter.verify();

    const mailOptions = {
      from: `"Safe Minds" <${process.env.MAIL_USER}>`,
      to: student.email,
      subject: "Your OTP Code",
      text: `Your OTP is ${otp}. It will expire in 5 minutes.`,
      html: `<p>Your OTP is <strong>${otp}</strong>. It will expire in 5 minutes.</p>`,
    };

    // Send email with retry logic
    await this.sendEmailWithRetry(mailOptions, 3);
    
  } catch (error) {
    console.error('Email sending failed:', error);
    throw new Error('Failed to send OTP email');
  }
  return { message: `OTP sent to ${student.email}`, studentId: student.id  };
}

private async sendEmailWithRetry(mailOptions: any, retries: number): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      await this.transporter.sendMail(mailOptions);
      return; // Success, exit function
    } catch (error) {
      console.warn(`Email send attempt ${i + 1} failed:`, error.message);
      
      if (i === retries - 1) {
        throw error; // Last attempt failed
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
}

async verifyOTP(email: string, otp: string) {
  const student:any  =  await this.studentRepository.findOne({where: {email}});
  if (!student) {
    throw new NotFoundException("Student not found");
  }
  if (student.otp !== otp) {
    throw new HttpException("Invalid OTP", HttpStatus.BAD_REQUEST);
  }
  student.otp = null;
  await this.studentRepository.save(student);
  return student;
  
}

async slotbooking(studentId: string,slotId : string) {
  const student = await this.studentRepository.findOneBy({ id: studentId });
  if (!student) {
    throw new NotFoundException("Student not found");
  }

   const slot  =  await this.slotRepository.findOneBy({ id: slotId });
  if (!slot) {
    throw new NotFoundException("Slot not found");
  }

  if(slot.status !== 'available'){
    throw new HttpException("Slot not available", HttpStatus.BAD_REQUEST);
  }
  slot.status = SlotStatus.BOOKED;
  slot.userId = student.id;
  await this.slotRepository.save(slot);

  const counsellor:any = await this.counsellorRepository.findOneBy({id: slot.counsellorId});
await this.transporter.sendMail({
  from: `"Safe Minds" <${process.env.MAIL_USER}>`,
  to: counsellor.email,
  subject: `Your Calendar Just Got Busy!`,
  text: `Session Details:\n\nStudent: ${student.name}\nDate: ${slot.date}\nTime: ${slot.slotTime}\nCounsellor: ${counsellor.name}\n\nPlease be prepared for the session.`,
  html: `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 600;">Session Confirmed ✅</h1>
        <p style="margin: 8px 0 0; opacity: 0.9; font-size: 16px;">Your expertise is needed</p>
      </div>

      <!-- Main Content -->
      <div style="padding: 35px 30px;">
        <!-- Session Card -->
        <div style="background: #f8fafc; border-radius: 12px; padding: 25px; margin-bottom: 25px; border-left: 4px solid #667eea;">
          <h3 style="margin: 0 0 20px 0; color: #1e293b; font-size: 18px;">📋 Session Details</h3>
          
          <div style="display: grid; gap: 15px;">
            <!-- Student -->
            <div style="display: flex; align-items: center;">
              <div style="background: #e0e7ff; padding: 8px; border-radius: 8px; margin-right: 15px;">
                <span style="color: #4f46e5;">👤</span>
              </div>
              <div style="margin: 0 0 5px 0;">
                <div style="color: #64748b; font-size: 14px; font-weight: 500;">STUDENT</div>
                <div style="color: #1e293b; font-size: 16px; font-weight: 600;">${student.name}</div>
              </div>
            </div>

            <!-- Date & Time -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <!-- Date -->
              <div style="display: flex; align-items: center; margin: 0 0 5px 0;">
                <div style="background: #dcfce7; padding: 8px; border-radius: 8px; margin-right: 15px;">
                  <span style="color: #16a34a;">📅</span>
                </div>
                <div>
                  <div style="color: #64748b; font-size: 14px; font-weight: 500;">DATE</div>
                  <div style="color: #1e293b; font-size: 15px; font-weight: 500;">${slot.date}</div>
                </div>
              </div>

              <!-- Time -->
              <div style="display: flex; align-items: center; margin: 0 0 5px 0;">
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
            <div style="display: flex; align-items: center; ">
              <div style="background: #fce7f3; padding: 8px; border-radius: 8px; margin-right: 15px;">
                <span style="color: #db2777;">💼</span>
              </div>
              <div>
                <div style="color: #64748b; font-size: 14px; font-weight: 500;">COUNSELLOR</div>
                <div style="color: #1e293b; font-size: 15px; font-weight: 500;">${counsellor.name}</div>
              </div>
            </div>
          </div>
        </div>
  `,
});
await this.transporter.sendMail({
  from: `"Safe Minds" <${process.env.MAIL_USER}>`,
  to: student.email,
  subject: `Session Confirmed with ${counsellor.name} on ${slot.date}`,
  text: `Session Details:\n\nCounsellor: ${counsellor.name}\nDate: ${slot.date}\nTime: ${slot.slotTime}\nStudent: ${student.name}\n\nWe're looking forward to supporting you!`,
  html: `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px 20px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 600;">Session Confirmed ✅</h1>
        <p style="margin: 8px 0 0; opacity: 0.9; font-size: 16px;">Your wellness journey continues</p>
      </div>

      <!-- Main Content -->
      <div style="padding: 35px 30px;">
        <!-- Session Card -->
        <div style="background: #f0fdf4; border-radius: 12px; padding: 25px; margin-bottom: 25px; border-left: 4px solid #10b981;">
          <h3 style="margin: 0 0 20px 0; color: #1e293b; font-size: 18px;">📋 Your Session Details</h3>
          
          <div style="display: grid; gap: 15px;">
            <!-- Counsellor -->
            <div style="display: flex; align-items: center;margin: 0 0 5px 0">
              <div style="background: #dcfce7; padding: 8px; border-radius: 8px; margin-right: 15px;">
                <span style="color: #16a34a;">👨‍⚕️</span>
              </div>
              <div style="margin: 0 0 5px 0;">
                <div style="color: #64748b; font-size: 14px; font-weight: 500;">COUNSELLOR</div>
                <div style="color: #1e293b; font-size: 16px; font-weight: 600;">${counsellor.name}</div>
              </div>
            </div>

            <!-- Date & Time -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <!-- Date -->
              <div style="display: flex; align-items: center;">
                <div style="background: #dbeafe; padding: 8px; border-radius: 8px; margin-right: 15px;">
                  <span style="color: #2563eb;">📅</span>
                </div>
                <div style="margin: 0 0 5px 0;">
                  <div style="color: #64748b; font-size: 14px; font-weight: 500;">DATE</div>
                  <div style="color: #1e293b; font-size: 15px; font-weight: 500;">${slot.date}</div>
                </div>
              </div>

              <!-- Time -->
              <div style="display: flex; align-items: center;">
                <div style="background: #fef3c7; padding: 8px; border-radius: 8px; margin-right: 15px;">
                  <span style="color: #d97706;">⏰</span>
                </div>
                <div style="margin: 0 0 5px 0;">
                  <div style="color: #64748b; font-size: 14px; font-weight: 500;">TIME</div>
                  <div style="color: #1e293b; font-size: 15px; font-weight: 500;">${slot.slotTime}</div>
                </div>
              </div>
            </div>

            <!-- Student -->
            <div style="display: flex; align-items: center;">
              <div style="background: #fce7f3; padding: 8px; border-radius: 8px; margin-right: 15px;">
                <span style="color: #db2777;">🎓</span>
              </div>
              <div>
                <div style="color: #64748b; font-size: 14px; font-weight: 500;">STUDENT</div>
                <div style="color: #1e293b; font-size: 15px; font-weight: 500;">${student.name}</div>
              </div>
            </div>
          </div>
        </div>
    </div>
  `,
});

  return slot;
}

  async findAll() {
    const students = await this.studentRepository.find();
    return students;
  }

  async findOne(id: string) {
    const student = await this.studentRepository.findOneBy({ id });
    if (!student) {
      throw new NotFoundException("Student not found");
    }
    return student;
  }

  async update(id: string, updateStudentDto: UpdateStudentDto) {
    const student = await this.studentRepository.findOneBy({ id });
    if (!student) {
      throw new NotFoundException("Student not found");
    }
    Object.assign(student, updateStudentDto);
    return await this.studentRepository.save(student);
  }

  async remove(id: string) {
    const student = await this.studentRepository.findOneBy({ id });
    if (!student) {
      throw new NotFoundException("Student not found");
    }
    return await this.studentRepository.remove(student);
  }
}
