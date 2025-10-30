import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

export enum SlotStatus {
    AVAILABLE = 'available',
    BOOKED = 'booked',
    BLOCKED = 'blocked',
    CANCELLED = 'cancelled',
}

@Entity('slots')
export class Slot {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'date' })
    date: string;

    @Column()
    slotTime: string;

    @Column({ type: 'enum', enum: SlotStatus, default: SlotStatus.AVAILABLE })
    status: SlotStatus;

    @Column('jsonb')
    counsellor: {
        id: string;
        name: string;
    };

    @Column('jsonb', { nullable: true })
    user?: {
        id: string;
        name: string;
        email: string;
    };
}
