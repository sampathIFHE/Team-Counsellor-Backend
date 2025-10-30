import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('counsellors')
export class Counsellor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  mobile: string;

  @Column()
  employeeId: string;

  @Column({ nullable: true })
  otp: string;

  @Column({ default: true })
  isActive: boolean;

  @Column('simple-array', { default: 'monday,tuesday,wednesday,thursday,friday' })
  availabilityDays: string[];

  @Column('simple-array', { nullable: true })
  holidays?: string[];

  @Column('json', { nullable: true })
  slotTimings:{
  monday: string[];
  tuesday: string[];
  wednesday: string[];
  thursday: string[];
  friday: string[];
};

  @Column({default:'counsellor'})
    role: string;

}
