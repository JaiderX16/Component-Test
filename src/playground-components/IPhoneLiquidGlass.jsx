import React, { useEffect, useRef, useState } from 'react';
import styles from './IPhoneLiquidGlass.module.css';

const IPhoneLiquidGlass = () => {
    const iphoneRef = useRef(null);
    const [darkMode, setDarkMode] = useState(true);

    // Parallax del fondo al mover el mouse
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!iphoneRef.current) return;
            const xPercent = (e.clientX / window.innerWidth - 0.5) * 10;
            const yPercent = (e.clientY / window.innerHeight - 0.5) * 10;
            iphoneRef.current.style.backgroundPosition =
                `calc(50% + ${xPercent}px) calc(50% + ${yPercent}px)`;
        };

        document.addEventListener('mousemove', handleMouseMove);
        return () => document.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const pageClasses = [
        styles.page,
        darkMode ? styles.pageDark : styles.pageLight,
    ].join(' ');

    const toggleClasses = [
        styles.toggleBtn,
        darkMode ? styles.toggleBtnDark : styles.toggleBtnLight,
    ].join(' ');

    return (
        <div className={pageClasses}>
            {/* ── Toggle modo claro / oscuro ── */}
            <button
                className={toggleClasses}
                onClick={() => setDarkMode((d) => !d)}
            >
                {darkMode ? '☀️ Modo Claro' : '🌙 Modo Oscuro'}
            </button>

            {/* ── iPhone ── */}
            <div className={styles.iphone} ref={iphoneRef}>
                {/* Fecha y hora */}
                <div className={styles.dateTime}>
                    <div className={styles.date}>Monday 9 June</div>
                    <div className={styles.time}>11:14</div>
                </div>

                {/* Notificación */}
                <div className={`${styles.notification} ${styles.glass}`}>
                    <div className={styles.notifIcon}>✉️</div>
                    <div>
                        <div className={styles.notifApp}>Codepen</div>
                        <div className={styles.notifDesc}>The codepen newsletter...</div>
                    </div>
                </div>

                {/* Reproductor */}
                <div className={`${styles.player} ${styles.glass}`}>
                    <div className={styles.song}>Web Development</div>
                    <div className={styles.artist}>Adam Curzon</div>
                    <div className={styles.trackHolder}>
                        <div>1:05</div>
                        <div className={styles.track} />
                        <div>-0:37</div>
                    </div>
                    <div className={styles.playerIcons}>
                        <div style={{ cursor: 'pointer' }}>⏮</div>
                        <div style={{ cursor: 'pointer' }}>⏸</div>
                        <div style={{ cursor: 'pointer' }}>⏭</div>
                    </div>
                </div>

                {/* Botones extras */}
                <div className={styles.extraButtons}>
                    <div className={`${styles.extraBtn} ${styles.glass}`}>A</div>
                    <div className={`${styles.extraBtn} ${styles.glass}`}>B</div>
                </div>
            </div>

            {/* Título lateral */}
            <div className={styles.title}>
                <div className={styles.titleMain}>LIQUID</div>
                <div className={styles.titleSub}>GLASS</div>
            </div>
        </div>
    );
};

export default IPhoneLiquidGlass;
