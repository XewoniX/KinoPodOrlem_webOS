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

  const encodedFolder = encodeURIComponent(folder);
  const encodedFile = encodeURIComponent(filename);
  const streamUrl = `${SERVER_URL}/stream/${encodedFolder}/${encodedFile}`;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!videoRef.current) return;
      
      switch (e.key) {
        case 'Enter':
        case 'MediaPlayPause':
        case 'MediaPlay':
        case 'MediaPause':
          if (videoRef.current.paused) {
            videoRef.current.play().catch(err => console.error("Play error:", err));
            setIsPlaying(true);
          } else {
            videoRef.current.pause();
            setIsPlaying(false);
          }
          break;
        case 'ArrowRight':
        case 'MediaFastForward':
          videoRef.current.currentTime += 30;
          break;
        case 'ArrowLeft':
        case 'MediaRewind':
          videoRef.current.currentTime -= 30;
          break;
        case 'Escape':
        case 'Backspace':
        case 'GoBack':
          navigate(-1);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  useEffect(() => {
    if (videoRef.current && startPos > 0) {
      const handleMetadata = () => {
        videoRef.current.currentTime = startPos;
      };
      const v = videoRef.current;
      v.addEventListener('loadedmetadata', handleMetadata);
      return () => v.removeEventListener('loadedmetadata', handleMetadata);
    }
  }, [startPos]);

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: 'black', position: 'relative' }}>
      <video 
        ref={videoRef}
        autoPlay
        playsInline
        style={{ width: '100%', height: '100%' }}
        onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
        onLoadedMetadata={() => {
            setDuration(videoRef.current?.duration || 0);
            setError(null);
        }}
        onEnded={() => navigate(-1)}
        onError={(e) => {
            console.error('Video Error Event:', e);
            setError('Błąd odtwarzania: Format nieobsługiwany lub problem z połączeniem.');
        }}
      >
          <source src={streamUrl} type="video/mp4" />
          <source src={streamUrl} type="video/x-matroska" />
          Twoja wersja systemu webOS nie wspiera tego formatu wideo.
      </video>

      {error && (
        <div style={{
          position: 'absolute', top: '40%', left: '10%', right: '10%',
          backgroundColor: 'rgba(200,0,0,0.8)', padding: '32px', borderRadius: '12px',
          textAlign: 'center', color: 'white'
        }}>
          <h2 style={{ marginBottom: '16px' }}>{error}</h2>
          <button 
            onClick={() => navigate(-1)}
            style={{ padding: '12px 24px', fontSize: '20px', backgroundColor: 'white', border: 'none', borderRadius: '8px' }}
          >
            POWRÓT
          </button>
        </div>
      )}

      {!isPlaying && !error && (
        <div style={{
          position: 'absolute', bottom: '10%', left: '10%', right: '10%',
          backgroundColor: 'rgba(0,0,0,0.7)', padding: '24px', borderRadius: '12px',
          display: 'flex', flexDirection: 'column', gap: '16px'
        }}>
          <h2 style={{ color: 'white' }}>{filename}</h2>
          <div style={{ width: '100%', height: '8px', backgroundColor: '#333', borderRadius: '4px' }}>
             <div style={{ width: `${(currentTime / duration) * 100}%`, height: '100%', backgroundColor: 'var(--primary)', borderRadius: '4px' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'gray' }}>
            <span>{Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')}</span>
            <span>{Math.floor(duration / 60)}:{Math.floor(duration % 60).toString().padStart(2, '0')}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayerScreen;
