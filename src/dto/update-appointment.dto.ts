import { IsOptional, IsDate, IsString } from 'class-validator';

export class UpdateAppointmentDto {
  @IsOptional()
  @IsDate()
  appointmentDate?: Date;

  @IsOptional()
  @IsString()
  reason?: string;
} 