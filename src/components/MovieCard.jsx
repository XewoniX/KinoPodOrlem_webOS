import React from 'react';
import { useFocusable } from '@noriginmedia/norigin-spatial-navigation';
import { SERVER_URL } from '../config';

const getFullImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  if (url.startsWith('//')) return 'https:' + url;
  if (url.startsWith('/') && !url.startsWith('/poster') && !url.startsWith('/stream')) {
    return `https://image.tmdb.org/t/p/w500${url}`;
  }
  return `${SERVER_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

const MovieCard = ({ movie, onClick, focusKey }) => {
  const { ref, focused } = useFocusable({
    focusKey,
    onEnterPress: onClick,
  });

  const imgUrl = getFullImageUrl(movie.img_url || movie.poster);
  const titleParts = (movie.display || movie.name || '').split('[');
  const mainTitle = titleParts[0].trim();
  const tags = titleParts.length > 1 ? `[${titleParts.slice(1).join('[')}` : '';

  return (
    <div
      ref={ref}
      onClick={onClick}
      className={`focusable ${focused ? 'focused' : ''}`}
      style={{
        width: '180px',
        height: '270px',
        borderRadius: '12px',
        backgroundColor: 'var(--card-bg)',
        border: focused ? '3px solid white' : '1px solid var(--card-border)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        position: 'relative',
        transition: 'all 0.2s',
      }}
    >
      <div style={{ flex: 1, backgroundColor: '#333', backgroundImage: imgUrl ? `url('${imgUrl}')` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        {movie.is_downloaded && (
          <div style={{ position: 'absolute', top: '8px', right: '8px', backgroundColor: 'green', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>
            POBRANE
          </div>
        )}
      </div>
      <div style={{ padding: '8px', height: '60px', backgroundColor: focused ? '#2A2A2A' : 'var(--card-bg)' }}>
        <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {mainTitle}
        </div>
        {tags && (
          <div style={{ fontSize: '10px', color: 'var(--primary)', marginTop: '4px' }}>
            {tags}
          </div>
        )}
      </div>
    </div>
  );
};

export default MovieCard;
