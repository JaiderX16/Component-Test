import React from 'react';
import styles from './GlassContainer.module.css';

const GlassContainer = ({ children, style, className }) => {
  return (
    <>
      <div 
        className={`${styles.glassContainer} ${className || ''}`}
        style={style}
      >
        <div className={styles.text}>
          {children}
        </div>
      </div>

      {/* Unique SVG Filter for the Container */}
      <svg style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}>
        <filter id="container-glass" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.008 0.008" numOctaves="2" seed="92" result="noise" />
            <feGaussianBlur in="noise" stdDeviation="0.02" result="blur" />
            <feDisplacementMap in="SourceGraphic" in2="blur" scale="77" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
    </>
  );
};

export default GlassContainer;
