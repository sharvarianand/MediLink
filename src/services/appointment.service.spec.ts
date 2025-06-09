import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppointmentService } from './appointment.service';
import { Appointment } from '../entities/appointment.entity';
import { User } from '../entities/user.entity';
import { Doctor } from '../entities/doctor.entity';
import { Patient } from '../entities/patient.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('AppointmentService', () => {
  let service: AppointmentService;
  let appointmentRepository: Repository<Appointment>;
  let userRepository: Repository<User>;
  let doctorRepository: Repository<Doctor>;
  let patientRepository: Repository<Patient>;

  const mockAppointment: Partial<Appointment> = {
    id: 1,
    patient: { id: 1 } as Patient,
    doctor: { id: 1 } as Doctor,
    appointmentDate: new Date(),
    reason: 'Test appointment',
    status: 'scheduled',
  };

  const mockPatient: Partial<Patient> = {
    id: 1,
    user: { id: 1 } as User,
  };

  const mockDoctor: Partial<Doctor> = {
    id: 1,
    user: { id: 2 } as User,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentService,
        {
          provide: getRepositoryToken(Appointment),
          useValue: {
            create: jest.fn().mockReturnValue(mockAppointment),
            save: jest.fn().mockResolvedValue(mockAppointment),
            find: jest.fn().mockResolvedValue([mockAppointment]),
            findOne: jest.fn().mockResolvedValue(mockAppointment),
            remove: jest.fn().mockResolvedValue(undefined),
            createQueryBuilder: jest.fn(() => ({
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              getOne: jest.fn().mockResolvedValue(null),
            })),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn().mockResolvedValue({ id: 1 }),
          },
        },
        {
          provide: getRepositoryToken(Doctor),
          useValue: {
            findOne: jest.fn().mockResolvedValue(mockDoctor),
          },
        },
        {
          provide: getRepositoryToken(Patient),
          useValue: {
            findOne: jest.fn().mockResolvedValue(mockPatient),
          },
        },
      ],
    }).compile();

    service = module.get<AppointmentService>(AppointmentService);
    appointmentRepository = module.get<Repository<Appointment>>(getRepositoryToken(Appointment));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    doctorRepository = module.get<Repository<Doctor>>(getRepositoryToken(Doctor));
    patientRepository = module.get<Repository<Patient>>(getRepositoryToken(Patient));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an appointment successfully', async () => {
      const createAppointmentDto = {
        patientId: 1,
        doctorId: 1,
        appointmentDate: new Date(),
        reason: 'Test appointment',
      };

      const result = await service.create(createAppointmentDto);
      expect(result).toEqual(mockAppointment);
      expect(appointmentRepository.create).toHaveBeenCalled();
      expect(appointmentRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when patient not found', async () => {
      jest.spyOn(patientRepository, 'findOne').mockResolvedValueOnce(null);

      const createAppointmentDto = {
        patientId: 999,
        doctorId: 1,
        appointmentDate: new Date(),
        reason: 'Test appointment',
      };

      await expect(service.create(createAppointmentDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when doctor not found', async () => {
      jest.spyOn(doctorRepository, 'findOne').mockResolvedValueOnce(null);

      const createAppointmentDto = {
        patientId: 1,
        doctorId: 999,
        appointmentDate: new Date(),
        reason: 'Test appointment',
      };

      await expect(service.create(createAppointmentDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return an array of appointments', async () => {
      const result = await service.findAll();
      expect(result).toEqual([mockAppointment]);
      expect(appointmentRepository.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return an appointment by id', async () => {
      const result = await service.findOne(1);
      expect(result).toEqual(mockAppointment);
      expect(appointmentRepository.findOne).toHaveBeenCalled();
    });

    it('should throw NotFoundException when appointment not found', async () => {
      jest.spyOn(appointmentRepository, 'findOne').mockResolvedValueOnce(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update an appointment successfully', async () => {
      const updateAppointmentDto = {
        appointmentDate: new Date(),
        reason: 'Updated reason',
      };

      const result = await service.update(1, updateAppointmentDto);
      expect(result).toEqual(mockAppointment);
      expect(appointmentRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when appointment not found', async () => {
      jest.spyOn(appointmentRepository, 'findOne').mockResolvedValueOnce(null);

      const updateAppointmentDto = {
        appointmentDate: new Date(),
        reason: 'Updated reason',
      };

      await expect(service.update(999, updateAppointmentDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove an appointment successfully', async () => {
      await service.remove(1);
      expect(appointmentRepository.remove).toHaveBeenCalled();
    });

    it('should throw NotFoundException when appointment not found', async () => {
      jest.spyOn(appointmentRepository, 'findOne').mockResolvedValueOnce(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('should update appointment status successfully', async () => {
      const result = await service.updateStatus(1, 'confirmed');
      expect(result).toEqual(mockAppointment);
      expect(appointmentRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid status transition', async () => {
      await expect(service.updateStatus(1, 'invalid_status')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when appointment not found', async () => {
      jest.spyOn(appointmentRepository, 'findOne').mockResolvedValueOnce(null);

      await expect(service.updateStatus(999, 'confirmed')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByPatient', () => {
    it('should return appointments for a patient', async () => {
      const result = await service.findByPatient(1);
      expect(result).toEqual([mockAppointment]);
      expect(appointmentRepository.find).toHaveBeenCalled();
    });
  });

  describe('findByDoctor', () => {
    it('should return appointments for a doctor', async () => {
      const result = await service.findByDoctor(1);
      expect(result).toEqual([mockAppointment]);
      expect(appointmentRepository.find).toHaveBeenCalled();
    });
  });
}); 