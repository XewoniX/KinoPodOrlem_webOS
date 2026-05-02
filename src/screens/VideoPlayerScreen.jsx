import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useFocusable, FocusContext } from '@noriginmedia/norigin-spatial-navigation';
import { SERVER_URL } from '../config';

const VideoPlayerScreen = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(null);
  const [showOSD, setShowOSD] = useState(true);
  const osdTimerRef = useRef(null);

  const { ref: focusKeyRef, focusKey, focusSelf } = useFocusable();

  // state: { folder: string, filename: string, startPos: number }
  const folder = state?.folder || '';
  const filename = state?.filename || '';
  const startPos = state?.startPos || 0;
  const user = localStorage.getItem('orlekino_last_user');

  const encodedFolder = encodeURIComponent(folder);
  const encodedFile = encodeURIComponent(filename);
  const streamUrl = `${SERVER_URL}/stream/${encodedFolder}/${encodedFile}`;

  const saveProgress = useCallback(async () => {
    if (!videoRef.current || !user) return;
    const pos = videoRef.current.currentTime;
    const dur = videoRef.current.duration;
    if (dur > 0) {
        try {
            await axios.post(`${SERVER_URL}/update_progress`, {
                user,
                folder,
                filename,
                position: pos,
                duration: dur
            }, { timeout: 2000 });
        } catch (e) {
            console.warn('Progress save error', e);
        }
    }
  }, [user, folder, filename]);

  const toggleOSD = useCallback(() => {
    setShowOSD(true);
    if (osdTimerRef.current) clearTimeout(osdTimerRef.current);
    osdTimerRef.current = setTimeout(() => setShowOSD(false), 5000);
    focusSelf();
  }, [focusSelf]);

  useEffect(() => {
    // Initial OSD hide
    osdTimerRef.current = setTimeout(() => setShowOSD(false), 5000);
    
    // Auto-save interval (every 10 seconds)
    const interval = setInterval(saveProgress, 10000);
    
    return () => {
        if (osdTimerRef.current) clearTimeout(osdTimerRef.current);
        clearInterval(interval);
        saveProgress(); // Final save on exit
    };
  }, [saveProgress]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Handle Back button for WebOS (keyCode 461)
      if (e.keyCode === 461 || e.key === 'Backspace' || e.key === 'GoBack') {
          e.preventDefault();
          e.stopPropagation();
          saveProgress().finally(() => navigate(-1));
          return;
      }

      switch (e.key) {
        case 'Enter':
          if (!showOSD) {
              toggleOSD();
          } else {
              // If OSD is visible, Enter might be handled by focused element (Close button)
          }
          break;
        case 'MediaPlayPause':
          if (videoRef.current) {
            if (videoRef.current.paused) {
              videoRef.current.play().catch(err => setError("Błąd startu: " + err.message));
              setIsPlaying(true);
            } else {
              videoRef.current.pause();
              setIsPlaying(false);
              setShowOSD(true); // Show OSD when paused
            }
          }
          break;
        case 'ArrowRight':
        case 'MediaFastForward':
          if (videoRef.current) videoRef.current.currentTime += 30;
          toggleOSD();
          break;
        case 'ArrowLeft':
        case 'MediaRewind':
          if (videoRef.current) videoRef.current.currentTime -= 30;
          toggleOSD();
          break;
        case 'ArrowUp':
        case 'ArrowDown':
          toggleOSD();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, saveProgress, showOSD, toggleOSD]);

  const { ref: closeBtnRef, focused: closeBtnFocused } = useFocusable({
      focusKey: 'CLOSE_BUTTON',
      onEnterPress: () => saveProgress().finally(() => navigate(-1))
  });

  return (
    <FocusContext.Provider value={focusKey}>
    <div ref={focusKeyRef} style={{ width: '100vw', height: '100vh', backgroundColor: 'black', position: 'relative', color: 'white', overflow: 'hidden' }}>
      
      {/* Background Video */}
      <video 
        ref={videoRef}
        autoPlay
        playsInline
        style={{ width: '100%', height: '100%' }}
        onPlaying={() => {
            setIsPlaying(true);
            if (startPos > 0 && videoRef.current && videoRef.current.currentTime < 1) {
                videoRef.current.currentTime = startPos;
            }
        }}
        onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
        onError={(e) => {
            const videoErr = videoRef.current?.error;
            let msg = 'Nieznany błąd odtwarzacza';
            if (videoErr) {
                if (videoErr.code === 3) msg = 'Błąd dekodowania - brak wsparcia dla kodeka.';
                else if (videoErr.code === 4) msg = 'Format nieobsługiwany.';
                else msg = `Błąd wideo (kod ${videoErr.code})`;
            }
            setError(msg);
        }}
      >
          <source src={streamUrl} type="video/mp4" />
          <source src={streamUrl} type="video/x-matroska" />
      </video>

      {/* Error Overlay */}
      {error && (
        <div style={{
          position: 'absolute', top: '0', left: '0', width: '100%', height: '100%',
          backgroundColor: 'rgba(50,0,0,0.9)', display: 'flex', flexDirection: 'column', 
          justifyContent: 'center', alignItems: 'center', padding: '40px', textAlign: 'center', zIndex: 200
        }}>
          <h1 style={{ color: '#ff4444', marginBottom: '24px' }}>BŁĄD ODTWARZANIA</h1>
          <p style={{ fontSize: '24px', marginBottom: '40px' }}>{error}</p>
          <button 
            onClick={() => navigate(-1)}
            className="focusable focused"
            style={{ padding: '20px 48px', fontSize: '24px', backgroundColor: 'white', border: 'none', borderRadius: '12px' }}
          >
            POWRÓT DO MENU
          </button>
        </div>
      )}

      {/* Custom OSD */}
      {showOSD && !error && (
        <div style={{
          position: 'absolute', bottom: '0', left: '0', width: '100%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)', 
          padding: '40px', display: 'flex', flexDirection: 'column', gap: '20px', zIndex: 150,
          transition: 'opacity 0.5s ease-in-out'
        }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <h2 style={{ color: 'white', fontSize: '32px', marginBottom: '10px' }}>{filename}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <span style={{ fontSize: '20px', color: '#aaa' }}>
                        {Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')}
                    </span>
                    <div style={{ flex: 1, height: '8px', backgroundColor: '#333', borderRadius: '4px', position: 'relative' }}>
                        <div style={{ width: `${(currentTime / duration) * 100}%`, height: '100%', backgroundColor: 'var(--primary)', borderRadius: '4px' }} />
                    </div>
                    <span style={{ fontSize: '20px', color: '#aaa' }}>
                        {Math.floor(duration / 60)}:{Math.floor(duration % 60).toString().padStart(2, '0')}
                    </span>
                </div>
              </div>

              {/* Close Button */}
              <div 
                ref={closeBtnRef}
                className={`focusable ${closeBtnFocused ? 'focused' : ''}`}
                style={{
                    width: '80px', height: '80px', borderRadius: '40px', backgroundColor: closeBtnFocused ? 'red' : 'rgba(255,255,255,0.1)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', marginLeft: '40px', cursor: 'pointer',
                    fontSize: '40px', fontWeight: 'bold', color: 'white', transition: 'all 0.2s'
                }}
              >
                  ✕
              </div>
          </div>
        </div>
      )}
    </div>
    </FocusContext.Provider>
  );
};

export default VideoPlayerScreen;
