import React, { useEffect, useRef } from 'react';
import { useFocusable } from '@noriginmedia/norigin-spatial-navigation';

const FocusableButton = ({ text, onClick, color = '#333333', style, className = '', focusKey, onEnterPress, noScroll = false }) => {
  const { ref, focused, focusSelf } = useFocusable({
    focusKey,
    onEnterPress: onEnterPress || onClick,
    onFocus: ({ node }) => {
      if (!noScroll) {
        node.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });
      }
    }
  });

  return (
    <div
      ref={ref}
      onClick={onClick}
      className={`focusable btn-primary ${focused ? 'focused' : ''} ${className}`}
      style={{
        backgroundColor: color,
        padding: '16px 32px',
        borderRadius: '16px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        cursor: 'pointer',
        fontWeight: 'bold',
        textAlign: 'center',
        ...style
      }}
    >
      {text}
    </div>
  );
};

export default FocusableButton;
