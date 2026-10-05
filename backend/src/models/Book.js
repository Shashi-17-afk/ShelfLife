import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Book title is required'],
      trim: true,
    },
    author: {
      type: String,
      required: [true, 'Author name is required'],
      trim: true,
    },
    ISBN: {
      type: String,
      required: [true, 'ISBN is required'],
      unique: true,
      trim: true,
    },
    genre: {
      type: String,
      required: [true, 'Genre is required'],
      trim: true,
    },
    totalCopies: {
      type: Number,
      required: [true, 'Total copies is required'],
      min: [0, 'Total copies cannot be negative'],
      validate: {
        validator: Number.isInteger,
        message: 'Total copies must be an integer',
      },
    },
    availableCopies: {
      type: Number,
      required: [true, 'Available copies is required'],
      min: [0, 'Available copies cannot be negative'],
      validate: [
        {
          validator: Number.isInteger,
          message: 'Available copies must be an integer',
        },
        {
          validator: function (value) {
            return value <= this.totalCopies;
          },
          message: 'Available copies cannot exceed total copies',
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast filtering and searching
bookSchema.index({ title: 'text', author: 'text' });
bookSchema.index({ genre: 1 });

export const Book = mongoose.model('Book', bookSchema);
