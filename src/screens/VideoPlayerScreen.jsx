import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SERVER_URL } from '../config';

const VideoPlayerScreen = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(null);

  // state: { folder: string, filename: string, startPos: number }
  const folder = state?.folder || '';
  const filename = state?.filename || '';
  const startPos = state?.startPos || 0;

  // IMPORTANT: For WebOS 3.5, we try to avoid double encoding if possible, 
  // but Flask path needs the slashes to be part of the path.
  const encodedFolder = encodeURIComponent(folder);
  const encodedFile = encodeURIComponent(filename);
  const streamUrl = `${SERVER_URL}/stream/${encodedFolder}/${encodedFile}`;

  useEffect(() => {
    const handleKeyDown = (e) => {
      console.log("Player Key:", e.key, e.keyCode);
      
      // Handle Back button for WebOS (keyCode 461)
      if (e.keyCode === 461 || e.key === 'Backspace' || e.key === 'Escape' || e.key === 'GoBack') {
          e.preventDefault();
          e.stopPropagation();
          navigate(-1);
          return;
      }

      switch (e.key) {
        case 'Enter':
        case 'MediaPlayPause':
          if (videoRef.current) {
            if (videoRef.current.paused) {
              videoRef.current.play().catch(err => setError("Błąd startu: " + err.message));
              setIsPlaying(true);
            } else {
              videoRef.current.pause();
              setIsPlaying(false);
            }
          }
          break;
        case 'ArrowRight':
        case 'MediaFastForward':
          if (videoRef.current) videoRef.current.currentTime += 30;
          break;
        case 'ArrowLeft':
        case 'MediaRewind':
          if (videoRef.current) videoRef.current.currentTime -= 30;
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: 'black', position: 'relative', color: 'white' }}>
      
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
        onLoadedMetadata={() => {
            setDuration(videoRef.current?.duration || 0);
        }}
        onError={(e) => {
            const videoErr = videoRef.current?.error;
            let msg = 'Nieznany błąd odtwarzacza';
            if (videoErr) {
                if (videoErr.code === 1) msg = 'Pobieranie przerwane';
                else if (videoErr.code === 2) msg = 'Błąd sieci';
                else if (videoErr.code === 3) msg = 'Błąd dekodowania - brak wsparcia dla kodeka.';
                else if (videoErr.code === 4) msg = 'Format nieobsługiwany.';
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
          <p style={{ fontSize: '24px', marginBottom: '40px', maxWidth: '800px' }}>{error}</p>
          <p style={{ fontSize: '16px', color: '#aaa', marginBottom: '40px' }}>
              Jeśli widzisz "Błąd dekodowania", Twój telewizor nie potrafi odtworzyć tego konkretnego pliku bez transkodowania.
          </p>
          <button 
            onClick={() => navigate(-1)}
            className="focusable focused"
            style={{ 
                padding: '20px 48px', fontSize: '24px', backgroundColor: 'white', 
                border: 'none', borderRadius: '12px', cursor: 'pointer' 
            }}
          >
            POWRÓT DO MENU
          </button>
        </div>
      )}

      {/* Custom OSD */}
      {!isPlaying && !error && (
        <div style={{
          position: 'absolute', bottom: '10%', left: '10%', right: '10%',
          backgroundColor: 'rgba(0,0,0,0.8)', padding: '32px', borderRadius: '16px',
          display: 'flex', flexDirection: 'column', gap: '20px'
        }}>
          <h2 style={{ color: 'white', fontSize: '32px' }}>{filename}</h2>
          <div style={{ width: '100%', height: '12px', backgroundColor: '#333', borderRadius: '6px' }}>
             <div style={{ width: `${(currentTime / duration) * 100}%`, height: '100%', backgroundColor: 'var(--primary)', borderRadius: '6px' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#aaa', fontSize: '24px' }}>
            <span>{Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')}</span>
            <span>{Math.floor(duration / 60)}:{Math.floor(duration % 60).toString().padStart(2, '0')}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayerScreen;
