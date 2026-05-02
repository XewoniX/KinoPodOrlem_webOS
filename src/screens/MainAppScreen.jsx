import React, { useState, useEffect } from 'react';
import { Home, Search, Video, Settings } from 'lucide-react';
import { useFocusable, FocusContext } from '@noriginmedia/norigin-spatial-navigation';
import HomeScreen from './HomeScreen';
import SearchScreen from './SearchScreen';
import LibraryScreen from './LibraryScreen';
import MovieDetailsScreen from './MovieDetailsScreen';

const TabButton = ({ icon: Icon, label, isActive, onClick, focusKey }) => {
  const { ref, focused } = useFocusable({
    focusKey,
    onEnterPress: onClick,
  });

  return (
    <div
      ref={ref}
      onClick={onClick}
      className={`focusable ${focused ? 'focused' : ''}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '12px 24px',
        borderRadius: '24px',
        backgroundColor: isActive ? 'var(--primary)' : 'transparent',
        border: focused ? '2px solid white' : '2px solid transparent',
        cursor: 'pointer',
        gap: '12px',
        transition: 'all 0.2s',
      }}
    >
      <Icon color={isActive || focused ? 'white' : 'gray'} size={24} />
      <span style={{
        color: isActive || focused ? 'white' : 'gray',
        fontWeight: 'bold',
        fontSize: '18px',
        display: (isActive || focused) ? 'block' : 'none'
      }}>
        {label}
      </span>
    </div>
  );
};

const MainAppScreen = ({ currentUser, onLogout }) => {
  const [activeTab, setActiveTab] = useState('HOME');
  const [selectedMovie, setSelectedMovie] = useState(null);
  const { ref, focusKey, focusSelf } = useFocusable();

  useEffect(() => {
    // Small delay to focus the current tab content
    setTimeout(() => {
      focusSelf();
    }, 300);
  }, [activeTab, focusSelf]);

  return (
    <FocusContext.Provider value={focusKey}>
      <div ref={ref} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Top Navigation Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '24px 48px',
          gap: '24px'
        }}>
          <img src="/logo.png" alt="Logo" style={{ width: '50px', height: '50px' }} />
          
          <TabButton icon={Home} label="GŁÓWNA" isActive={activeTab === 'HOME'} onClick={() => setActiveTab('HOME')} />
          <TabButton icon={Search} label="WYSZUKIWARKA" isActive={activeTab === 'SEARCH'} onClick={() => setActiveTab('SEARCH')} />
          <TabButton icon={Video} label="BIBLIOTEKA" isActive={activeTab === 'LIBRARY'} onClick={() => setActiveTab('LIBRARY')} />
          
          <div style={{ flex: 1 }}></div>
          
          <TabButton icon={Settings} label="USTAWIENIA" isActive={activeTab === 'SETTINGS'} onClick={() => setActiveTab('SETTINGS')} />
          
          <div 
            onClick={onLogout}
            style={{ color: 'gray', marginLeft: '16px', cursor: 'pointer' }}
          >
            Profil: {currentUser}
          </div>
        </div>

        {/* Main Content Area */}
        <div style={{ flex: 1, position: 'relative' }}>
          {activeTab === 'HOME' && <HomeScreen currentUser={currentUser} onMovieSelect={setSelectedMovie} />}
          {activeTab === 'SEARCH' && <SearchScreen currentUser={currentUser} onMovieSelect={setSelectedMovie} />}
          {activeTab === 'LIBRARY' && <LibraryScreen currentUser={currentUser} />}
          {activeTab === 'SETTINGS' && (
            <div style={{ padding: '48px', color: 'white' }}>
              <h2>Ustawienia</h2>
              <p style={{color: 'gray', marginTop: '16px'}}>Odtwarzacz: Wbudowany HTML5 Video</p>
            </div>
          )}
        </div>

        {/* Movie Details Overlay */}
        {selectedMovie && (
          <MovieDetailsScreen 
            movie={selectedMovie} 
            currentUser={currentUser} 
            onClose={() => {
              setSelectedMovie(null);
              // Focus back to self after closing overlay
              setTimeout(() => focusSelf(), 100);
            }} 
          />
        )}
      </div>
    </FocusContext.Provider>
  );
};

export default MainAppScreen;
