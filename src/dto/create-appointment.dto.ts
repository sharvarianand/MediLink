import { IsNotEmpty, IsNumber, IsDate, IsString } from 'class-validator';

export class CreateAppointmentDto {
  @IsNotEmpty()
  @IsNumber()
  patientId: number;

  @IsNotEmpty()
  @IsNumber()
  doctorId: number;

  @IsNotEmpty()
  @IsDate()
  appointmentDate: Date;

  @IsNotEmpty()
  @IsString()
  reason: string;
} 