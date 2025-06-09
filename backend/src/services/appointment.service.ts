import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Appointment, AppointmentDocument } from '../schemas/appointment.schema';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class AppointmentService {
  constructor(
    @InjectModel(Appointment.name) private appointmentModel: Model<AppointmentDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(createAppointmentDto: any): Promise<AppointmentDocument> {
    const { patientId, doctorId, date, timeSlot, type, reason } = createAppointmentDto;

    // Validate patient exists
    const patient = await this.userModel.findOne({ _id: patientId, role: 'patient' });
    if (!patient) {
      throw new NotFoundException(`Patient with ID ${patientId} not found`);
    }

    // Validate doctor exists
    const doctor = await this.userModel.findOne({ _id: doctorId, role: 'doctor' });
    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${doctorId} not found`);
    }

    // Check if doctor is available
    const isAvailable = await this.isDoctorAvailable(doctorId, date, timeSlot);
    if (!isAvailable) {
      throw new BadRequestException('Doctor is not available at the requested time');
    }

    const appointment = new this.appointmentModel({
      doctor: doctorId,
      patient: patientId,
      date,
      timeSlot,
      type,
      reason,
      status: 'scheduled'
    });

    return appointment.save();
  }

  async findAll(): Promise<AppointmentDocument[]> {
    return this.appointmentModel.find()
      .populate('doctor', 'name email profile.specialization')
      .populate('patient', 'name email')
      .exec();
  }

  async findOne(id: string): Promise<AppointmentDocument> {
    const appointment = await this.appointmentModel.findById(id)
      .populate('doctor', 'name email profile.specialization')
      .populate('patient', 'name email')
      .exec();

    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    return appointment;
  }

  async update(id: string, updateAppointmentDto: any): Promise<AppointmentDocument> {
    const appointment = await this.findOne(id);

    // Validate appointment date if provided
    if (updateAppointmentDto.date && updateAppointmentDto.timeSlot) {
      const isAvailable = await this.isDoctorAvailable(
        appointment.doctor.toString(),
        updateAppointmentDto.date,
        updateAppointmentDto.timeSlot,
        id
      );
      if (!isAvailable) {
        throw new BadRequestException('Doctor is not available at the requested time');
      }
    }

    Object.assign(appointment, updateAppointmentDto);
    return appointment.save();
  }

  async remove(id: string): Promise<void> {
    const appointment = await this.findOne(id);
    await this.appointmentModel.deleteOne({ _id: id });
  }

  async findByPatient(patientId: string): Promise<AppointmentDocument[]> {
    return this.appointmentModel.find({ patient: patientId })
      .populate('doctor', 'name email profile.specialization')
      .populate('patient', 'name email')
      .exec();
  }

  async findByDoctor(doctorId: string): Promise<AppointmentDocument[]> {
    return this.appointmentModel.find({ doctor: doctorId })
      .populate('doctor', 'name email profile.specialization')
      .populate('patient', 'name email')
      .exec();
  }

  async updateStatus(id: string, status: string): Promise<AppointmentDocument> {
    const appointment = await this.findOne(id);
    
    if (!this.isValidStatusTransition(appointment.status, status)) {
      throw new BadRequestException(`Invalid status transition from ${appointment.status} to ${status}`);
    }

    appointment.status = status;
    return appointment.save();
  }

  private async isDoctorAvailable(
    doctorId: string,
    date: Date,
    timeSlot: { start: string; end: string },
    excludeAppointmentId?: string
  ): Promise<boolean> {
    const query: any = {
      doctor: doctorId,
      date: date,
      'timeSlot.start': timeSlot.start,
      'timeSlot.end': timeSlot.end,
      status: { $ne: 'cancelled' }
    };

    if (excludeAppointmentId) {
      query._id = { $ne: excludeAppointmentId };
    }

    const existingAppointment = await this.appointmentModel.findOne(query);
    return !existingAppointment;
  }

  private isValidStatusTransition(currentStatus: string, newStatus: string): boolean {
    const validTransitions: Record<string, string[]> = {
      'scheduled': ['confirmed', 'cancelled'],
      'confirmed': ['completed', 'cancelled'],
      'completed': [],
      'cancelled': []
    };

    return validTransitions[currentStatus]?.includes(newStatus) ?? false;
  }
} 