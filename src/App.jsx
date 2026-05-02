import React, { useState, useEffect } from 'react';
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom';
import ProfileSelectionScreen from './screens/ProfileSelectionScreen';
import MainAppScreen from './screens/MainAppScreen';
import VideoPlayerScreen from './screens/VideoPlayerScreen';

function AppContent() {
  const [currentUser, setCurrentUser] = useState(localStorage.getItem('orlekino_last_user') || null);
  const navigate = useNavigate();

  useEffect(() => {
    // Initial navigation only
    const lastUser = localStorage.getItem('orlekino_last_user');
    if (!lastUser) {
      navigate('/');
    } else {
      // Only redirect to main if we are at the root
      // Since it's MemoryRouter and initial load, this is fine
      navigate('/main');
    }
  }, []); // Run only ONCE on mount

  return (
    <Routes>
      <Route path="/" element={<ProfileSelectionScreen onSelect={(user) => {
        localStorage.setItem('orlekino_last_user', user);
        setCurrentUser(user);
        navigate('/main');
      }} />} />
      <Route path="/main" element={<MainAppScreen currentUser={currentUser} onLogout={() => {
        localStorage.removeItem('orlekino_last_user');
        setCurrentUser(null);
        navigate('/');
      }} />} />
      <Route path="/player" element={<VideoPlayerScreen />} />
    </Routes>
  );
}

function App() {
  return (
    <MemoryRouter>
      <AppContent />
    </MemoryRouter>
  );
}

export default App;
