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
    onFocus: ({ node }) => {
      node.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center'
      });
    }
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
        width: '300px',
        height: '450px',
        borderRadius: '20px',
        backgroundColor: 'var(--card-bg)',
        border: focused ? '8px solid white' : '1px solid var(--card-border)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        position: 'relative',
        transition: 'all 0.2s',
        boxShadow: focused ? '0 10px 30px rgba(0,0,0,0.5)' : 'none',
        zIndex: focused ? 10 : 1
      }}
    >
      <div style={{ flex: 1, backgroundColor: '#333', backgroundImage: imgUrl ? `url('${imgUrl}')` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        {movie.is_downloaded && (
          <div style={{ position: 'absolute', top: '16px', right: '16px', backgroundColor: 'green', color: 'white', padding: '8px 16px', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold', zIndex: 5 }}>
            POBRANE
          </div>
        )}
      </div>
      <div style={{ padding: '20px', backgroundColor: focused ? '#2A2A2A' : 'var(--card-bg)' }}>
        <div style={{ fontSize: '26px', fontWeight: 'bold', color: 'white', lineHeight: '1.2' }}>
          {mainTitle}
        </div>
        {tags && (
          <div style={{ fontSize: '18px', color: 'var(--primary)', marginTop: '10px' }}>
            {tags}
          </div>
        )}
      </div>
    </div>
  );
};

export default MovieCard;
