import React, { useState, useEffect, useCallback } from 'react';
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const navigate = useNavigate();
  
  const { ref, focusKey, focusSelf } = useFocusable();

  const fetchLibrary = useCallback(async () => {
    try {
      const res = await axios.post(`${SERVER_URL}/library`, { user: currentUser }, { timeout: 10000 });
      setItems(res.data.library || []);
    } catch (err) {
      console.error('Lib fetch err', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchLibrary();
    const interval = setInterval(fetchLibrary, 15000);
    return () => clearInterval(interval);
  }, [fetchLibrary]);

  useEffect(() => {
    if (!loading && !openFolder && !showDeleteConfirm) {
      setTimeout(() => focusSelf(), 300);
    }
  }, [loading, openFolder, showDeleteConfirm, focusSelf]);

  const handleRemoveFromLibrary = async () => {
    try {
      await axios.post(`${SERVER_URL}/library/remove_user`, {
        folder_name: openFolder,
        user: currentUser
      });
      setShowDeleteConfirm(false);
      setOpenFolder(null);
      fetchLibrary();
    } catch (err) {
      console.error('Remove err', err);
      alert('Błąd podczas usuwania');
    }
  };

  if (openFolder) {
    const folderData = items.find(f => f.name === openFolder);
    if (!folderData && !showDeleteConfirm) {
      setOpenFolder(null);
      return null;
    }

    return (
      <FocusContext.Provider value={focusKey}>
        <div ref={ref} style={{ padding: '24px 48px', height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <h1 style={{ color: 'white' }}>{openFolder} <span style={{ color: 'gray', fontSize: '18px' }}>[{folderData?.files_data?.length || 0} plików]</span></h1>
            <div style={{ display: 'flex', gap: '16px' }}>
              <FocusableButton 
                text="USUŃ Z BIBLIOTEKI" 
                color="#B22222" 
                onClick={() => setShowDeleteConfirm(true)} 
              />
              <FocusableButton text="POWRÓT" onClick={() => setOpenFolder(null)} />
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {folderData?.files_data?.map((file, idx) => {
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

          {showDeleteConfirm && (
            <DeleteConfirmDialog 
              folderName={openFolder} 
              onConfirm={handleRemoveFromLibrary} 
              onCancel={() => setShowDeleteConfirm(false)} 
            />
          )}
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

const DeleteConfirmDialog = ({ folderName, onConfirm, onCancel }) => {
  const { ref, focusSelf } = useFocusable();

  useEffect(() => {
    focusSelf();
  }, [focusSelf]);

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 1000
    }}>
      <div ref={ref} style={{
        backgroundColor: '#1E1E1E', padding: '48px', borderRadius: '24px',
        border: '2px solid #B22222', maxWidth: '600px', textAlign: 'center'
      }}>
        <h2 style={{ color: 'white', marginBottom: '16px' }}>USUNĄĆ Z BIBLIOTEKI?</h2>
        <p style={{ color: 'gray', fontSize: '20px', marginBottom: '32px' }}>
          Czy na pewno chcesz usunąć "{folderName}" ze swojej biblioteki? 
          Pliki pozostaną na serwerze, ale nie będą widoczne dla Twojego profilu.
        </p>
        <div style={{ display: 'flex', gap: '24px', justifyContent: 'center' }}>
          <FocusableButton text="ANULUJ" onClick={onCancel} color="#333" />
          <FocusableButton text="USUŃ" onClick={onConfirm} color="#B22222" />
        </div>
      </div>
    </div>
  );
};

export default LibraryScreen;
