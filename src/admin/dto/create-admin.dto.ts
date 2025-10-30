import { IsNotEmpty, IsString } from "class-validator";

export class CreateAdminDto {

    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsString()
    email: string;

    @IsNotEmpty()
    @IsString()
    mobile: string;

    @IsNotEmpty()
    @IsString()
    employeeId: string;

    
}
