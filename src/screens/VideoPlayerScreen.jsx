import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useFocusable, FocusContext, setFocus } from '@noriginmedia/norigin-spatial-navigation';
import { SERVER_URL } from '../config';

const VideoPlayerScreen = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const hasStartedRef = useRef(false);
  
  const [isIntro, setIsIntro] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(null);
  const [showOSD, setShowOSD] = useState(true);
  const [episodeIntro, setEpisodeIntro] = useState(null);
  const [showSkipSeriesIntro, setShowSkipSeriesIntro] = useState(false);
  const osdTimerRef = useRef(null);
  const hasAutoSkippedRef = useRef(false);

  const autoSkipSeries = localStorage.getItem('orlekino_auto_skip_series_intro') === 'true';
  const skipPlatformIntro = localStorage.getItem('orlekino_auto_skip_platform_intro') === 'true';

  const { ref: focusKeyRef, focusKey, focusSelf } = useFocusable();

  // state: { folder: string, filename: string, startPos: number }
  const folder = state?.folder || '';
  const filename = state?.filename || '';
  const startPos = state?.startPos || 0;
  const user = localStorage.getItem('orlekino_last_user');

  const encodedFolder = encodeURIComponent(folder);
  const encodedFile = encodeURIComponent(filename);
  const streamUrl = `${SERVER_URL}/stream/${encodedFolder}/${encodedFile}`;
  const introUrl = `${SERVER_URL}/intro.mp4`;

  useEffect(() => {
    if (skipPlatformIntro && isIntro) {
        setIsIntro(false);
        setShowOSD(false);
    }
  }, [skipPlatformIntro, isIntro]);

  const resetOSDTimer = useCallback(() => {
    setShowOSD(true);
    if (osdTimerRef.current) clearTimeout(osdTimerRef.current);
    osdTimerRef.current = setTimeout(() => setShowOSD(false), 5000);
  }, []);

  const skipIntro = useCallback(() => {
    if (isIntro) {
      setIsIntro(false);
      setShowOSD(false);
      setIsPlaying(true);
    }
  }, [isIntro]);

  const skipSeriesIntro = useCallback(() => {
    if (videoRef.current && episodeIntro) {
        videoRef.current.currentTime = episodeIntro.intro_end - 5;
        setShowSkipSeriesIntro(false);
        resetOSDTimer();
    }
  }, [episodeIntro, resetOSDTimer]);

  const saveProgress = useCallback(async () => {
    if (!videoRef.current || !user || isIntro) return;
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
  }, [user, folder, filename, isIntro]);

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
    resetOSDTimer();
  }, [resetOSDTimer]);

  const handleRewind = useCallback(() => {
    if (videoRef.current && !isIntro) {
        videoRef.current.currentTime -= 30;
    }
    resetOSDTimer();
  }, [resetOSDTimer, isIntro]);

  const handleFastForward = useCallback(() => {
    if (videoRef.current && !isIntro) {
        videoRef.current.currentTime += 30;
    }
    resetOSDTimer();
  }, [resetOSDTimer, isIntro]);

  const handleReplay = useCallback(() => {
    if (videoRef.current) {
        hasStartedRef.current = true; // Mark as started to prevent startPos override
        videoRef.current.currentTime = 0;
        videoRef.current.play();
        setIsPlaying(true);
    }
    resetOSDTimer();
  }, [resetOSDTimer]);

  useEffect(() => {
    const fetchIntro = async () => {
      try {
        const resp = await axios.get(`${SERVER_URL}/stream/${encodedFolder}/intro_data.json`);
        if (resp.data && resp.data[filename]) {
          setEpisodeIntro(resp.data[filename]);
        }
      } catch (e) {}
    };
    if (folder) fetchIntro();
  }, [folder, filename, encodedFolder]);

  useEffect(() => {
    if (episodeIntro && !isIntro) {
        const start = episodeIntro.intro_start - 5;
        const end = episodeIntro.intro_end;
        const inRange = currentTime >= start && currentTime <= end;
        
        if (autoSkipSeries && inRange && !hasAutoSkippedRef.current) {
            hasAutoSkippedRef.current = true;
            videoRef.current.currentTime = end - 5;
            setShowSkipSeriesIntro(false);
        } else {
            setShowSkipSeriesIntro(inRange);
        }
    }
  }, [currentTime, episodeIntro, isIntro, autoSkipSeries]);

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
    if (showOSD && !isIntro) {
        // When OSD appears, focus the central Play/Pause button
        const timer = setTimeout(() => {
            setFocus('PLAY_PAUSE_BUTTON');
        }, 100);
        return () => clearTimeout(timer);
    } else if (showSkipSeriesIntro && !showOSD) {
        const timer = setTimeout(() => {
            setFocus('SKIP_SERIES_BUTTON');
        }, 100);
        return () => clearTimeout(timer);
    }
  }, [showOSD, isIntro, showSkipSeriesIntro]);

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
          if (isIntro) {
            skipIntro();
          } else if (showSkipSeriesIntro) {
            skipSeriesIntro();
          } else if (!showOSD) {
            resetOSDTimer();
          }
          break;
        case 'MediaPlayPause':
          if (!isIntro) handlePlayPause();
          break;
        case 'ArrowRight':
        case 'MediaFastForward':
          if (isIntro) skipIntro();
          else if (!showOSD) resetOSDTimer();
          break;
        case 'ArrowLeft':
        case 'MediaRewind':
          if (isIntro) skipIntro();
          else if (!showOSD) resetOSDTimer();
          break;
        case 'ArrowUp':
        case 'ArrowDown':
          if (!isIntro && !showOSD) resetOSDTimer();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, saveProgress, showOSD, resetOSDTimer, handlePlayPause, isIntro, skipIntro]);

  const { ref: rewindRef, focused: rewindFocused } = useFocusable({
    focusKey: 'REWIND_BUTTON',
    onEnterPress: handleRewind,
    onFocus: resetOSDTimer
  });

  const { ref: playPauseRef, focused: playPauseFocused } = useFocusable({
    focusKey: 'PLAY_PAUSE_BUTTON',
    onEnterPress: handlePlayPause,
    onFocus: resetOSDTimer
  });

  const { ref: ffRef, focused: ffFocused } = useFocusable({
    focusKey: 'FF_BUTTON',
    onEnterPress: handleFastForward,
    onFocus: resetOSDTimer
  });

  const { ref: replayRef, focused: replayFocused } = useFocusable({
    focusKey: 'REPLAY_BUTTON',
    onEnterPress: handleReplay,
    onFocus: resetOSDTimer
  });

  const { ref: closeBtnRef, focused: closeBtnFocused } = useFocusable({
      focusKey: 'CLOSE_BUTTON',
      onEnterPress: () => {
          saveProgress().finally(() => navigate(-1));
      },
      onFocus: resetOSDTimer
  });

  const { ref: skipSeriesRef, focused: skipSeriesFocused } = useFocusable({
    focusKey: 'SKIP_SERIES_BUTTON',
    onEnterPress: skipSeriesIntro,
    onFocus: resetOSDTimer
  });

  return (
    <FocusContext.Provider value={focusKey}>
    <div ref={focusKeyRef} style={{ width: '100vw', height: '100vh', backgroundColor: 'black', position: 'relative', color: 'white', overflow: 'hidden' }}>
      
      {/* Background Video */}
      <video 
        key={isIntro ? 'intro' : 'main'}
        ref={videoRef}
        autoPlay
        playsInline
        src={isIntro ? introUrl : streamUrl}
        style={{ width: '100%', height: '100%' }}
        onPlaying={() => {
            setIsPlaying(true);
            if (!isIntro && startPos > 0 && videoRef.current && videoRef.current.currentTime < 1 && !hasStartedRef.current) {
                videoRef.current.currentTime = startPos;
                hasStartedRef.current = true;
            }
        }}
        onEnded={() => {
            if (isIntro) {
                skipIntro();
            } else {
                saveProgress().finally(() => navigate(-1));
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
      />
 
       {/* Error Overlay */}
       {error && (
         <ErrorOverlay error={error} onBack={() => navigate(-1)} />
       )}

        {/* Intro Skip Hint */}
        {isIntro && (
          <div style={{ position: 'absolute', bottom: '48px', right: '48px', backgroundColor: 'rgba(0,0,0,0.6)', padding: '16px 32px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)', zIndex: 100 }}>
             <span style={{ fontSize: '24px', fontWeight: 'bold' }}>Naciśnij OK, aby pominąć intro</span>
          </div>
        )}

        {showSkipSeriesIntro && !isIntro && !error && (
            <div 
                ref={skipSeriesRef}
                onClick={skipSeriesIntro}
                className={`focusable ${skipSeriesFocused ? 'focused' : ''}`}
                style={{ 
                    position: 'absolute', bottom: '48px', right: '48px', 
                    backgroundColor: skipSeriesFocused ? 'var(--primary)' : 'rgba(0,0,0,0.6)', 
                    padding: '16px 32px', borderRadius: '12px', 
                    border: '1px solid rgba(255,255,255,0.2)', zIndex: 170,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px',
                    transition: 'all 0.2s'
                }}
            >
                <span style={{ fontSize: '20px', fontWeight: 'bold' }}>⏭ POMIŃ INTRO</span>
            </div>
        )}
 
       {/* Custom OSD */}
       {showOSD && !error && !isIntro && (
         <>
         {/* Top Left Logo */}
         <div style={{ position: 'absolute', top: '48px', left: '48px', zIndex: 160, display: 'flex', alignItems: 'center', gap: '20px' }}>
            <img src="./logo.png" alt="Logo" style={{ width: '64px', height: '64px' }} />
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: 'rgba(255,255,255,0.7)', letterSpacing: '1px' }}>KINO POD ORŁEM</span>
         </div>

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
               <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '30px', marginTop: '10px' }}>
                   <ControlButton buttonRef={replayRef} icon="🔄" focused={replayFocused} onClick={handleReplay} />
                   <ControlButton buttonRef={rewindRef} icon="⏪" focused={rewindFocused} onClick={handleRewind} />
                   <ControlButton buttonRef={playPauseRef} icon={isPlaying ? "⏸" : "▶"} focused={playPauseFocused} onClick={handlePlayPause} />
                   <ControlButton buttonRef={ffRef} icon="⏩" focused={ffFocused} onClick={handleFastForward} />
                   <ControlButton buttonRef={closeBtnRef} icon="✕" focused={closeBtnFocused} onClick={() => saveProgress().finally(() => navigate(-1))} />
               </div>
           </div>
         </div>
         </>
       )}
    </div>
    </FocusContext.Provider>
  );
};

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
