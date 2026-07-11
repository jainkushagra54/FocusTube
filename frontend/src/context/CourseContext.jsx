import React, { createContext, useState, useContext, useCallback } from 'react';
import axios from 'axios';

const CourseContext = createContext();

const API_URL = import.meta.env.VITE_API_URL;

export const CourseProvider = ({ children }) => {
  const [enrollments, setEnrollments] = useState([]);
  const [currentCourse, setCurrentCourse] = useState(null);
  const [currentProgress, setCurrentProgress] = useState(null);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchEnrollments = useCallback(async () => {
    setLoadingCourses(true);
    try {
      const response = await axios.get(`${API_URL}/courses`);
      setEnrollments(response.data.data.enrollments);
    } catch (error) {
      console.error('Error fetching enrollments:', error.response?.data || error.message);
    } finally {
      setLoadingCourses(false);
    }
  }, []);

  const fetchCourseDetails = useCallback(async (courseId) => {
    setLoadingCourses(true);
    try {
      const response = await axios.get(`${API_URL}/courses/${courseId}`);
      setCurrentCourse(response.data.data.course);
      setCurrentProgress(response.data.data.progress);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching course details:', error.response?.data || error.message);
      throw error;
    } finally {
      setLoadingCourses(false);
    }
  }, []);

  const importNewCourse = async ({ youtubeUrl, startDate, targetEndDate, videosPerDay }) => {
    setActionLoading(true);
    try {
      const response = await axios.post(`${API_URL}/courses/import`, {
        youtubeUrl,
        startDate,
        targetEndDate: targetEndDate || undefined,
        videosPerDay: videosPerDay ? parseInt(videosPerDay, 10) : undefined
      });
      
      const { course, progress } = response.data.data;
      
      // Update enrollments locally
      await fetchEnrollments();
      return { course, progress };
    } catch (error) {
      console.error('Error importing course:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to import YouTube resource');
    } finally {
      setActionLoading(false);
    }
  };

  const toggleVideoCompletion = async (courseId, videoYoutubeId) => {
    try {
      const response = await axios.post(`${API_URL}/progress/${courseId}/complete/${videoYoutubeId}`);
      const updatedProgress = response.data.data.progress;

      // Update currentProgress if we are viewing this course
      if (currentProgress && currentProgress.course === courseId) {
        setCurrentProgress(updatedProgress);
      }

      // Update enrollments state to keep dashboard values synced
      setEnrollments(prev => prev.map(enroll => {
        if (enroll.course._id === courseId) {
          return { ...enroll, completedVideos: updatedProgress.completedVideos, status: updatedProgress.status };
        }
        return enroll;
      }));

      return updatedProgress;
    } catch (error) {
      console.error('Error toggling video complete status:', error.response?.data || error.message);
      throw error;
    }
  };

  const modifySchedule = async (courseId, { startDate, targetEndDate, videosPerDay }) => {
    setActionLoading(true);
    try {
      const response = await axios.put(`${API_URL}/progress/${courseId}/schedule`, {
        startDate,
        targetEndDate: targetEndDate || null,
        videosPerDay: videosPerDay ? parseInt(videosPerDay, 10) : undefined
      });
      
      const updatedProgress = response.data.data.progress;
      setCurrentProgress(updatedProgress);
      
      // Update list
      setEnrollments(prev => prev.map(enroll => {
        if (enroll.course._id === courseId) {
          return { ...enroll, startDate: updatedProgress.startDate, targetEndDate: updatedProgress.targetEndDate, schedule: updatedProgress.schedule, videosPerDay: updatedProgress.videosPerDay };
        }
        return enroll;
      }));

      return updatedProgress;
    } catch (error) {
      console.error('Error updating schedule calendar:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to adjust calendar schedule');
    } finally {
      setActionLoading(false);
    }
  };

  const value = {
    enrollments,
    currentCourse,
    currentProgress,
    loadingCourses,
    actionLoading,
    fetchEnrollments,
    fetchCourseDetails,
    importNewCourse,
    toggleVideoCompletion,
    modifySchedule
  };

  return <CourseContext.Provider value={value}>{children}</CourseContext.Provider>;
};

export const useCourses = () => {
  const context = useContext(CourseContext);
  if (!context) {
    throw new Error('useCourses must be used within a CourseProvider');
  }
  return context;
};
