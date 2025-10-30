import { IsEnum, IsNotEmpty, IsOptional } from "class-validator";
import { SlotStatus } from "../entities/slot.entity";

export class CreateSlotDto {

    @IsNotEmpty()
    date: string;

    @IsNotEmpty()
    slotTime: string;

    @IsNotEmpty()
    counsellor: {
        id: string;
        name: string;
    };

    @IsEnum(SlotStatus)
    @IsOptional()
    status?: SlotStatus;

    @IsOptional()
    user?: {
        id: string;
        name: string;
        email: string;
    };
}
