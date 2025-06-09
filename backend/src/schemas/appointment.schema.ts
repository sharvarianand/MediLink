import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type AppointmentDocument = Appointment & Document;

@Schema({ timestamps: true })
export class Appointment {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  doctor: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  patient: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  date: Date;

  @Prop({
    type: {
      start: String,
      end: String
    },
    required: true
  })
  timeSlot: {
    start: string;
    end: string;
  };

  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  reason: string;

  @Prop({
    type: String,
    enum: ['scheduled', 'confirmed', 'completed', 'cancelled'],
    default: 'scheduled'
  })
  status: string;
}

export const AppointmentSchema = SchemaFactory.createForClass(Appointment); 