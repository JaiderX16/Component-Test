import React from 'react';
import GlassButton from './GlassButton';

const CircleButton = ({ style, ...props }) => {
  return (
    <GlassButton 
      style={{ 
        borderRadius: '50%', 
        width: '5rem', 
        height: '5rem',
        ...style 
      }} 
      {...props} 
    />
  );
};

export default CircleButton;
