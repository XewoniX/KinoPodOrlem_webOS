import React, { useState } from 'react';
import axios from 'axios';
import { useFocusable, FocusContext } from '@noriginmedia/norigin-spatial-navigation';
import MovieCard from '../components/MovieCard';
import FocusableButton from '../components/FocusableButton';
import { SERVER_URL } from '../config';

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
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Szukaj (min. 3 znaki)..."
            style={{
              flex: 1,
              padding: '20px 32px',
              borderRadius: '32px',
              backgroundColor: '#1E1E1E',
              border: '2px solid #333',
              color: 'white',
              fontSize: '24px',
              outline: 'none'
            }}
          />
          <FocusableButton 
            text="SZUKAJ" 
            onClick={handleSearch} 
            color="var(--primary)" 
            style={{ borderRadius: '32px', padding: '16px 48px' }} 
          />
        </div>

        {loading && <div style={{ color: 'var(--primary)' }}>Szukam...</div>}
        {error && <div style={{ color: 'red' }}>{error}</div>}

        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
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
