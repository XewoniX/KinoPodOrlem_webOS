import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useFocusable, FocusContext } from '@noriginmedia/norigin-spatial-navigation';
import FocusableButton from '../components/FocusableButton';
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

const MovieDetailsScreen = ({ movie, currentUser, onClose }) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [links, setLinks] = useState([]);
  const [selectedLinksUrls, setSelectedLinksUrls] = useState([]);
  const [loadingLinks, setLoadingLinks] = useState(false);
  
  const { ref, focusKey, focusSelf } = useFocusable();

  useEffect(() => {
    setTimeout(() => focusSelf(), 300);
  }, [focusSelf]);

  const handleSelectOption = async (opt) => {
    setSelectedOption(opt);
    setLoadingLinks(true);
    try {
      const cleanTitle = movie.display.split('[')[0].trim();
      const res = await axios.post(`${SERVER_URL}/grab_links`, {
        url: opt.url,
        clean_title: cleanTitle,
        user: currentUser,
        title: opt.raw_title
      });

      if (res.data.status === "already_downloaded") {
        alert(res.data.message || "Dodano do biblioteki!");
        onClose();
        return;
      }
      setLinks(res.data.links || []);
      setSelectedLinksUrls(res.data.links?.map(l => l.url) || []);
    } catch (err) {
      console.error(err);
      alert('Błąd pobierania linków');
    } finally {
      setLoadingLinks(false);
    }
  };

  const handleDownload = async () => {
    if (selectedLinksUrls.length === 0) return;
    try {
      const res = await axios.post(`${SERVER_URL}/download`, {
        links: selectedLinksUrls,
        title: movie.display.split('[')[0].trim(),
        img_url: movie.img_url,
        user: currentUser
      });
      alert(res.data.message || "Dodano do pobierania!");
      onClose();
    } catch (e) {
      alert("Błąd");
    }
  };

  return (
    <FocusContext.Provider value={focusKey}>
      <div ref={ref} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'var(--bg-color)', zIndex: 100, display: 'flex', padding: '48px' }}>
        
        {/* Left Col: Poster & Back btn */}
        <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '24px', marginRight: '48px' }}>
          <div style={{ width: '100%', aspectRatio: '0.67', borderRadius: '12px', backgroundImage: `url('${getFullImageUrl(movie.img_url)}')`, backgroundSize: 'cover' }}></div>
          <FocusableButton text="POWRÓT" onClick={onClose} color="#333" />
        </div>

        {/* Right Col: Details & Options */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h1 style={{ fontSize: '48px', color: 'white', marginBottom: '16px' }}>{movie.display.split('[')[0].trim()}</h1>
          {movie.category && <h2 style={{ fontSize: '24px', color: 'var(--primary)', marginBottom: '24px' }}>{movie.category}</h2>}
          
          <div style={{ backgroundColor: '#1E1E1E', padding: '16px', borderRadius: '12px', marginBottom: '32px' }}>
            <p style={{ color: 'gray', fontSize: '18px', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {movie.description || "Brak opisu."}
            </p>
          </div>

          {!selectedOption ? (
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <h3 style={{ color: 'var(--primary)', marginBottom: '16px' }}>WYBIERZ WERSJĘ:</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {movie.options?.map((opt, idx) => (
                  <FocusableButton 
                    key={idx} 
                    text={`[${opt.quality || 'Nieznana'}] ${opt.raw_title}`} 
                    onClick={() => handleSelectOption(opt)} 
                    color="#1E1E1E" 
                    style={{ justifyContent: 'flex-start', border: '1px solid #333' }}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ color: 'var(--primary)', marginBottom: '16px' }}>WYBIERZ WSTAWKI DO POBRANIA:</h3>
              
              {loadingLinks ? (
                <div style={{ color: 'var(--primary)' }}>Szukanie bezpłatnych linków...</div>
              ) : (
                <>
                  <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                    {links.map((link, idx) => {
                      const isSelected = selectedLinksUrls.includes(link.url);
                      return (
                        <FocusableButton
                          key={idx}
                          text={`${isSelected ? '☑' : '☐'} ${link.name}`}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedLinksUrls(prev => prev.filter(u => u !== link.url));
                            } else {
                              setSelectedLinksUrls(prev => [...prev, link.url]);
                            }
                          }}
                          color={isSelected ? 'var(--primary)' : '#1E1E1E'}
                          style={{ justifyContent: 'flex-start' }}
                        />
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <FocusableButton text="COFNIJ" onClick={() => setSelectedOption(null)} style={{ flex: 1 }} />
                    <FocusableButton text="POBIERZ ZAZNACZONE" onClick={handleDownload} color="#009900" style={{ flex: 2 }} />
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </FocusContext.Provider>
  );
};

export default MovieDetailsScreen;
