import React, { useState, useRef } from 'react';
import NotesSidebar from './NotesSidebar';
import iOSWallpaper from './iOSWallpaper.jpg';

const NotesSidebarDemo = () => {
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const initialPosRef = useRef({ x: 0, y: 0 });

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

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        minWidth: '100%',
        height: '100vh',
        overflow: 'hidden',
        background: '#000',
      }}
    >
      {/* Background Image */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <img
          src={iOSWallpaper}
          alt="Wallpaper"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>

      {/* Instructions */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        color: 'white',
        textShadow: '0 2px 4px rgba(0,0,0,0.5)',
        zIndex: 10,
        pointerEvents: 'none'
      }}>
        Drag the sidebar to see the blur effect
      </div>

      {/* Draggable Sidebar Container */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          transform: `translate(${position.x}px, ${position.y}px)`,
          width: '240px',
          height: '400px', // Fixed height for demo
          cursor: isDragging ? 'grabbing' : 'grab',
          zIndex: 20,
          // Box shadow for depth
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          borderRadius: '16px', // Match sidebar radius
        }}
      >
        <NotesSidebar />
      </div>
    </div>
  );
};

export default NotesSidebarDemo;
