import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateCounsellorDto {

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    mobile: string;

    @IsString()
    @IsNotEmpty()
    employeeId: string; 

    @IsOptional()
    slotTimings:any

}
