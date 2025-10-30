import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
@Entity('admins')
export class Admin {

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

    @Column({nullable:true})
    otp: string;

    @Column({default:true})
    isActive: boolean;

    @Column({default:'admin'})
    role: string;
}
