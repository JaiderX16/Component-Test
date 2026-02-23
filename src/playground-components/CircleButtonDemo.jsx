import React, { useState, useRef } from 'react';
import CircleButton from './CircleButton';
import PillButton from './PillButton';
import GlassContainer from './GlassContainer';
import NotesSidebar from './NotesSidebar';
import styles from './GlassButton.module.css';
import iOSWallpaper from './iOSWallpaper.jpg'; // Import the new wallpaper

const CircleButtonDemo = () => {
  const [bgIndex, setBgIndex] = useState(0); // 0: Map, 1: Flowers, 2: iOS Wallpaper
  const [isDarkMode, setIsDarkMode] = useState(false); // New theme state
  const backgrounds = ['Map', 'Flowers', 'iOS Wallpaper'];

  // Drag state for the button cluster
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const initialPosRef = useRef({ x: 0, y: 0 });

  const toggleBackground = () => {
    setBgIndex((prev) => (prev + 1) % backgrounds.length);
  };

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  const handlePointerDown = (e) => {
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    initialPosRef.current = { ...position };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPosition({
      x: initialPosRef.current.x + dx,
      y: initialPosRef.current.y + dy
    });
  };

  const handlePointerUp = (e) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  // Theme variables
  const themeStyles = {
    '--glass-bg': isDarkMode ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.2)',
    '--glass-border': isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.4)',
    
    // Hover variables based on theme
    '--glass-hover-bg': isDarkMode 
      ? 'rgba(0, 0, 0, 0.6)' // Darker on hover in dark mode
      : 'rgba(255, 255, 255, 0.35)', // Brighter on hover in light mode
      
    '--glass-hover-border': isDarkMode 
      ? 'rgba(255, 255, 255, 0.2)' // Subtler border on hover in dark mode
      : 'rgba(255, 255, 255, 0.6)', // Stronger border on hover in light mode
      
    '--glass-hover-glow': isDarkMode
      ? 'rgba(255, 255, 255, 0.1)' // Subtler glow on hover in dark mode
      : 'rgba(255, 255, 255, 0.3)', // Stronger glow on hover in light mode
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        minWidth: '100%',
        height: '100%',
        minHeight: '100vh',
        margin: 0,
        fontFamily: 'system-ui, sans-serif',
        overflow: 'hidden',
        background: '#000', // Fallback
        ...themeStyles // Apply theme variables to container
      }}
    >
      {/* Controls Container */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        zIndex: 10,
        display: 'flex',
        gap: '10px'
      }}>
        {/* Theme Switcher */}
        <button 
          onClick={toggleTheme}
          style={{
            padding: '8px 16px',
            background: 'rgba(255, 255, 255, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '20px',
            color: 'white',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
            fontWeight: 'bold'
          }}
        >
          {isDarkMode ? '🌙 Dark' : '☀️ Light'}
        </button>

        {/* Background Switcher */}
        <button 
          onClick={toggleBackground}
          style={{
            padding: '8px 16px',
            background: 'rgba(255, 255, 255, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '20px',
            color: 'white',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
            fontWeight: 'bold'
          }}
        >
          {`Background: ${backgrounds[bgIndex]}`}
        </button>
      </div>

      {/* Background Page (simulating the blurred colorful background) */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflowY: 'auto' }}>
        {bgIndex === 0 && (
          <iframe
            src="https://memoria-radar.vercel.app/"
            style={{ width: '100%', height: '200%', border: 'none', display: 'block' }} // Increased height to allow scrolling
            title="Background Demo"
          />
        )}
        
        {bgIndex === 1 && (
          <div style={{ height: '200%', width: '100%' }}> {/* Container for scrolling image */}
            <img
              src="https://i.ibb.co/bMvc7Zr6/Vibrant-Summer-Meadow-Watercolor.png"
              alt=""
              style={{ width: '100%', height: '50%', objectFit: 'cover', display: 'block' }}
            />
             <img
              src="https://i.ibb.co/ZRH04pV3/Vibrant-Summer-Meadow-Watercolor-1.png"
              alt=""
              style={{ width: '100%', height: '50%', objectFit: 'cover', display: 'block' }}
            />
          </div>
        )}

        {bgIndex === 2 && (
          <div style={{ height: '200%', width: '100%' }}>
            <img
              src={iOSWallpaper}
              alt="iOS Wallpaper"
              style={{ width: '100%', height: '50%', objectFit: 'cover', display: 'block' }}
            />
             <img
              src={iOSWallpaper}
              alt="iOS Wallpaper"
              style={{ width: '100%', height: '50%', objectFit: 'cover', display: 'block', transform: 'scaleY(-1)' }} // Mirror for seamless scroll
            />
          </div>
        )}
        {/* Apply the "perfect liquid glass blur" to the background itself via a glass panel overlay */}
        {/* <div className={styles.glassPanel} /> */}
      </div>

      {/* Demo Container */}
      <div
        style={{
          position: 'fixed', // Changed to fixed to stay in place while background scrolls
          inset: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      >
        {/* Floating Sidebar on the Left */}
        <div style={{
          position: 'absolute',
          left: '20px',
          top: '20px',
          bottom: '20px',
          pointerEvents: 'auto',
          zIndex: 20
        }}>
          <NotesSidebar />
        </div>

        {/* Center Content Group */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2rem',
          pointerEvents: 'none' // Let children handle events
        }}>
          <div 
            onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr',
            gap: '2rem', 
            alignItems: 'center',
            pointerEvents: 'auto',
            padding: '2rem',
            transform: `translate(${position.x}px, ${position.y}px)`,
            cursor: isDragging ? 'grabbing' : 'grab',
            touchAction: 'none', // Prevent scrolling when dragging the buttons
          }}
        >
          
          {/* Top Left: Lock (simulated with basic shapes or emoji for now) */}
          <CircleButton onClick={() => console.log('Lock clicked')}>
             <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
               <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
               <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
             </svg>
          </CircleButton>

          {/* Top Right: Windows */}
          <CircleButton onClick={() => console.log('Windows clicked')}>
             <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
               <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
               <line x1="3" y1="9" x2="21" y2="9"></line>
               <line x1="9" y1="21" x2="9" y2="9"></line>
             </svg>
          </CircleButton>

          {/* Center Pill (Focus) - spanning 2 columns if we had a grid, or just another circle for now */}
          {/* To replicate the "pill", we can override styles */}
          <PillButton 
            style={{ 
              gridColumn: 'span 2', 
              justifySelf: 'center'
            }}
            onClick={() => console.log('Focus clicked')}
          >
             <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '1.2rem', fontWeight: 600 }}>
               <svg width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="none">
                 <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
               </svg>
               <span>Focus</span>
             </div>
          </PillButton>

          {/* Bottom Left: Bell */}
          <CircleButton onClick={() => console.log('Bell clicked')}>
             <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
               <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
               <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
             </svg>
          </CircleButton>

          {/* Bottom Right: Grid */}
          <CircleButton onClick={() => console.log('Grid clicked')}>
             <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
               <rect x="3" y="3" width="7" height="7"></rect>
               <rect x="14" y="3" width="7" height="7"></rect>
               <rect x="14" y="14" width="7" height="7"></rect>
               <rect x="3" y="14" width="7" height="7"></rect>
             </svg>
          </CircleButton>

        </div>

        {/* Glass Container Example */}
        <GlassContainer style={{ pointerEvents: 'auto', width: '400px', height: '150px' }}>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Alias impedit maxime voluptatum dolorum
          reiciendis architecto quo porro.
        </GlassContainer>
        </div> {/* End Center Content Group */}
      </div>
    </div>
  );
};

export default CircleButtonDemo;
