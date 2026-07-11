import React, { useEffect, useState } from 'react';
import { useCourses } from '../context/CourseContext';
import CourseCard from '../components/CourseCard';

const Dashboard = () => {
  const { enrollments, loadingCourses, actionLoading, fetchEnrollments, importNewCourse } = useCourses();
  
  // Form State
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [scheduleMode, setScheduleMode] = useState('quota'); // 'quota' = videos/day, 'date' = target end date
  const [targetEndDate, setTargetEndDate] = useState('');
  const [videosPerDay, setVideosPerDay] = useState(1);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Fetch courses on mount
  useEffect(() => {
    fetchEnrollments();
  }, [fetchEnrollments]);

  const handleImport = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!youtubeUrl) {
      setFormError('Please enter a YouTube link');
      return;
    }

    try {
      const payload = {
        youtubeUrl,
        startDate: new Date(startDate).toISOString(),
        videosPerDay: scheduleMode === 'quota' ? videosPerDay : undefined,
        targetEndDate: scheduleMode === 'date' && targetEndDate ? new Date(targetEndDate).toISOString() : undefined
      };

      await importNewCourse(payload);
      setFormSuccess('Course successfully structured! Check it out below.');
      setYoutubeUrl('');
      setTargetEndDate('');
      setVideosPerDay(1);
    } catch (err) {
      setFormError(err.message || 'Failed to import playlist. Please check the URL.');
    }
  };

  const activeEnrollments = enrollments.filter(e => e.status !== 'completed');
  const completedEnrollments = enrollments.filter(e => e.status === 'completed');

  return (
    <div className="animate-fade-in" style={styles.container}>
      {/* 1. Importer Section */}
      <section className="glass-panel" style={styles.importerPanel}>
        <h2 style={styles.importerTitle}>🍿 Import YouTube Course</h2>
        <p style={styles.importerSubtitle}>
          Paste any YouTube playlist or video link to create a structured, distraction-free syllabus.
        </p>

        {formError && <div style={styles.errorAlert}>{formError}</div>}
        {formSuccess && <div style={styles.successAlert}>{formSuccess}</div>}

        <form onSubmit={handleImport} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>YouTube Video or Playlist URL</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="e.g. https://www.youtube.com/playlist?list=PL..." 
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              required
            />
          </div>

          <div style={styles.formGrid}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Start Study Date</label>
              <input 
                type="date" 
                className="input-field" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Plan Style</label>
              <select 
                className="input-field" 
                value={scheduleMode}
                onChange={(e) => setScheduleMode(e.target.value)}
                style={styles.select}
              >
                <option value="quota">Videos Per Day</option>
                <option value="date">Complete by Target Date</option>
              </select>
            </div>

            {scheduleMode === 'quota' ? (
              <div style={styles.inputGroup}>
                <label style={styles.label}>Videos To Watch Daily</label>
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
                <label style={styles.label}>Target Completion Date</label>
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

          <button 
            type="submit" 
            className="btn-primary" 
            style={styles.importBtn} 
            disabled={actionLoading}
          >
            {actionLoading ? (
              <>
                <div style={styles.spinner} />
                Parsing YouTube...
              </>
            ) : (
              'Create Structured Course'
            )}
          </button>
        </form>
      </section>

      {/* 2. Course Lists */}
      <section style={styles.coursesSection}>
        <h2 style={styles.sectionHeading}>Active Courses</h2>
        
        {loadingCourses && enrollments.length === 0 ? (
          <div style={styles.loadingState}>
            <div style={styles.spinnerLarge} />
            <span>Loading courses...</span>
          </div>
        ) : activeEnrollments.length === 0 ? (
          <div className="glass-panel" style={styles.emptyState}>
            <h3>No Active Courses Yet</h3>
            <p>Paste a YouTube link above to start learning without distractions!</p>
          </div>
        ) : (
          <div style={styles.grid}>
            {activeEnrollments.map(enroll => (
              <div key={enroll._id} className="animate-fade-in">
                <CourseCard enrollment={enroll} />
              </div>
            ))}
          </div>
        )}

        {completedEnrollments.length > 0 && (
          <div style={{ marginTop: '50px' }}>
            <h2 style={styles.sectionHeading}>Completed Courses 🎉</h2>
            <div style={styles.grid}>
              {completedEnrollments.map(enroll => (
                <div key={enroll._id} className="animate-fade-in">
                  <CourseCard enrollment={enroll} />
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px 0',
  },
  importerPanel: {
    padding: '30px',
    marginBottom: '40px',
  },
  importerTitle: {
    fontSize: '1.4rem',
    color: '#ffffff',
    marginBottom: '8px',
  },
  importerSubtitle: {
    color: '#94a3b8',
    fontSize: '0.85rem',
    marginBottom: '24px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '0.85rem',
    color: '#e2e8f0',
    fontWeight: '500',
  },
  select: {
    cursor: 'pointer',
    appearance: 'none',
  },
  importBtn: {
    alignSelf: 'flex-start',
    padding: '12px 28px',
    marginTop: '10px',
  },
  coursesSection: {
    marginTop: '20px',
  },
  sectionHeading: {
    fontSize: '1.3rem',
    color: '#ffffff',
    marginBottom: '20px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    paddingBottom: '10px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '30px',
  },
  loadingState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    padding: '60px 0',
    color: '#94a3b8',
  },
  spinner: {
    width: '18px',
    height: '18px',
    border: '2px solid rgba(255,255,255,0.2)',
    borderTopColor: '#ffffff',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  spinnerLarge: {
    width: '40px',
    height: '40px',
    border: '4px solid rgba(139, 92, 246, 0.1)',
    borderTopColor: '#8b5cf6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  emptyState: {
    padding: '50px',
    textAlign: 'center',
    color: '#94a3b8',
  },
  errorAlert: {
    padding: '12px 16px',
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '8px',
    color: '#f87171',
    fontSize: '0.85rem',
    marginBottom: '20px',
  },
  successAlert: {
    padding: '12px 16px',
    background: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    borderRadius: '8px',
    color: '#34d399',
    fontSize: '0.85rem',
    marginBottom: '20px',
  },
};

export default Dashboard;
