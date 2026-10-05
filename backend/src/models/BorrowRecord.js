import mongoose from 'mongoose';

const borrowRecordSchema = new mongoose.Schema(
  {
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: [true, 'Book ID is required'],
    },
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      required: [true, 'Member ID is required'],
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    returnDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['issued', 'returned', 'overdue'],
      default: 'issued',
    },
  },
  {
    timestamps: true,
  }
);

borrowRecordSchema.index({ member: 1 });
borrowRecordSchema.index({ book: 1 });
borrowRecordSchema.index({ status: 1 });

export const BorrowRecord = mongoose.model('BorrowRecord', borrowRecordSchema);
