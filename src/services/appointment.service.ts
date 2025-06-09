import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from '../entities/appointment.entity';
import { CreateAppointmentDto } from '../dto/create-appointment.dto';
import { UpdateAppointmentDto } from '../dto/update-appointment.dto';
import { User } from '../entities/user.entity';
import { Doctor } from '../entities/doctor.entity';
import { Patient } from '../entities/patient.entity';

@Injectable()
export class AppointmentService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Doctor)
    private doctorRepository: Repository<Doctor>,
    @InjectRepository(Patient)
    private patientRepository: Repository<Patient>,
  ) {}

  async create(createAppointmentDto: CreateAppointmentDto): Promise<Appointment> {
    const { patientId, doctorId, appointmentDate, reason } = createAppointmentDto;

    // Validate patient exists
    const patient = await this.patientRepository.findOne({ where: { id: patientId } });
    if (!patient) {
      throw new NotFoundException(`Patient with ID ${patientId} not found`);
    }

    // Validate doctor exists
    const doctor = await this.doctorRepository.findOne({ where: { id: doctorId } });
    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${doctorId} not found`);
    }

    // Check if doctor is available at the requested time
    const isAvailable = await this.isDoctorAvailable(doctorId, appointmentDate);
    if (!isAvailable) {
      throw new BadRequestException('Doctor is not available at the requested time');
    }

    const appointment = this.appointmentRepository.create({
      patient,
      doctor,
      appointmentDate,
      reason,
      status: 'scheduled',
    });

    return this.appointmentRepository.save(appointment);
  }

  async findAll(): Promise<Appointment[]> {
    return this.appointmentRepository.find({
      relations: ['patient', 'doctor'],
    });
  }

  async findOne(id: number): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id },
      relations: ['patient', 'doctor'],
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    return appointment;
  }

  async update(id: number, updateAppointmentDto: UpdateAppointmentDto): Promise<Appointment> {
    const appointment = await this.findOne(id);

    // Validate appointment date if provided
    if (updateAppointmentDto.appointmentDate) {
      const isAvailable = await this.isDoctorAvailable(
        appointment.doctor.id,
        updateAppointmentDto.appointmentDate,
        id,
      );
      if (!isAvailable) {
        throw new BadRequestException('Doctor is not available at the requested time');
      }
    }

    // Update appointment fields
    Object.assign(appointment, updateAppointmentDto);
    return this.appointmentRepository.save(appointment);
  }

  async remove(id: number): Promise<void> {
    const appointment = await this.findOne(id);
    await this.appointmentRepository.remove(appointment);
  }

  async findByPatient(patientId: number): Promise<Appointment[]> {
    return this.appointmentRepository.find({
      where: { patient: { id: patientId } },
      relations: ['patient', 'doctor'],
    });
  }

  async findByDoctor(doctorId: number): Promise<Appointment[]> {
    return this.appointmentRepository.find({
      where: { doctor: { id: doctorId } },
      relations: ['patient', 'doctor'],
    });
  }

  async updateStatus(id: number, status: string): Promise<Appointment> {
    const appointment = await this.findOne(id);
    
    // Validate status transition
    if (!this.isValidStatusTransition(appointment.status, status)) {
      throw new BadRequestException(`Invalid status transition from ${appointment.status} to ${status}`);
    }

    appointment.status = status as Appointment['status'];
    return this.appointmentRepository.save(appointment);
  }

  private async isDoctorAvailable(
    doctorId: number,
    appointmentDate: Date,
    excludeAppointmentId?: number,
  ): Promise<boolean> {
    const query = this.appointmentRepository.createQueryBuilder('appointment')
      .where('appointment.doctor.id = :doctorId', { doctorId })
      .andWhere('appointment.appointmentDate = :appointmentDate', { appointmentDate });

    if (excludeAppointmentId) {
      query.andWhere('appointment.id != :excludeAppointmentId', { excludeAppointmentId });
    }

    const existingAppointment = await query.getOne();
    return !existingAppointment;
  }

  private isValidStatusTransition(currentStatus: Appointment['status'], newStatus: string): boolean {
    const validTransitions: Record<Appointment['status'], Appointment['status'][]> = {
      'scheduled': ['confirmed', 'cancelled'],
      'confirmed': ['completed', 'cancelled'],
      'completed': [],
      'cancelled': [],
    };

    return validTransitions[currentStatus]?.includes(newStatus as Appointment['status']) ?? false;
  }
} 