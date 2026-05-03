import React, { useState } from 'react';
import axios from 'axios';
import { useFocusable, FocusContext } from '@noriginmedia/norigin-spatial-navigation';
import MovieCard from '../components/MovieCard';
import FocusableButton from '../components/FocusableButton';
import { SERVER_URL } from '../config';

const FocusableInput = ({ value, onChange, placeholder, onEnterPress }) => {
  const { ref, focused } = useFocusable({
    onEnterPress: () => {
        // Trigger virtual keyboard or focus on webOS
        ref.current.focus();
    },
    onBlur: () => {
        // Ensure native focus is removed when spatial focus leaves
        ref.current.blur();
    }
  });

  return (
    <input 
      ref={ref}
      type="text" 
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`focusable ${focused ? 'focused' : ''}`}
      style={{
        flex: 1,
        padding: '20px 32px',
        borderRadius: '32px',
        backgroundColor: '#1E1E1E',
        border: focused ? '4px solid white' : '2px solid #333',
        color: 'white',
        fontSize: '24px',
        outline: 'none',
        transition: 'all 0.2s'
      }}
    />
  );
};

const SearchScreen = ({ currentUser, onMovieSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { ref, focusKey, focusSelf } = useFocusable();

  const handleSearch = async () => {
    if (query.length < 3) return;
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${SERVER_URL}/search`, {
        query,
        movies: true,
        series: true
      }, { timeout: 10000 });
      setResults(res.data.results || []);
    } catch (err) {
      setError('Błąd wyszukiwania');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FocusContext.Provider value={focusKey}>
      <div ref={ref} style={{ padding: '24px 48px', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
          <FocusableInput 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Szukaj (min. 3 znaki)..."
          />
          <FocusableButton 
            text="SZUKAJ" 
            onClick={handleSearch} 
            color="var(--primary)" 
            style={{ borderRadius: '32px', padding: '16px 48px' }} 
          />
        </div>

        {loading && <div style={{ color: 'var(--primary)', fontSize: '24px' }}>Szukam...</div>}
        {error && <div style={{ color: 'red', fontSize: '24px' }}>{error}</div>}
        
        <div style={{ color: 'gray', fontSize: '18px', marginBottom: '16px' }}>
          💡 Naciśnij przycisk OK aby wpisać tekst. Po zakończeniu naciśnij WSTECZ aby wyjść z trybu pisania i nawigować po wynikach.
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px' }}>
            {results.map((movie, idx) => (
              <MovieCard 
                key={idx} 
                movie={movie} 
                onClick={() => onMovieSelect(movie)} 
              />
            ))}
          </div>
        </div>
      </div>
    </FocusContext.Provider>
  );
};

export default SearchScreen;
