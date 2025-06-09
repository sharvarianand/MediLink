import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, enum: ['doctor', 'patient'] })
  role: string;

  @Prop({
    type: {
      age: Number,
      gender: String,
      specialization: String,
      qualifications: [{
        degree: String,
        institution: String,
        year: Number
      }],
      experience: Number,
      licenseNumber: String,
      availability: [{
        day: String,
        slots: [{
          start: String,
          end: String
        }]
      }],
      bloodGroup: String,
      allergies: [String],
      chronicConditions: [String],
      emergencyContact: {
        name: String,
        relationship: String,
        phone: String
      },
      insurance: {
        provider: String,
        policyNumber: String,
        groupNumber: String,
        expiryDate: Date
      }
    }
  })
  profile: {
    age?: number;
    gender?: string;
    specialization?: string;
    qualifications?: Array<{
      degree: string;
      institution: string;
      year: number;
    }>;
    experience?: number;
    licenseNumber?: string;
    availability?: Array<{
      day: string;
      slots: Array<{
        start: string;
        end: string;
      }>;
    }>;
    bloodGroup?: string;
    allergies?: string[];
    chronicConditions?: string[];
    emergencyContact?: {
      name: string;
      relationship: string;
      phone: string;
    };
    insurance?: {
      provider: string;
      policyNumber: string;
      groupNumber: string;
      expiryDate: Date;
    };
  };
}

export const UserSchema = SchemaFactory.createForClass(User); 