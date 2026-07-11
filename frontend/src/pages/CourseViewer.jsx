import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCourses } from '../context/CourseContext';
import VideoPlayer from '../components/VideoPlayer';
import CalendarView from '../components/CalendarView';

const CourseViewer = () => {
  const { id: courseId } = useParams();
  const { currentCourse, currentProgress, loadingCourses, actionLoading, fetchCourseDetails, toggleVideoCompletion, modifySchedule } = useCourses();

  const [activeVideoId, setActiveVideoId] = useState('');
  
  // Reschedule Form States
  const [showReschedule, setShowReschedule] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [scheduleMode, setScheduleMode] = useState('quota');
  const [targetEndDate, setTargetEndDate] = useState('');
  const [videosPerDay, setVideosPerDay] = useState(1);
  const [reschedError, setReschedError] = useState('');

  // Fetch course details on mount or ID change
  useEffect(() => {
    fetchCourseDetails(courseId).then(data => {
      const { course, progress } = data;
      
      // Select default video: first incomplete video, or first video if all completed
      if (course && course.videos.length > 0) {
        const completed = progress?.completedVideos || [];
        const firstIncomplete = course.videos.find(v => !completed.includes(v.youtubeId));
        
        if (firstIncomplete) {
          setActiveVideoId(firstIncomplete.youtubeId);
        } else {
          setActiveVideoId(course.videos[0].youtubeId);
        }
      }

      // Pre-fill rescheduling fields
      if (progress) {
        setStartDate(new Date(progress.startDate).toISOString().split('T')[0]);
        setVideosPerDay(progress.videosPerDay || 1);
        if (progress.targetEndDate) {
          setTargetEndDate(new Date(progress.targetEndDate).toISOString().split('T')[0]);
        }
      }
    }).catch(err => {
      console.error(err);
    });
  }, [courseId, fetchCourseDetails]);

  // Map videos by ID for fast access
  const activeVideo = useMemo(() => {
    if (!currentCourse || !activeVideoId) return null;
    return currentCourse.videos.find(v => v.youtubeId === activeVideoId);
  }, [currentCourse, activeVideoId]);

  const handleToggleComplete = async (videoId) => {
    try {
      await toggleVideoCompletion(courseId, videoId);
    } catch (err) {
      console.error('Failed to toggle completion:', err);
    }
  };

  const handleVideoAutoEnd = async (videoId) => {
    // 1. Mark completed
    if (currentProgress && !currentProgress.completedVideos.includes(videoId)) {
      const updated = await toggleVideoCompletion(courseId, videoId);
      
      // 2. Play next video in the playlist automatically
      if (currentCourse && currentCourse.videos.length > 0) {
        const completedList = updated.completedVideos || [];
        const nextIncomplete = currentCourse.videos.find(v => !completedList.includes(v.youtubeId));
        if (nextIncomplete) {
          setActiveVideoId(nextIncomplete.youtubeId);
        }
      }
    }
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    setReschedError('');

    try {
      const payload = {
        startDate: new Date(startDate).toISOString(),
        videosPerDay: scheduleMode === 'quota' ? videosPerDay : undefined,
        targetEndDate: scheduleMode === 'date' && targetEndDate ? new Date(targetEndDate).toISOString() : null
      };

      await modifySchedule(courseId, payload);
      setShowReschedule(false);
    } catch (err) {
      setReschedError(err.message || 'Failed to update schedule calendar');
    }
  };

  if (loadingCourses && !currentCourse) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <span>Loading course syllabus...</span>
      </div>
    );
  }

  if (!currentCourse) {
    return (
      <div style={styles.errorContainer}>
        <h3>Course Not Found</h3>
        <Link to="/" className="btn-primary" style={{ marginTop: '20px' }}>Back to Dashboard</Link>
      </div>
    );
  }

  const completedCount = currentProgress?.completedVideos?.length || 0;
  const totalVideos = currentCourse.videos.length;
  const progressPercent = totalVideos > 0 ? Math.round((completedCount / totalVideos) * 100) : 0;

  return (
    <div className="animate-fade-in" style={styles.container}>
      {/* Header bar */}
      <div style={styles.header}>
        <Link to="/" style={styles.backLink}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to Dashboard
        </Link>
        <div style={styles.courseMeta}>
          <h1 style={styles.courseTitle}>{currentCourse.title}</h1>
          <span style={currentProgress?.status === 'completed' ? styles.statusBadgeCompleted : styles.statusBadge}>
            {currentProgress?.status === 'completed' ? 'Course Completed 🎉' : 'In Progress'}
          </span>
        </div>
      </div>

      {/* Grid: Left Player, Right Curriculum */}
      <div style={styles.layoutGrid}>
        
        {/* Left Side: Player + Metadata + Scheduler Toggles */}
        <div style={styles.leftCol}>
          <VideoPlayer 
            videoId={activeVideoId} 
            onVideoEnd={handleVideoAutoEnd} 
          />

          {/* Active Lecture Details */}
          {activeVideo && (
            <div className="glass-panel" style={styles.lecturePanel}>
              <h2 style={styles.lectureTitle}>{activeVideo.title}</h2>
              <div style={styles.lectureMeta}>
                <span>Lecture {activeVideo.position + 1} of {totalVideos}</span>
                <span>•</span>
                <span>Duration: {Math.floor(activeVideo.duration / 60)} minutes</span>
              </div>
              {activeVideo.description && (
                <p style={styles.lectureDesc}>{activeVideo.description}</p>
              )}
            </div>
          )}

          {/* Rescheduling Form Panel */}
          <div className="glass-panel" style={styles.reschedulePanel}>
            <div style={styles.rescheduleHeader} onClick={() => setShowReschedule(!showReschedule)}>
              <h3>⚙️ Custom Study Scheduler</h3>
              <button style={styles.toggleBtn}>
                {showReschedule ? 'Hide Panel' : 'Adjust Settings'}
              </button>
            </div>

            {showReschedule && (
              <form onSubmit={handleRescheduleSubmit} style={styles.rescheduleForm}>
                {reschedError && <div style={styles.errorAlert}>{reschedError}</div>}
                
                <div style={styles.formRow}>
                  <div style={styles.inputGroup}>
                    <label style={styles.formLabel}>Start Date</label>
                    <input 
                      type="date" 
                      className="input-field"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                    />
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.formLabel}>Syllabus Mode</label>
                    <select 
                      className="input-field"
                      value={scheduleMode}
                      onChange={(e) => setScheduleMode(e.target.value)}
                    >
                      <option value="quota">Videos Per Day</option>
                      <option value="date">Target End Date</option>
                    </select>
                  </div>

                  {scheduleMode === 'quota' ? (
                    <div style={styles.inputGroup}>
                      <label style={styles.formLabel}>Daily Videos</label>
                      <input 
                        type="number" 
                        className="input-field"
                        min="1"
                        value={videosPerDay}
                        onChange={(e) => setVideosPerDay(parseInt(e.target.value, 10))}
                        required
                      />
                    </div>
                  ) : (
                    <div style={styles.inputGroup}>
                      <label style={styles.formLabel}>Target End Date</label>
                      <input 
                        type="date" 
                        className="input-field"
                        min={startDate}
                        value={targetEndDate}
                        onChange={(e) => setTargetEndDate(e.target.value)}
                        required
                      />
                    </div>
                  )}
                </div>

                <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start', marginTop: '10px' }} disabled={actionLoading}>
                  {actionLoading ? 'Updating Calendar...' : 'Recalculate Schedule'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right Side: Curriculum Syllabus Navigation */}
        <div className="glass-panel" style={styles.rightCol}>
          <div style={styles.progressHeader}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
              <span style={{ color: '#94a3b8' }}>Overall Course Completion</span>
              <span style={{ color: '#8b5cf6', fontWeight: '600' }}>{progressPercent}%</span>
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>

          <h3 style={styles.curriculumHeading}>📚 Lecture Curriculum</h3>
          <div style={styles.curriculumList}>
            {currentCourse.videos.map((video) => {
              const isCompleted = currentProgress?.completedVideos?.includes(video.youtubeId);
              const isActive = video.youtubeId === activeVideoId;

              return (
                <div 
                  key={video.youtubeId} 
                  style={{
                    ...styles.curriculumItem,
                    ...(isActive ? styles.curriculumItemActive : {}),
                    ...(isCompleted ? styles.curriculumItemCompleted : {})
                  }}
                >
                  <button 
                    onClick={() => handleToggleComplete(video.youtubeId)} 
                    style={styles.checkBtn}
                  >
                    {isCompleted ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <div style={styles.checkEmpty} />
                    )}
                  </button>

                  <div 
                    onClick={() => setActiveVideoId(video.youtubeId)} 
                    style={styles.itemTextCol}
                    role="button"
                  >
                    <span style={isCompleted ? styles.itemTitleCompleted : styles.itemTitle}>
                      {video.title}
                    </span>
                    <span style={styles.itemDuration}>{Math.floor(video.duration / 60)} mins</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Bottom Panel: Study Calendar timeline agenda */}
      <div className="glass-panel" style={styles.calendarContainer}>
        {currentProgress && (
          <CalendarView 
            schedule={currentProgress.schedule}
            completedVideos={currentProgress.completedVideos}
            videos={currentCourse.videos}
            activeVideoId={activeVideoId}
            onSelectVideo={setActiveVideoId}
            onToggleComplete={handleToggleComplete}
          />
        )}
      </div>

    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '10px 0',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '24px',
  },
  backLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    color: '#94a3b8',
    textDecoration: 'none',
    fontSize: '0.85rem',
    fontWeight: '500',
    transition: 'color 0.2s ease',
  },
  courseMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '20px',
  },
  courseTitle: {
    fontSize: '1.6rem',
    color: '#ffffff',
  },
  statusBadge: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#94a3b8',
    fontSize: '0.8rem',
    fontWeight: '600',
    padding: '6px 12px',
    borderRadius: '8px',
    whiteSpace: 'nowrap',
  },
  statusBadgeCompleted: {
    background: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    color: '#10b981',
    fontSize: '0.8rem',
    fontWeight: '600',
    padding: '6px 12px',
    borderRadius: '8px',
    boxShadow: '0 0 10px rgba(16, 185, 129, 0.1)',
    whiteSpace: 'nowrap',
  },
  layoutGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 380px',
    gap: '30px',
    alignItems: 'start',
    marginBottom: '40px',
  },
  leftCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  lecturePanel: {
    padding: '24px',
  },
  lectureTitle: {
    fontSize: '1.2rem',
    color: '#ffffff',
    marginBottom: '8px',
  },
  lectureMeta: {
    display: 'flex',
    gap: '8px',
    fontSize: '0.8rem',
    color: '#64748b',
    marginBottom: '16px',
  },
  lectureDesc: {
    fontSize: '0.85rem',
    color: '#94a3b8',
    lineHeight: '1.6',
    whiteSpace: 'pre-line',
  },
  reschedulePanel: {
    padding: '20px',
  },
  rescheduleHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
  },
  toggleBtn: {
    background: 'none',
    border: 'none',
    color: '#8b5cf6',
    fontWeight: '600',
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
  rescheduleForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginTop: '20px',
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
    paddingTop: '20px',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '16px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  formLabel: {
    fontSize: '0.8rem',
    color: '#94a3b8',
  },
  errorAlert: {
    padding: '10px 14px',
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '6px',
    color: '#f87171',
    fontSize: '0.8rem',
  },
  rightCol: {
    padding: '24px',
    maxHeight: '750px',
    overflowY: 'auto',
    position: 'sticky',
    top: '90px',
  },
  progressHeader: {
    marginBottom: '24px',
    paddingBottom: '16px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
  },
  curriculumHeading: {
    fontSize: '1.1rem',
    color: '#ffffff',
    marginBottom: '16px',
  },
  curriculumList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  curriculumItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    borderRadius: '8px',
    background: 'rgba(255, 255, 255, 0.01)',
    border: '1px solid rgba(255, 255, 255, 0.02)',
    transition: 'all 0.2s ease',
  },
  curriculumItemActive: {
    borderColor: 'rgba(139, 92, 246, 0.4)',
    background: 'rgba(139, 92, 246, 0.05)',
  },
  curriculumItemCompleted: {
    background: 'rgba(16, 185, 129, 0.01)',
  },
  checkBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkEmpty: {
    width: '16px',
    height: '16px',
    border: '2px solid #475569',
    borderRadius: '4px',
  },
  itemTextCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    flex: 1,
    cursor: 'pointer',
  },
  itemTitle: {
    fontSize: '0.8rem',
    fontWeight: '500',
    color: '#e2e8f0',
    textAlign: 'left',
  },
  itemTitleCompleted: {
    fontSize: '0.8rem',
    color: '#64748b',
    textDecoration: 'line-through',
    textAlign: 'left',
  },
  itemDuration: {
    fontSize: '0.7rem',
    color: '#64748b',
  },
  calendarContainer: {
    marginTop: '40px',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    height: '60vh',
    color: '#94a3b8',
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '60vh',
    color: '#94a3b8',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid rgba(139, 92, 246, 0.1)',
    borderTopColor: '#8b5cf6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
};

export default CourseViewer;
