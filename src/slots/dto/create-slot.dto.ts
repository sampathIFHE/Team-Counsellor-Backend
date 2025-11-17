import { IsEnum, IsNotEmpty, IsOptional } from "class-validator";
import { SlotStatus } from "../entities/slot.entity";

export class CreateSlotDto {

    @IsNotEmpty()
    date: string;

    @IsNotEmpty()
    slotTime: string;

    @IsNotEmpty()
    counsellorId: string;

    @IsEnum(SlotStatus)
    @IsOptional()
    status?: SlotStatus;

    @IsOptional()
    studentId?: string;

    @IsOptional()
    reason?: string;
}
