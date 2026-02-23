import React from 'react';
import GlassButton from './GlassButton';

const PillButton = ({ style, ...props }) => {
  return (
    <GlassButton 
      style={{ 
        borderRadius: '999px', 
        width: '12rem', 
        height: '4rem',
        ...style 
      }} 
      {...props} 
    />
  );
};

export default PillButton;
