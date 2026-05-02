import React, { useEffect, useRef } from 'react';
import { useFocusable } from '@noriginmedia/norigin-spatial-navigation';

const FocusableButton = ({ text, onClick, color = '#333333', style, className = '', focusKey, onEnterPress }) => {
  const { ref, focused, focusSelf } = useFocusable({
    focusKey,
    onEnterPress: onEnterPress || onClick,
  });

  return (
    <div
      ref={ref}
      onClick={onClick}
      className={`focusable btn-primary ${focused ? 'focused' : ''} ${className}`}
      style={{
        backgroundColor: color,
        padding: '12px 24px',
        borderRadius: '12px',
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
