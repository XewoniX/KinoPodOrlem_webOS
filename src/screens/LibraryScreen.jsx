import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useFocusable, FocusContext } from '@noriginmedia/norigin-spatial-navigation';
import { useNavigate } from 'react-router-dom';
import MovieCard from '../components/MovieCard';
import FocusableButton from '../components/FocusableButton';
import { SERVER_URL } from '../config';

const LibraryScreen = ({ currentUser }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openFolder, setOpenFolder] = useState(null);
  const navigate = useNavigate();
  
  const { ref, focusKey, focusSelf } = useFocusable();

  const fetchLibrary = async () => {
    try {
      const res = await axios.post(`${SERVER_URL}/library`, { user: currentUser });
      setItems(res.data.library || []);
    } catch (err) {
      console.error('Lib fetch err', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLibrary();
    const interval = setInterval(fetchLibrary, 15000);
    return () => clearInterval(interval);
  }, [currentUser]);

  useEffect(() => {
    if (!loading && !openFolder) {
      setTimeout(() => focusSelf(), 300);
    }
  }, [loading, openFolder, focusSelf]);

  if (openFolder) {
    const folderData = items.find(f => f.name === openFolder);
    if (!folderData) {
      setOpenFolder(null);
      return null;
    }

    return (
      <FocusContext.Provider value={focusKey}>
        <div ref={ref} style={{ padding: '24px 48px', height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <h1 style={{ color: 'white' }}>{folderData.name} <span style={{ color: 'gray', fontSize: '18px' }}>[{folderData.files_data?.length} plików]</span></h1>
            <FocusableButton text="POWRÓT" onClick={() => setOpenFolder(null)} />
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {folderData.files_data?.map((file, idx) => {
              const isReady = file.progress === 100;
              return (
                <div key={idx} style={{ padding: '16px', backgroundColor: '#1E1E1E', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: 'white', fontWeight: 'bold' }}>{file.name}</span>
                    {!isReady && <span style={{ color: 'var(--primary)' }}>{file.progress}% {file.eta}</span>}
                  </div>
                  {!isReady ? (
                    <div style={{ width: '100%', height: '8px', backgroundColor: '#333', borderRadius: '4px' }}>
                      <div style={{ width: `${file.progress}%`, height: '100%', backgroundColor: 'var(--primary)', borderRadius: '4px' }} />
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <FocusableButton 
                        text="ODTWÓRZ" 
                        color="#009900" 
                        style={{ padding: '8px 24px', borderRadius: '8px' }} 
                        onClick={() => navigate('/player', { state: { folder: folderData.name, filename: file.name, startPos: file.watch_pos || 0 } })} 
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </FocusContext.Provider>
    );
  }

  return (
    <FocusContext.Provider value={focusKey}>
      <div ref={ref} style={{ padding: '24px 48px', height: '100%', display: 'flex', flexDirection: 'column' }}>
        {loading ? (
          <div style={{ color: 'var(--primary)' }}>Ładowanie biblioteki...</div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
              {items.map((item, idx) => (
                <MovieCard 
                  key={idx} 
                  movie={item} 
                  onClick={() => {
                    if (item.type === 'folder') setOpenFolder(item.name);
                  }} 
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </FocusContext.Provider>
  );
};

export default LibraryScreen;
