import mongoose from 'mongoose';

const videoItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  youtubeId: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  duration: {
    type: Number, // In seconds
    default: 0
  },
  thumbnailUrl: {
    type: String,
    default: ''
  },
  position: {
    type: Number,
    required: true
  }
});

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Course must have a title'],
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    thumbnailUrl: {
      type: String,
      default: ''
    },
    youtubeId: {
      type: String,
      required: [true, 'YouTube playlist or video ID is required'],
      unique: true // Prevent importing duplicate courses
    },
    type: {
      type: String,
      required: true,
      enum: ['single', 'playlist']
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    videos: [videoItemSchema]
  },
  {
    timestamps: true
  }
);

// Indexing for faster queries
courseSchema.index({ creator: 1 });

const Course = mongoose.model('Course', courseSchema);
export default Course;
