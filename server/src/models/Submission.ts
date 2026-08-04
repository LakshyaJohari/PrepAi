import mongoose, { Document, Schema } from 'mongoose';

export interface ISubmission extends Document {
  user_id: mongoose.Types.ObjectId;
  problem_id: mongoose.Types.ObjectId;
  code: string;
  language: string;
  status: 'Accepted' | 'Wrong Answer' | 'Time Limit Exceeded' | 'Runtime Error' | 'Compilation Error';
  execution_time: number;
  memory_used: number;
  createdAt: Date;
  updatedAt: Date;
}

const SubmissionSchema = new Schema<ISubmission>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    problem_id: { type: Schema.Types.ObjectId, ref: 'Problem', required: true },
    code: { type: String, required: true },
    language: { type: String, required: true, default: 'javascript' },
    status: { type: String, required: true },
    execution_time: { type: Number, default: 0 },
    memory_used: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Submission = mongoose.model<ISubmission>('Submission', SubmissionSchema);
