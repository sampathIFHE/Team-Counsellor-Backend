import { IsNotEmpty, IsString } from "class-validator";

export class CreateStudentDto {

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
    school: string;

    @IsNotEmpty()
    @IsString()
    enrollmentId: string;

    @IsNotEmpty()
    @IsString()
    program: string;

    @IsNotEmpty()
    @IsString()
    yearOfJoining: string;


}
