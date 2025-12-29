/**
 * StreamTemplate Model
 * Mongoose schema for stream templates
 */

import mongoose from 'mongoose';

export interface IStreamTemplate {
  userId: string; // User ID who created the template
  name: string;
  description: string;
  amount: string; // Amount in sBTC
  durationBlocks: number;
  durationLabel: string; // Human-readable duration (e.g., "30 days")
  category: 'salary' | 'contract' | 'vesting' | 'custom';
  isDefault: boolean; // Whether it's a system default template
  createdAt: Date;
  updatedAt: Date;
}

const streamTemplateSchema = new mongoose.Schema<IStreamTemplate>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: String,
      required: true,
    },
    durationBlocks: {
      type: Number,
      required: true,
    },
    durationLabel: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['salary', 'contract', 'vesting', 'custom'],
      default: 'custom',
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes
streamTemplateSchema.index({ userId: 1, createdAt: -1 });
streamTemplateSchema.index({ userId: 1, category: 1 });

export const StreamTemplate =
  mongoose.models.StreamTemplate ||
  mongoose.model<IStreamTemplate>('StreamTemplate', streamTemplateSchema);
