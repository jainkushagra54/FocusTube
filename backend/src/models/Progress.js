import mongoose from 'mongoose';

const scheduleDaySchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  videoYoutubeIds: [
    {
      type: String,
      required: true
    }
  ]
});

const progressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required']
    },
    targetEndDate: {
      type: Date,
      required: [true, 'Target end date is required']
    },
    videosPerDay: {
      type: Number,
      default: 1,
      min: [1, 'Must watch at least 1 video per day']
    },
    schedule: [scheduleDaySchema],
    completedVideos: [
      {
        type: String // YouTube Video IDs that have been completed
      }
    ],
    status: {
      type: String,
      enum: ['in-progress', 'completed'],
      default: 'in-progress'
    },
    completedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Ensure a user can only enroll in a course once
progressSchema.index({ user: 1, course: 1 }, { unique: true });

const Progress = mongoose.model('Progress', progressSchema);
export default Progress;
