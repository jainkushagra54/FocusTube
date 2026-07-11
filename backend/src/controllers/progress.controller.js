import Progress from '../models/Progress.js';
import Course from '../models/Course.js';
import { calculateSchedule } from '../services/scheduler.service.js';
import AppError from '../utils/AppError.js';

export const toggleVideoComplete = async (req, res, next) => {
  try {
    const { courseId, videoYoutubeId } = req.params;

    // Find progress record
    const progress = await Progress.findOne({ user: req.user._id, course: courseId }).populate('course');
    
    if (!progress) {
      return next(new AppError('Enrollment progress record not found for this course', 404));
    }

    // Check if the video is part of the course
    const videoExists = progress.course.videos.some(vid => vid.youtubeId === videoYoutubeId);
    if (!videoExists) {
      return next(new AppError('Video is not part of this course', 400));
    }

    const videoIndex = progress.completedVideos.indexOf(videoYoutubeId);

    if (videoIndex > -1) {
      // 1. Unmark completed (remove from list)
      progress.completedVideos.splice(videoIndex, 1);
      progress.status = 'in-progress';
      progress.completedAt = undefined;
    } else {
      // 2. Mark completed (add to list)
      progress.completedVideos.push(videoYoutubeId);

      // Check if all videos in the course are completed
      const totalVideosCount = progress.course.videos.length;
      if (progress.completedVideos.length >= totalVideosCount) {
        progress.status = 'completed';
        progress.completedAt = new Date();
      }
    }

    await progress.save();

    res.status(200).json({
      status: 'success',
      data: {
        progress
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateSchedule = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { startDate, targetEndDate, videosPerDay } = req.body;

    const progress = await Progress.findOne({ user: req.user._id, course: courseId }).populate('course');

    if (!progress) {
      return next(new AppError('Enrollment progress record not found for this course', 404));
    }

    const newStartDate = startDate ? new Date(startDate) : progress.startDate;
    const newVideosPerDay = videosPerDay ? parseInt(videosPerDay, 10) : progress.videosPerDay;
    
    let newTargetEndDate = null;
    if (targetEndDate) {
      newTargetEndDate = new Date(targetEndDate);
    } else if (req.body.hasOwnProperty('targetEndDate') && !targetEndDate) {
      // If targetEndDate was explicitly passed as null, recalculate it based on videosPerDay
      const daysNeeded = Math.ceil(progress.course.videos.length / newVideosPerDay);
      newTargetEndDate = new Date(newStartDate);
      newTargetEndDate.setDate(newTargetEndDate.getDate() + Math.max(0, daysNeeded - 1));
    } else {
      newTargetEndDate = progress.targetEndDate;
    }

    // Recalculate schedule calendar
    const { schedule, calculatedEndDate } = calculateSchedule(
      progress.course.videos,
      newStartDate,
      newTargetEndDate,
      newVideosPerDay
    );

    // Save updates
    progress.startDate = newStartDate;
    progress.targetEndDate = calculatedEndDate;
    progress.videosPerDay = newVideosPerDay;
    progress.schedule = schedule;

    await progress.save();

    res.status(200).json({
      status: 'success',
      data: {
        progress
      }
    });
  } catch (error) {
    next(error);
  }
};
