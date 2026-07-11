import React from 'react';
import { Link } from 'react-router-dom';

const CourseCard = ({ enrollment }) => {
  const { course, completedVideos, status, targetEndDate } = enrollment;
  
  const totalVideos = course.videos.length;
  const completedCount = completedVideos ? completedVideos.length : 0;
  const progressPercent = totalVideos > 0 ? Math.round((completedCount / totalVideos) * 100) : 0;

  const formattedDate = targetEndDate 
    ? new Date(targetEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Not Scheduled';

  return (
    <div className="glass-panel" style={styles.card}>
      <div style={styles.thumbnailContainer}>
        {course.thumbnailUrl ? (
          <img src={course.thumbnailUrl} alt={course.title} style={styles.thumbnail} />
        ) : (
          <div style={styles.thumbnailPlaceholder}>No Thumbnail</div>
        )}
        <span style={status === 'completed' ? styles.statusBadgeCompleted : styles.statusBadgeActive}>
          {status === 'completed' ? 'Completed' : 'In Progress'}
        </span>
      </div>

      <div style={styles.content}>
        <div style={styles.metaRow}>
          <span style={styles.typeBadge}>{course.type === 'playlist' ? 'Playlist Course' : 'Single Video'}</span>
          <span style={styles.count}>{completedCount}/{totalVideos} Videos</span>
        </div>

        <h3 style={styles.title} title={course.title}>{course.title}</h3>
        
        <div style={styles.progressSection}>
          <div style={styles.progressTextRow}>
            <span>Progress</span>
            <span style={{ fontWeight: '600', color: progressPercent === 100 ? '#10b981' : '#f8fafc' }}>
              {progressPercent}%
            </span>
          </div>
          <div className="progress-bar-container">
            <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        <div style={styles.footer}>
          <div style={styles.dateGroup}>
            <span style={styles.dateLabel}>Complete by:</span>
            <span style={styles.dateValue}>{formattedDate}</span>
          </div>
          <Link to={`/course/${course._id}`} className="btn-primary" style={styles.btn}>
            Study
          </Link>
        </div>
      </div>
    </div>
  );
};

const styles = {
  card: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    height: '100%',
    transition: 'transform 0.2s ease, border-color 0.2s ease',
  },
  thumbnailContainer: {
    height: '160px',
    position: 'relative',
    width: '100%',
    backgroundColor: '#0f172a',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  thumbnailPlaceholder: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    color: '#64748b',
    fontSize: '0.9rem',
  },
  statusBadgeActive: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    background: 'rgba(245, 158, 11, 0.9)',
    color: '#0b0f19',
    fontSize: '0.75rem',
    fontWeight: '700',
    padding: '4px 10px',
    borderRadius: '12px',
  },
  statusBadgeCompleted: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    background: 'rgba(16, 185, 129, 0.95)',
    color: '#ffffff',
    fontSize: '0.75rem',
    fontWeight: '700',
    padding: '4px 10px',
    borderRadius: '12px',
    boxShadow: '0 0 10px rgba(16, 185, 129, 0.3)',
  },
  content: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
  metaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  typeBadge: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#8b5cf6',
    background: 'rgba(139, 92, 246, 0.1)',
    padding: '3px 8px',
    borderRadius: '6px',
  },
  count: {
    fontSize: '0.8rem',
    color: '#94a3b8',
  },
  title: {
    fontSize: '1.1rem',
    lineHeight: '1.4',
    marginBottom: '16px',
    color: '#f8fafc',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    height: '42px',
  },
  progressSection: {
    marginBottom: '20px',
  },
  progressTextRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.8rem',
    color: '#94a3b8',
    marginBottom: '6px',
  },
  footer: {
    marginTop: 'auto',
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
    paddingTop: '14px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  dateLabel: {
    fontSize: '0.7rem',
    color: '#64748b',
  },
  dateValue: {
    fontSize: '0.8rem',
    fontWeight: '500',
    color: '#e2e8f0',
  },
  btn: {
    padding: '8px 16px',
    fontSize: '0.85rem',
  },
};

export default CourseCard;
