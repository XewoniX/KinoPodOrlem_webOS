import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useFocusable, FocusContext, setFocus } from '@noriginmedia/norigin-spatial-navigation';
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
  }, []);

  const handlePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch(err => setError("Błąd startu: " + err.message));
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
        setShowOSD(true);
      }
    }
  }, []);

  const handleRewind = useCallback(() => {
    if (videoRef.current) {
        videoRef.current.currentTime -= 30;
    }
    toggleOSD();
  }, [toggleOSD]);

  const handleFastForward = useCallback(() => {
    if (videoRef.current) {
        videoRef.current.currentTime += 30;
    }
    toggleOSD();
  }, [toggleOSD]);

  useEffect(() => {
    // Focus the screen/container on mount
    focusSelf();
    
    // Initial OSD hide timer
    osdTimerRef.current = setTimeout(() => setShowOSD(false), 5000);
    
    const interval = setInterval(saveProgress, 10000);
    
    return () => {
        if (osdTimerRef.current) clearTimeout(osdTimerRef.current);
        clearInterval(interval);
        saveProgress();
    };
  }, [saveProgress, focusSelf]);

  useEffect(() => {
    if (showOSD) {
        // When OSD appears, focus the central Play/Pause button
        const timer = setTimeout(() => {
            setFocus('PLAY_PAUSE_BUTTON');
        }, 100);
        return () => clearTimeout(timer);
    }
  }, [showOSD]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Handle back button specifically for webOS
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
          }
          break;
        case 'MediaPlayPause':
          handlePlayPause();
          break;
        case 'ArrowRight':
        case 'MediaFastForward':
          if (!showOSD) toggleOSD();
          break;
        case 'ArrowLeft':
        case 'MediaRewind':
          if (!showOSD) toggleOSD();
          break;
        case 'ArrowUp':
        case 'ArrowDown':
          if (!showOSD) toggleOSD();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, saveProgress, showOSD, toggleOSD, handlePlayPause]);

  const { ref: rewindRef, focused: rewindFocused } = useFocusable({
    focusKey: 'REWIND_BUTTON',
    onEnterPress: handleRewind
  });

  const { ref: playPauseRef, focused: playPauseFocused } = useFocusable({
    focusKey: 'PLAY_PAUSE_BUTTON',
    onEnterPress: handlePlayPause
  });

  const { ref: ffRef, focused: ffFocused } = useFocusable({
    focusKey: 'FF_BUTTON',
    onEnterPress: handleFastForward
  });

  const { ref: closeBtnRef, focused: closeBtnFocused } = useFocusable({
      focusKey: 'CLOSE_BUTTON',
      onEnterPress: () => {
          saveProgress().finally(() => navigate(-1));
      }
  });

  const ControlButton = ({ buttonRef, focused, icon, onClick, style = {} }) => (
    <div 
        ref={buttonRef}
        tabIndex={0}
        onClick={onClick}
        className={`focusable ${focused ? 'focused' : ''}`}
        style={{
            width: '80px', height: '80px', borderRadius: '40px', 
            backgroundColor: focused ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer',
            fontSize: '32px', color: 'white', transition: 'all 0.2s', outline: 'none',
            ...style
        }}
    >
        {icon}
    </div>
  );

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
                if (videoErr.code === 3) msg = 'Błąd dekodowania - brak wsparcia kodeka.';
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
         <ErrorOverlay error={error} onBack={() => navigate(-1)} />
       )}
 
       {/* Custom OSD */}
       {showOSD && !error && (
         <div style={{
           position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', 
           width: '85%', 
           background: 'rgba(0,0,0,0.9)', border: '1px solid rgba(255,255,255,0.1)',
           padding: '40px', borderRadius: '32px', display: 'flex', flexDirection: 'column', gap: '20px', zIndex: 150,
           boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
         }}>
           
           <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
               <h2 style={{ color: 'white', fontSize: '28px', marginBottom: '5px', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{filename}</h2>
               
               {/* Progress Bar Row */}
               <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                   <span style={{ fontSize: '20px', color: '#aaa', minWidth: '70px' }}>
                       {Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')}
                   </span>
                   <div style={{ flex: 1, height: '8px', backgroundColor: '#333', borderRadius: '4px', position: 'relative' }}>
                       <div style={{ width: `${(currentTime / duration) * 100}%`, height: '100%', backgroundColor: 'var(--primary)', borderRadius: '4px' }} />
                   </div>
                   <span style={{ fontSize: '20px', color: '#aaa', minWidth: '70px', textAlign: 'right' }}>
                       {Math.floor(duration / 60)}:{Math.floor(duration % 60).toString().padStart(2, '0')}
                   </span>
               </div>
 
               {/* Controls Row */}
               <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '40px', marginTop: '10px' }}>
                   <ControlButton buttonRef={rewindRef} icon="⏪" focused={rewindFocused} onClick={handleRewind} />
                   <ControlButton buttonRef={playPauseRef} icon={isPlaying ? "⏸" : "▶"} focused={playPauseFocused} onClick={handlePlayPause} />
                   <ControlButton buttonRef={ffRef} icon="⏩" focused={ffFocused} onClick={handleFastForward} />
                   <ControlButton buttonRef={closeBtnRef} icon="✕" focused={closeBtnFocused} onClick={() => saveProgress().finally(() => navigate(-1))} style={{ marginLeft: '40px' }} />
               </div>
           </div>
         </div>
       )}
    </div>
    </FocusContext.Provider>
  );
};

const ErrorOverlay = ({ error, onBack }) => {
    const { ref, focused, focusSelf } = useFocusable({
        focusKey: 'ERROR_BACK_BUTTON',
        onEnterPress: onBack
    });

    useEffect(() => {
        focusSelf();
    }, [focusSelf]);

    return (
        <div style={{
          position: 'absolute', top: '0', left: '0', width: '100%', height: '100%',
          backgroundColor: 'rgba(50,0,0,0.9)', display: 'flex', flexDirection: 'column', 
          justifyContent: 'center', alignItems: 'center', padding: '40px', textAlign: 'center', zIndex: 200
        }}>
          <h1 style={{ color: '#ff4444', marginBottom: '24px' }}>BŁĄD ODTWARZANIA</h1>
          <p style={{ fontSize: '24px', marginBottom: '40px' }}>{error}</p>
          <div 
            ref={ref}
            onClick={onBack}
            className={`focusable ${focused ? 'focused' : ''}`}
            style={{ 
                padding: '20px 48px', fontSize: '24px', 
                backgroundColor: focused ? 'var(--primary)' : 'white', 
                color: focused ? 'white' : 'black',
                border: 'none', borderRadius: '12px', cursor: 'pointer' 
            }}
          >
            POWRÓT DO MENU
          </div>
        </div>
    );
};

export default VideoPlayerScreen;
