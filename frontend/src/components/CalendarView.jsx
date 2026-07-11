import React from 'react';

const CalendarView = ({ schedule, completedVideos = [], videos = [], activeVideoId, onSelectVideo, onToggleComplete }) => {
  // Helper to map video metadata by youtubeId
  const videoMap = React.useMemo(() => {
    const map = {};
    videos.forEach(v => {
      map[v.youtubeId] = v;
    });
    return map;
  }, [videos]);

  const formatDateLabel = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0,0,0,0);
    const compareDate = new Date(date);
    compareDate.setHours(0,0,0,0);

    if (today.getTime() === compareDate.getTime()) {
      return 'Today';
    }
    
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    if (tomorrow.getTime() === compareDate.getTime()) {
      return 'Tomorrow';
    }

    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const isToday = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  if (!schedule || schedule.length === 0) {
    return (
      <div style={styles.emptyContainer}>
        <p style={{ color: '#64748b' }}>No schedule generated. Please set a target calendar date.</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.heading}>📅 Personal Study Calendar</h3>
      <div style={styles.timeline}>
        {schedule.map((day, idx) => {
          const dayIsToday = isToday(day.date);
          
          // Calculate if all videos for this day are completed
          const dayVideos = day.videoYoutubeIds || [];
          const completedDayVideosCount = dayVideos.filter(id => completedVideos.includes(id)).length;
          const isDayFullyCompleted = dayVideos.length > 0 && completedDayVideosCount === dayVideos.length;

          return (
            <div key={idx} style={dayIsToday ? styles.dayRowToday : styles.dayRow}>
              <div style={styles.dateCol}>
                <span style={dayIsToday ? styles.dateTextToday : styles.dateText}>
                  {formatDateLabel(day.date)}
                </span>
                {isDayFullyCompleted && (
                  <span style={styles.completedDayBadge}>Done ✨</span>
                )}
              </div>

              <div style={styles.videosCol}>
                {dayVideos.map(vidId => {
                  const video = videoMap[vidId];
                  if (!video) return null;

                  const isCompleted = completedVideos.includes(vidId);
                  const isActive = activeVideoId === vidId;

                  return (
                    <div 
                      key={vidId} 
                      style={{
                        ...styles.videoItem,
                        ...(isActive ? styles.videoItemActive : {}),
                        ...(isCompleted ? styles.videoItemCompleted : {})
                      }}
                    >
                      <button 
                        onClick={() => onToggleComplete(vidId)} 
                        style={styles.checkboxBtn}
                        title={isCompleted ? "Mark incomplete" : "Mark complete"}
                      >
                        {isCompleted ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : (
                          <div style={styles.checkboxEmpty} />
                        )}
                      </button>

                      <div 
                        onClick={() => onSelectVideo(vidId)} 
                        style={styles.videoDetails}
                        role="button"
                      >
                        <span style={isCompleted ? styles.videoTitleCompleted : styles.videoTitle}>
                          {video.title}
                        </span>
                        <span style={styles.duration}>
                          {Math.floor(video.duration / 60)}m
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '24px',
  },
  heading: {
    fontSize: '1.2rem',
    color: '#ffffff',
    marginBottom: '20px',
  },
  timeline: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  dayRow: {
    display: 'grid',
    gridTemplateColumns: '150px 1fr',
    gap: '20px',
    padding: '16px',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    borderRadius: '12px',
    alignItems: 'start',
  },
  dayRowToday: {
    display: 'grid',
    gridTemplateColumns: '150px 1fr',
    gap: '20px',
    padding: '16px',
    background: 'rgba(139, 92, 246, 0.06)',
    border: '1.5px solid rgba(139, 92, 246, 0.3)',
    boxShadow: '0 0 15px rgba(139, 92, 246, 0.05)',
    borderRadius: '12px',
    alignItems: 'start',
  },
  dateCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  dateText: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#94a3b8',
  },
  dateTextToday: {
    fontSize: '0.95rem',
    fontWeight: '700',
    color: '#8b5cf6',
  },
  completedDayBadge: {
    fontSize: '0.7rem',
    fontWeight: '600',
    color: '#10b981',
    background: 'rgba(16, 185, 129, 0.1)',
    alignSelf: 'flex-start',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  videosCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  videoItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 14px',
    background: 'rgba(15, 23, 42, 0.3)',
    border: '1px solid rgba(255, 255, 255, 0.03)',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
  },
  videoItemActive: {
    borderColor: 'rgba(139, 92, 246, 0.4)',
    background: 'rgba(139, 92, 246, 0.04)',
  },
  videoItemCompleted: {
    background: 'rgba(16, 185, 129, 0.02)',
  },
  checkboxBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxEmpty: {
    width: '18px',
    height: '18px',
    border: '2px solid #475569',
    borderRadius: '4px',
    transition: 'border-color 0.2s ease',
  },
  videoDetails: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
    cursor: 'pointer',
  },
  videoTitle: {
    fontSize: '0.85rem',
    color: '#e2e8f0',
    fontWeight: '500',
    textAlign: 'left',
  },
  videoTitleCompleted: {
    fontSize: '0.85rem',
    color: '#64748b',
    textDecoration: 'line-through',
    textAlign: 'left',
  },
  duration: {
    fontSize: '0.75rem',
    color: '#64748b',
    background: 'rgba(255, 255, 255, 0.03)',
    padding: '2px 6px',
    borderRadius: '4px',
    marginLeft: '12px',
  },
  emptyContainer: {
    padding: '30px',
    textAlign: 'center',
  },
};

export default CalendarView;
