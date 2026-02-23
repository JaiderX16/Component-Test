import React, { useCallback, useEffect, useRef, useState } from 'react';
import { displacementMap } from './displacementMap';

const SvgLiquidGlassButton = () => {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, px: 0, py: 0 });
  const posRef = useRef(pos);

  useEffect(() => {
    posRef.current = pos;
  }, [pos]);

  const onPointerDown = useCallback((e) => {
    dragging.current = true;
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      px: posRef.current.x,
      py: posRef.current.y,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e) => {
    if (!dragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setPos({ x: dragStart.current.px + dx, y: dragStart.current.py + dy });
  }, []);

  const onPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        minWidth: '100%',
        height: '100%',
        minHeight: '500vh',
        margin: 0,
        fontFamily: 'system-ui, sans-serif',
        overflowX: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <img
          src="https://i.ibb.co/bMvc7Zr6/Vibrant-Summer-Meadow-Watercolor.png"
          alt=""
          style={{ width: '100%', display: 'block' }}
        />
        <img
          src="https://i.ibb.co/ZRH04pV3/Vibrant-Summer-Meadow-Watercolor-1.png"
          alt=""
          style={{ width: '100%', display: 'block' }}
        />
        <img
          src="https://i.ibb.co/bMvc7Zr6/Vibrant-Summer-Meadow-Watercolor.png"
          alt=""
          style={{ width: '100%', display: 'block' }}
        />
      </div>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          justifyContent: 'center',
          alignContent: 'center',
          zIndex: 1,
        }}
      >
        <button
          id="btn1"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          style={{
            position: 'relative',
            width: '8rem',
            height: '8rem',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, .08)',
            border: '2px solid transparent',
            boxShadow: '0 0 0 2px rgba(255, 255, 255, .6), 0 16px 32px rgba(0, 0, 0, .12)',
            backdropFilter: 'url(#frosted)',
            WebkitBackdropFilter: 'url(#frosted)',
            display: 'grid',
            placeItems: 'center',
            cursor: dragging.current ? 'grabbing' : 'grab',
            outline: 0,
            pointerEvents: 'auto',
            transform: `translate(${pos.x}px, ${pos.y}px)`,
            touchAction: 'none',
          }}
        >
          <div
            style={{
              position: 'absolute',
              width: '40%',
              height: '10px',
              background: '#fff',
              borderRadius: '10px',
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: '40%',
              height: '10px',
              background: '#fff',
              borderRadius: '10px',
              transform: 'rotate(90deg)',
            }}
          />
        </button>
      </div>

      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <filter id="frosted" primitiveUnits="objectBoundingBox">
          <feImage
            href={displacementMap}
            x={0} y={0} width={1} height={1} result="map"
            preserveAspectRatio="none"
          />
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.02" result="blur" />
          <feDisplacementMap id="disp" in="blur" in2="map" scale={1} xChannelSelector="R" yChannelSelector="G">
            <animate attributeName="scale" to="1.4" dur="0.3s" begin="btn1.mouseover" fill="freeze" />
            <animate attributeName="scale" to={1} dur="0.3s" begin="btn1.mouseout" fill="freeze" />
          </feDisplacementMap>
        </filter>
      </svg>
    </div>
  );
};

export default SvgLiquidGlassButton;
