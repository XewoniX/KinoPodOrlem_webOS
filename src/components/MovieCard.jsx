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
        width: '280px',
        height: '420px',
        borderRadius: '16px',
        backgroundColor: 'var(--card-bg)',
        border: focused ? '6px solid white' : '1px solid var(--card-border)',
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
          <div style={{ position: 'absolute', top: '12px', right: '12px', backgroundColor: 'green', color: 'white', padding: '6px 12px', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold' }}>
            POBRANE
          </div>
        )}
      </div>
      <div style={{ padding: '16px', backgroundColor: focused ? '#2A2A2A' : 'var(--card-bg)' }}>
        <div style={{ fontSize: '22px', fontWeight: 'bold', color: 'white', lineHeight: '1.2' }}>
          {mainTitle}
        </div>
        {tags && (
          <div style={{ fontSize: '16px', color: 'var(--primary)', marginTop: '8px' }}>
            {tags}
          </div>
        )}
      </div>
    </div>
  );
};

export default MovieCard;
