import React, { useEffect, useRef, useState } from 'react';

const VideoPlayer = ({ videoId, onVideoEnd }) => {
  const playerRef = useRef(null);
  const iframeContainerId = 'youtube-iframe-player';
  const isMock = videoId && videoId.startsWith('mock_');
  const [mockProgress, setMockProgress] = useState(0);
  const [mockPlaying, setMockPlaying] = useState(false);
  
  // Track player instance across renders
  const playerInstance = useRef(null);

  // 1. YouTube IFrame API Loader for Real Videos
  useEffect(() => {
    if (isMock) {
      // Reset mock states on change
      setMockProgress(0);
      setMockPlaying(false);
      return;
    }

    let apiLoaded = false;
    
    // Check if script is already present
    const scripts = document.getElementsByTagName('script');
    for (let i = 0; i < scripts.length; i++) {
      if (scripts[i].src === 'https://www.youtube.com/iframe_api') {
        apiLoaded = true;
        break;
      }
    }

    if (!apiLoaded) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    // Handler when API is ready
    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) return;
      
      // If player already exists, just load new video
      if (playerInstance.current) {
        try {
          playerInstance.current.loadVideoById(videoId);
          return;
        } catch (e) {
          console.error('Error reloading video:', e);
        }
      }

      playerInstance.current = new window.YT.Player(iframeContainerId, {
        videoId: videoId,
        playerVars: {
          rel: 0,             // Don't show related videos from other channels
          modestbranding: 1,  // Hide YouTube logo in control bar
          autoplay: 1,        // Autoplay video
          controls: 1,        // Show player controls
        },
        events: {
          onStateChange: (event) => {
            // YT.PlayerState.ENDED is 0
            if (event.data === 0 && onVideoEnd) {
              console.log('Real video ended. Triggering completion callback...');
              onVideoEnd(videoId);
            }
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      // Global callback called by YouTube API
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    // If script was already loaded, bind check interval in case the callback doesn't fire
    const interval = setInterval(() => {
      if (window.YT && window.YT.Player && !playerInstance.current) {
        initPlayer();
        clearInterval(interval);
      }
    }, 500);

    return () => {
      clearInterval(interval);
    };
  }, [videoId, isMock]);

  // Clean up player on unmount
  useEffect(() => {
    return () => {
      if (playerInstance.current && typeof playerInstance.current.destroy === 'function') {
        playerInstance.current.destroy();
        playerInstance.current = null;
      }
    };
  }, []);

  // 2. Mock playback simulator for offline runs
  useEffect(() => {
    if (!isMock || !mockPlaying) return;

    const timer = setInterval(() => {
      setMockProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          setMockPlaying(false);
          if (onVideoEnd) {
            console.log('Mock playback completed. Triggering callback...');
            onVideoEnd(videoId);
          }
          return 100;
        }
        return prev + 10; // complete mock video in 10 steps (10 seconds)
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [mockPlaying, isMock, videoId, onVideoEnd]);

  if (!videoId) {
    return (
      <div style={styles.placeholderContainer}>
        <span style={styles.placeholderText}>Select a lecture to start learning</span>
      </div>
    );
  }

  if (isMock) {
    return (
      <div style={styles.playerWrapper}>
        <div style={styles.mockPlayerContainer}>
          <div style={styles.mockContent}>
            <h4 style={{ color: '#8b5cf6', marginBottom: '8px' }}>🤖 FocusTube Mock Video Sandbox</h4>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '20px' }}>
              You are viewing a mock playlist imported offline. Watch controls simulate video watching.
            </p>
            
            <div style={styles.simulationControl}>
              <button 
                onClick={() => setMockPlaying(!mockPlaying)} 
                className="btn-primary" 
                style={styles.simBtn}
              >
                {mockPlaying ? 'Pause Simulation' : mockProgress === 100 ? 'Replay Simulation' : 'Start Watch Simulation (10s)'}
              </button>
              
              <button 
                onClick={() => {
                  setMockProgress(100);
                  setMockPlaying(false);
                  if (onVideoEnd) onVideoEnd(videoId);
                }} 
                className="btn-secondary" 
                style={styles.skipBtn}
              >
                Instantly Complete Lecture
              </button>
            </div>

            <div style={{ marginTop: '24px', width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>
                <span>Simulating Playback Progress</span>
                <span>{mockProgress}%</span>
              </div>
              <div className="progress-bar-container">
                <div className="progress-bar-fill" style={{ width: `${mockProgress}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.playerWrapper}>
      <div style={styles.videoRatioBox}>
        <div id={iframeContainerId} style={styles.iframeContainer} />
      </div>
    </div>
  );
};

const styles = {
  placeholderContainer: {
    height: '420px',
    background: 'rgba(15, 23, 42, 0.4)',
    border: '1px dashed rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#64748b',
    fontSize: '1rem',
  },
  playerWrapper: {
    width: '100%',
    borderRadius: '16px',
    overflow: 'hidden',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
  },
  videoRatioBox: {
    position: 'relative',
    paddingBottom: '56.25%', // 16:9 Aspect Ratio
    height: 0,
    overflow: 'hidden',
    background: '#000000',
  },
  iframeContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  mockPlayerContainer: {
    height: '420px',
    background: 'linear-gradient(135deg, #131a2b 0%, #0b0f19 100%)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '40px',
  },
  mockContent: {
    maxWidth: '450px',
    width: '100%',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  simulationControl: {
    display: 'flex',
    gap: '12px',
    width: '100%',
    justifyContent: 'center',
  },
  simBtn: {
    padding: '10px 16px',
    fontSize: '0.85rem',
  },
  skipBtn: {
    padding: '10px 16px',
    fontSize: '0.85rem',
  },
};

export default VideoPlayer;
