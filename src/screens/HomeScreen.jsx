import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useFocusable, FocusContext } from '@noriginmedia/norigin-spatial-navigation';
import MovieCard from '../components/MovieCard';
import { SERVER_URL } from '../config';

const ContinueWatchingCard = ({ item, onClick, focusKey }) => {
  const { ref, focused } = useFocusable({
    focusKey,
    onEnterPress: onClick,
  });

  const imgUrl = item.poster ? (item.poster.startsWith('http') ? item.poster : `${SERVER_URL}${item.poster}`) : null;
  const displayTitle = item.folder.replace(/\./g, " ");
  
  const epMatch = item.filename.match(/[Ss](\d+)[Ee](\d+)/);
  const episodeLabel = epMatch ? `S${epMatch[1]}E${epMatch[2]}` : "";

  return (
    <div
      ref={ref}
      onClick={onClick}
      className={`focusable ${focused ? 'focused' : ''}`}
      style={{
        width: '180px',
        height: '210px',
        borderRadius: '12px',
        backgroundColor: focused ? '#2A2A2A' : '#1A1A1A',
        border: focused ? '2px solid white' : '2px solid transparent',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        overflow: 'hidden',
      }}
    >
      <div style={{ height: '130px', position: 'relative', backgroundColor: '#333', backgroundImage: imgUrl ? `url('${imgUrl}')` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '4px', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div style={{ width: `${item.percent}%`, height: '100%', backgroundColor: 'var(--primary)' }} />
        </div>
        {focused && (
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'var(--primary)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white' }}>▶</div>
          </div>
        )}
      </div>
      <div style={{ padding: '8px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'white', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {displayTitle}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: 'var(--primary)' }}>{episodeLabel}</span>
          <span style={{ fontSize: '11px', color: 'gray' }}>{Math.floor(item.percent)}%</span>
        </div>
      </div>
    </div>
  );
};

const HomeScreen = ({ currentUser, onMovieSelect }) => {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [continueWatching, setContinueWatching] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const { ref, focusKey, focusSelf } = useFocusable();

  useEffect(() => {
    const fetchHome = async () => {
      try {
        const res = await axios.get(`${SERVER_URL}/v3/home`, { params: { user: currentUser } });
        setRows(res.data.rows || []);
        setContinueWatching(res.data.continue_watching || []);
      } catch (e) {
        console.error('Home load error', e);
      } finally {
        setLoading(false);
      }
    };
    fetchHome();

    // Polling continue watching
    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`${SERVER_URL}/v3/continue`, { params: { user: currentUser } });
        setContinueWatching(res.data.continue_watching || []);
      } catch (e) {}
    }, 5000);

    return () => clearInterval(interval);
  }, [currentUser]);

  useEffect(() => {
    if (!loading) {
      setTimeout(() => focusSelf(), 300);
    }
  }, [loading, focusSelf]);

  return (
    <FocusContext.Provider value={focusKey}>
      <div ref={ref} style={{ padding: '24px 48px', overflowY: 'auto', height: 'calc(100vh - 100px)' }}>
        {loading ? (
          <div style={{ color: 'var(--primary)', fontSize: '24px' }}>Ładowanie...</div>
        ) : (
          <>
            {continueWatching.length > 0 && (
              <div style={{ marginBottom: '32px' }}>
                <h2 style={{ color: 'var(--primary)', marginBottom: '16px' }}>▶ Oglądaj dalej</h2>
                <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '16px' }}>
                  {continueWatching.map((item, idx) => (
                    <ContinueWatchingCard 
                      key={`${item.folder}_${item.filename}`} 
                      item={item} 
                      onClick={() => navigate('/player', { state: { folder: item.folder, filename: item.filename, startPos: item.position || 0 } })} 
                    />
                  ))}
                </div>
                <div style={{ height: '1px', backgroundColor: '#2A2A2A', margin: '16px 0' }} />
              </div>
            )}

            {rows.map((row, rIdx) => (
              <div key={row.title} style={{ marginBottom: '32px' }}>
                <h2 style={{ color: 'white', marginBottom: '16px' }}>{row.title}</h2>
                <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '16px' }}>
                  {row.items.map((movie, mIdx) => (
                    <MovieCard 
                      key={`${rIdx}_${mIdx}`} 
                      movie={movie} 
                      onClick={() => onMovieSelect(movie)} 
                    />
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </FocusContext.Provider>
  );
};

export default HomeScreen;
