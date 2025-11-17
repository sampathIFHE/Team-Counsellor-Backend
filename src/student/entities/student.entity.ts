import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('students')
export class Student {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true })
  mobile: string;

  @Column()
  school: string;

  @Column({unique: true})
  enrollmentId: string;

  @Column()
  program: string;

  @Column({ nullable: true })
  otp: string;

  @Column()
  yearOfJoining: string;

  @Column({ nullable: true })
  counsellorId: string;

  @Column({ type: 'text' ,nullable: true })
  counselingNotes: string;
}
