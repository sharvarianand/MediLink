import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Patient } from './patient.entity';
import { Doctor } from './doctor.entity';

export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled';

@Entity()
export class Appointment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Patient, { eager: true })
  patient: Patient;

  @ManyToOne(() => Doctor, { eager: true })
  doctor: Doctor;

  @Column()
  appointmentDate: Date;

  @Column()
  reason: string;

  @Column({
    type: 'enum',
    enum: ['scheduled', 'confirmed', 'completed', 'cancelled'],
    default: 'scheduled',
  })
  status: AppointmentStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 