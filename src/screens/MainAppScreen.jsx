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

const SettingsToggle = ({ label, description, checked, onToggle }) => {
  const { ref, focused } = useFocusable({
    onEnterPress: onToggle,
  });

  return (
    <div
      ref={ref}
      onClick={onToggle}
      className={`focusable ${focused ? 'focused' : ''}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '24px',
        backgroundColor: focused ? 'rgba(255,255,255,0.1)' : 'transparent',
        borderRadius: '16px',
        border: focused ? '2px solid white' : '2px solid transparent',
        cursor: 'pointer',
        gap: '24px',
        marginBottom: '16px',
        transition: 'all 0.2s',
      }}
    >
      <div style={{
        width: '60px',
        height: '34px',
        backgroundColor: checked ? 'var(--primary)' : '#444',
        borderRadius: '17px',
        position: 'relative',
        transition: 'all 0.3s'
      }}>
        <div style={{
          width: '26px',
          height: '26px',
          backgroundColor: 'white',
          borderRadius: '50%',
          position: 'absolute',
          top: '4px',
          left: checked ? '30px' : '4px',
          transition: 'all 0.3s'
        }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: '22px', fontWeight: 'bold' }}>{label}</span>
        <span style={{ fontSize: '16px', color: 'gray' }}>{description}</span>
      </div>
    </div>
  );
};

const MainAppScreen = ({ currentUser, onLogout }) => {
  const [activeTab, setActiveTab] = useState('HOME');
  const [selectedMovie, setSelectedMovie] = useState(null);
  
  const [autoSkipSeries, setAutoSkipSeries] = useState(localStorage.getItem('orlekino_auto_skip_series_intro') === 'true');
  const [autoSkipPlatform, setAutoSkipPlatform] = useState(localStorage.getItem('orlekino_auto_skip_platform_intro') === 'true');

  const toggleAutoSkipSeries = () => {
    const newVal = !autoSkipSeries;
    setAutoSkipSeries(newVal);
    localStorage.setItem('orlekino_auto_skip_series_intro', newVal);
  };

  const toggleAutoSkipPlatform = () => {
    const newVal = !autoSkipPlatform;
    setAutoSkipPlatform(newVal);
    localStorage.setItem('orlekino_auto_skip_platform_intro', newVal);
  };
  const { ref, focusKey, focusSelf } = useFocusable();

  useEffect(() => {
    // Small delay to focus the current tab content
    setTimeout(() => {
      focusSelf();
    }, 300);
  }, [activeTab, focusSelf]);

  return (
    <FocusContext.Provider value={focusKey}>
      <div ref={ref} style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>
        {/* Top Navigation Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '24px 48px',
          gap: '24px'
        }}>
          <img src="./logo.png" alt="Logo" style={{ width: '50px', height: '50px' }} />
          
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
        <div style={{ flex: 1, position: 'relative', overflowY: 'auto' }}>
          {activeTab === 'HOME' && <HomeScreen currentUser={currentUser} onMovieSelect={setSelectedMovie} />}
          {activeTab === 'SEARCH' && <SearchScreen currentUser={currentUser} onMovieSelect={setSelectedMovie} />}
          {activeTab === 'LIBRARY' && <LibraryScreen currentUser={currentUser} />}
          {activeTab === 'SETTINGS' && (
            <div style={{ padding: '48px 80px', color: 'white' }}>
              <h1 style={{ color: 'var(--primary)', marginBottom: '32px' }}>USTAWIENIA APLIKACJI</h1>
              
              <div style={{ marginBottom: '48px' }}>
                <h2 style={{ fontSize: '24px', marginBottom: '24px', borderBottom: '1px solid #333', paddingBottom: '12px' }}>Odtwarzacz</h2>
                <div style={{ padding: '24px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '16px' }}>
                    <p style={{ fontSize: '20px', fontWeight: 'bold' }}>Wbudowany HTML5 Video</p>
                    <p style={{ color: 'gray', marginTop: '8px' }}>Zalecany dla systemu webOS. Obsługuje intro i zapisywanie postępu.</p>
                </div>
              </div>

              <div>
                <h2 style={{ fontSize: '24px', marginBottom: '24px', borderBottom: '1px solid #333', paddingBottom: '12px' }}>Automatyzacja</h2>
                <SettingsToggle 
                    label="Zawsze pomijaj intro filmu/serialu" 
                    description="Automatycznie przeskakuje do końca czołówki w serialach."
                    checked={autoSkipSeries}
                    onToggle={toggleAutoSkipSeries}
                />
                <SettingsToggle 
                    label="Pomiń intro platformy" 
                    description="Nie wyświetlaj animacji powitalnej Orlekino przed filmem."
                    checked={autoSkipPlatform}
                    onToggle={toggleAutoSkipPlatform}
                />
              </div>
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
