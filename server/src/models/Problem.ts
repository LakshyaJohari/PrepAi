import mongoose, { Document, Schema } from 'mongoose';

export interface IProblem extends Document {
  title: string;
  slug: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  description: string;
  constraints?: string;
  examples?: any[];
  hints?: string[];
  topics?: string[];
  companies?: string[];
  status: 'pending' | 'approved' | 'rejected';
  contributed_by?: mongoose.Types.ObjectId;
  test_cases: any[]; // e.g. [{ input: '...', expected_output: '...' }]
  starter_code?: string;
  solution?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProblemSchema = new Schema<IProblem>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    constraints: { type: String },
    examples: { type: Schema.Types.Mixed, default: [] },
    hints: { type: [String], default: [] },
    topics: { type: [String], default: [] },
    companies: { type: [String], default: [] },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
    contributed_by: { type: Schema.Types.ObjectId, ref: 'User' },
    test_cases: { type: Schema.Types.Mixed, default: [] },
    starter_code: { type: String },
    solution: { type: String },
  },
  { timestamps: true }
);

export const Problem = mongoose.model<IProblem>('Problem', ProblemSchema);
