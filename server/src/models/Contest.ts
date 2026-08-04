import mongoose, { Document, Schema } from 'mongoose';

export interface IContest extends Document {
  title: string;
  description: string;
  start_time: Date;
  end_time: Date;
  status: 'upcoming' | 'active' | 'completed';
  problems: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const ContestSchema = new Schema<IContest>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    start_time: { type: Date, required: true },
    end_time: { type: Date, required: true },
    status: { 
      type: String, 
      enum: ['upcoming', 'active', 'completed'], 
      default: 'upcoming' 
    },
    problems: [{ type: Schema.Types.ObjectId, ref: 'Problem' }],
  },
  { timestamps: true }
);

export const Contest = mongoose.model<IContest>('Contest', ContestSchema);

export interface IContestParticipant extends Document {
  contest_id: mongoose.Types.ObjectId;
  user_id: mongoose.Types.ObjectId;
  score: number;
  rank?: number;
  joined_at: Date;
}

const ContestParticipantSchema = new Schema<IContestParticipant>(
  {
    contest_id: { type: Schema.Types.ObjectId, ref: 'Contest', required: true },
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    score: { type: Number, default: 0 },
    rank: { type: Number },
    joined_at: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const ContestParticipant = mongoose.model<IContestParticipant>('ContestParticipant', ContestParticipantSchema);

export interface IContestSubmission extends Document {
  contest_id: mongoose.Types.ObjectId;
  problem_id: mongoose.Types.ObjectId;
  user_id: mongoose.Types.ObjectId;
  code: string;
  language: string;
  status: 'Accepted' | 'Wrong Answer' | 'Time Limit Exceeded' | 'Runtime Error' | 'Compilation Error';
  score: number;
  createdAt: Date;
  updatedAt: Date;
}

const ContestSubmissionSchema = new Schema<IContestSubmission>(
  {
    contest_id: { type: Schema.Types.ObjectId, ref: 'Contest', required: true },
    problem_id: { type: Schema.Types.ObjectId, ref: 'Problem', required: true },
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    code: { type: String, required: true },
    language: { type: String, required: true, default: 'javascript' },
    status: { type: String, required: true },
    score: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const ContestSubmission = mongoose.model<IContestSubmission>('ContestSubmission', ContestSubmissionSchema);
