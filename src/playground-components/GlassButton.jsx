import React, { useId, useRef } from 'react';
import { displacementMap } from './displacementMap';
import styles from './GlassButton.module.css';

const GlassButton = ({ 
  children, 
  onClick, 
  style, 
  className,
  ...props 
}) => {
  const id = useId().replace(/:/g, '');
  const filterId = `frosted-${id}`;
  const btnId = `btn-${id}`;
  const btnRef = useRef(null);

  // Determine shape from props or style (defaulting to circle)
  // If style.borderRadius is set, use it; otherwise default to 50%
  const borderRadius = style?.borderRadius || '50%';

  const handleMouseMove = (e) => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      btnRef.current.style.setProperty('--x', `${x}px`);
      btnRef.current.style.setProperty('--y', `${y}px`);
    }
  };
  
  return (
    <>
      <button
        ref={btnRef}
        id={btnId}
        onClick={onClick}
        onMouseMove={handleMouseMove}
        className={`${styles.visionBtn} ${className || ''}`}
        style={{
          width: '70px', // Default from HTML
          height: '70px',
          padding: '15px',
          borderRadius: borderRadius,
          backdropFilter: `url(#${filterId}) saturate(180%)`, 
          WebkitBackdropFilter: `url(#${filterId}) saturate(180%)`,
          ...style,
        }}
        {...props}
      >
        <div className={styles.shine} />
        <div className={styles.content}>
          {children}
        </div>
      </button>

      {/* SVG Filter using displacementMap.js (high quality liquid) */}
      <svg style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}>
        <filter id={filterId} primitiveUnits="objectBoundingBox">
          <feImage
            href={displacementMap}
            x={0} y={0} width="100%" height="100%" result="map"
            preserveAspectRatio="none"
          />
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.01" result="blur" />
          <feDisplacementMap in="blur" in2="map" scale={0.5} xChannelSelector="R" yChannelSelector="G">
          </feDisplacementMap>
        </filter>
      </svg>
    </>
  );
};

export default GlassButton;
