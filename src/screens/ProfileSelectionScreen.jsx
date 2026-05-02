import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useFocusable, FocusContext } from '@noriginmedia/norigin-spatial-navigation';
import { SERVER_URL } from '../config';

const ProfileAvatar = ({ name, onClick, focusKey }) => {
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
        flexDirection: 'column',
        alignItems: 'center',
        cursor: 'pointer',
      }}
    >
      <div style={{
        width: '120px',
        height: '120px',
        borderRadius: '60px',
        backgroundColor: focused ? 'var(--primary)' : '#333333',
        border: focused ? '4px solid white' : '4px solid transparent',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '48px',
        fontWeight: 'bold',
        color: 'white',
        transition: 'all 0.2s',
      }}>
        {name.charAt(0).toUpperCase()}
      </div>
      <span style={{
        marginTop: '16px',
        fontSize: '24px',
        color: focused ? 'white' : 'gray',
        fontWeight: focused ? 'bold' : 'normal',
      }}>
        {name}
      </span>
    </div>
  );
};

const ProfileSelectionScreen = ({ onSelect }) => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  const { ref, focusKey, focusSelf } = useFocusable();

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const res = await axios.get(`${SERVER_URL}/profiles`);
        let fetchedProfiles = res.data.profiles || [];
        
        const lastUser = localStorage.getItem('orlekino_last_user');
        if (lastUser && fetchedProfiles.includes(lastUser)) {
          fetchedProfiles = [lastUser, ...fetchedProfiles.filter(p => p !== lastUser)];
        }
        setProfiles(fetchedProfiles);
      } catch (err) {
        console.error('Error fetching profiles', err);
        setProfiles(['Gość', 'Tata', 'Mama']); // fallback
      } finally {
        setLoading(false);
      }
    };
    fetchProfiles();
  }, []);

  useEffect(() => {
    if (!loading && profiles.length > 0) {
      // Small delay to allow render
      setTimeout(() => {
        focusSelf();
      }, 300);
    }
  }, [loading, profiles, focusSelf]);

  return (
    <FocusContext.Provider value={focusKey}>
      <div ref={ref} style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
      }}>
        <img src="/logoithextoackground.png" alt="Logo" style={{ width: '240px', marginBottom: '40px' }} />
        <h1 style={{ fontSize: '48px', color: 'white', marginBottom: '64px' }}>Kto ogląda?</h1>
        
        {loading ? (
          <div style={{ color: 'var(--primary)', fontSize: '24px' }}>Ładowanie profilów...</div>
        ) : (
          <div style={{
            display: 'flex',
            gap: '48px',
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            {profiles.map((profile, idx) => (
              <ProfileAvatar 
                key={profile} 
                name={profile} 
                onClick={() => onSelect(profile)} 
              />
            ))}
          </div>
        )}
      </div>
    </FocusContext.Provider>
  );
};

export default ProfileSelectionScreen;
