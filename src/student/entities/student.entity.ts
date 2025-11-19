import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('students')
export class Student {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({nullable: true})
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true, nullable: true })
  mobile: string;

  @Column({nullable: true})
  school: string;

  @Column({unique: true, nullable: true})
  enrollmentId: string;

  @Column({nullable: true})
  program: string;

  @Column({ nullable: true })
  otp: string;

  @Column({nullable: true})
  yearOfJoining: string;

  @Column({ nullable: true })
  counsellorId: string;

  @Column({ type: 'text' ,nullable: true })
  counselingNotes: string;
}
