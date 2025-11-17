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


@Injectable()
export class StudentService {
    private transporter;

  constructor(
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,

    @InjectRepository(Slot)
    private slotRepository: Repository<Slot>,
  ) {
        this.transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS,
          },
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

async sendOTPEmail(email: string, otp: string) {
const stundent:any = await this.studentRepository.findOne({where: [{email},{enrollmentId:email}]});
if(!stundent){
  throw new NotFoundException("Student not found");
}
stundent.otp = otp;
await this.studentRepository.save(stundent);
    await this.transporter.sendMail({
      from: `"Safe Minds" <${process.env.MAIL_USER}>`,
      to: stundent.email,
      subject: "Your OTP Code",
      text: `Your OTP is ${otp}. It will expire in 5 minutes.`,
    });
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
