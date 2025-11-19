import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateStudentDto {

    @IsOptional()
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsString()
    email: string;

    @IsOptional()
    @IsString()
    mobile: string;

    @IsOptional()
    @IsString()
    school: string;

    @IsOptional()
    @IsString()
    enrollmentId: string;

    @IsOptional()
    @IsString()
    program: string;

    @IsOptional()
    @IsString()
    yearOfJoining: string;


}
