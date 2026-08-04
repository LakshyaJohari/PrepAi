import mongoose, { Document, Schema } from 'mongoose';

export interface IInterview extends Document {
  user_id: mongoose.Types.ObjectId;
  config: Record<string, any>;
  questions: any[];
  transcript: any[];
  feedback: any;
  score: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

const InterviewSchema = new Schema<IInterview>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    config: { type: Schema.Types.Mixed },
    questions: { type: Schema.Types.Mixed },
    transcript: { type: Schema.Types.Mixed },
    feedback: { type: Schema.Types.Mixed },
    score: { type: Number, default: 0 },
    status: { 
      type: String, 
      enum: ['pending', 'in_progress', 'completed', 'cancelled'], 
      default: 'pending' 
    },
  },
  { timestamps: true }
);

export const Interview = mongoose.model<IInterview>('Interview', InterviewSchema);
