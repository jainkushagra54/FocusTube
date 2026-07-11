import Course from '../models/Course.js';
import Progress from '../models/Progress.js';
import { parseYoutubeUrl, fetchYoutubeCourseData } from '../services/youtube.service.js';
import { calculateSchedule } from '../services/scheduler.service.js';
import AppError from '../utils/AppError.js';

export const importCourse = async (req, res, next) => {
  try {
    const { youtubeUrl, startDate, targetEndDate, videosPerDay } = req.body;

    if (!youtubeUrl) {
      return next(new AppError('Please provide a YouTube video or playlist URL', 400));
    }

    // 1. Parse YouTube URL to identify ID and type
    const { id: youtubeId, type } = parseYoutubeUrl(youtubeUrl);

    // 2. Check if Course metadata already exists in DB
    let course = await Course.findOne({ youtubeId });

    if (!course) {
      // Fetch details from YouTube API (or mock fallback if no key)
      const courseData = await fetchYoutubeCourseData(youtubeId, type);
      
      course = await Course.create({
        title: courseData.title,
        description: courseData.description,
        thumbnailUrl: courseData.thumbnailUrl,
        youtubeId: courseData.youtubeId,
        type: courseData.type,
        creator: req.user._id,
        videos: courseData.videos
      });
    }

    // 3. Check if user is already enrolled in this course
    let progress = await Progress.findOne({ user: req.user._id, course: course._id });

    if (progress) {
      return res.status(200).json({
        status: 'success',
        message: 'You are already enrolled in this course',
        data: {
          course,
          progress
        }
      });
    }

    // 4. Generate the study schedule calendar
    const schedStartDate = startDate ? new Date(startDate) : new Date();
    const parsedVideosPerDay = videosPerDay ? parseInt(videosPerDay, 10) : 1;
    
    let schedTargetEndDate = null;
    if (targetEndDate) {
      schedTargetEndDate = new Date(targetEndDate);
    } else {
      // Calculate a target end date based on videos count and videos per day
      const daysNeeded = Math.ceil(course.videos.length / parsedVideosPerDay);
      schedTargetEndDate = new Date(schedStartDate);
      schedTargetEndDate.setDate(schedTargetEndDate.getDate() + Math.max(0, daysNeeded - 1));
    }

    const { schedule, calculatedEndDate } = calculateSchedule(
      course.videos,
      schedStartDate,
      schedTargetEndDate,
      parsedVideosPerDay
    );

    // 5. Create Progress enrollment
    progress = await Progress.create({
      user: req.user._id,
      course: course._id,
      startDate: schedStartDate,
      targetEndDate: calculatedEndDate,
      videosPerDay: parsedVideosPerDay,
      schedule,
      completedVideos: [],
      status: 'in-progress'
    });

    res.status(21).json({
      status: 'success',
      data: {
        course,
        progress
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getMyCourses = async (req, res, next) => {
  try {
    // Find all enrollment records for the user and populate the Course details
    const enrollments = await Progress.find({ user: req.user._id })
      .populate('course')
      .sort('-createdAt');

    res.status(200).json({
      status: 'success',
      results: enrollments.length,
      data: {
        enrollments
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getCourseById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id);
    if (!course) {
      return next(new AppError('Course not found', 404));
    }

    // Fetch the logged in user's progress for this course
    const progress = await Progress.findOne({ user: req.user._id, course: id });

    res.status(200).json({
      status: 'success',
      data: {
        course,
        progress: progress || null
      }
    });
  } catch (error) {
    next(error);
  }
};
