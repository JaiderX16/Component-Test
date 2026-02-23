import React, { useEffect, useRef, useState, useId } from 'react';
import { gsap } from 'gsap';
import { Draggable } from 'gsap/Draggable';
import styles from './LiquidToggle.module.css';

gsap.registerPlugin(Draggable);

const LiquidToggle = ({
    initialPressed = false,
    hueValue = 144,
    onToggle = () => { }
}) => {
    const buttonRef = useRef(null);
    const arrowMainRef = useRef(null);
    const id = useId().replace(/:/g, ''); // Generate unique IDs for SVG filters

    const [pressed, setPressed] = useState(initialPressed);
    const [isTransientPressed, setIsTransientPressed] = useState(false); // Nuevo estado para data-pressed
    const [complete, setComplete] = useState(initialPressed ? 100 : 0);
    const [isActive, setIsActive] = useState(false);
    const [delta, setDelta] = useState(0);

    // Filter IDs
    const gooId = `goo-${id}`;
    const removeBlackId = `remove-black-${id}`;

    useEffect(() => {
        const button = buttonRef.current;

        // Single GSAP context for better cleanup
        const ctx = gsap.context(() => {
            const proxy = document.createElement('div');

            Draggable.create(proxy, {
                allowContextMenu: true,
                trigger: button,
                onDragStart: function () {
                    const toggleBounds = button.getBoundingClientRect();
                    const isCurrentlyPressed = button.getAttribute('aria-pressed') === 'true';
                    const bounds = isCurrentlyPressed
                        ? toggleBounds.left - this.pointerX
                        : toggleBounds.left + toggleBounds.width - this.pointerX;
                    this.dragBounds = bounds;
                    setIsActive(true);
                },
                onDrag: function () {
                    const isCurrentlyPressed = button.getAttribute('aria-pressed') === 'true';
                    const dragged = this.x - this.startX;
                    const currentComplete = gsap.utils.clamp(
                        0,
                        100,
                        isCurrentlyPressed
                            ? gsap.utils.mapRange(this.dragBounds, 0, 0, 100, dragged)
                            : gsap.utils.mapRange(0, this.dragBounds, 0, 100, dragged)
                    );

                    setComplete(currentComplete);
                    setDelta(Math.min(Math.abs(this.deltaX), 12));
                },
                onDragEnd: function () {
                    const reachedTarget = (this.complete || 0) >= 50;
                    finishAnimation(reachedTarget);
                },
                onPress: function () {
                    this.__pressTime = Date.now();
                    if (arrowMainRef.current) arrowMainRef.current.style.opacity = '0';
                    if ('ontouchstart' in window && navigator.maxTouchPoints > 0) {
                        setIsActive(true);
                    }
                },
                onRelease: function () {
                    setDelta(0);
                    if ('ontouchstart' in window && navigator.maxTouchPoints > 0) {
                        setIsActive(false);
                    }
                    
                    if (Date.now() - this.__pressTime <= 150) {
                        toggleState();
                    }
                },
                onClick: function() {
                    // Fallback para clicks directos que Draggable podría no capturar como release rápido
                    // pero Draggable usualmente maneja esto en onRelease
                }
            });
        }, button);

        const finishAnimation = (targetState) => {
            const finalComplete = targetState ? 100 : 0;

            gsap.to(button, {
                '--complete': finalComplete,
                duration: 0.15,
                onUpdate: function () {
                    // Sync state with animation to avoid React conflicts
                    const val = gsap.getProperty(button, '--complete');
                    setComplete(val);
                },
                onComplete: () => {
                    setIsActive(false);
                    setPressed(targetState);
                    setComplete(finalComplete);
                    onToggle(targetState);
                }
            });
        };

        const toggleState = () => {
            setIsTransientPressed(true); // data-pressed=true
            setIsActive(true);
            const isCurrentlyPressed = button.getAttribute('aria-pressed') === 'true';
            const targetState = !isCurrentlyPressed;

            gsap.to(button, {
                '--complete': targetState ? 100 : 0,
                duration: 0.12,
                delay: 0.18, // delay original para bounce && bubble
                onUpdate: function () {
                    const val = gsap.getProperty(button, '--complete');
                    setComplete(val);
                },
                onComplete: () => {
                    // Delayed call como en el original
                    gsap.delayedCall(0.05, () => {
                        setIsActive(false);
                        setIsTransientPressed(false); // data-pressed=false
                        setPressed(targetState);
                        setComplete(targetState ? 100 : 0);
                        onToggle(targetState);
                    });
                }
            });
        };

        return () => ctx.revert();
    }, [onToggle]);

    return (
        <div className={styles.container}>
            <button
                ref={buttonRef}
                aria-label="toggle"
                aria-pressed={pressed}
                data-active={isActive}
                data-pressed={isTransientPressed}
                data-bounce="true"
                className={styles.liquidToggle}
                style={{
                    '--complete': complete,
                    '--hue': hueValue,
                    '--delta': delta
                }}
            >
                <div className={styles.knockout} style={{ filter: `url(#${removeBlackId})` }}>
                    <div className={styles.indicatorMasked}>
                        <div className={styles.mask}></div>
                    </div>
                </div>

                <div className={styles.indicatorLiquid}>
                    <div className={styles.shadow}></div>
                    <div className={styles.wrapper}>
                        <div className={styles.liquids} style={{ filter: `url(#${gooId})` }}>
                            <div className={styles.liquidShadow}></div>
                            <div className={styles.liquidTrack}></div>
                        </div>
                    </div>
                    <div className={styles.cover}></div>
                </div>
            </button>

            <svg className={styles.srOnly} xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <filter id={gooId}>
                        <feGaussianBlur in="SourceGraphic" stdDeviation="13" result="blur" />
                        <feColorMatrix
                            in="blur"
                            type="matrix"
                            values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 13 -10"
                            result="goo"
                        />
                        <feComposite in="goo" in2="SourceGraphic" operator="atop" />
                    </filter>

                    <filter id={removeBlackId} colorInterpolationFilters="sRGB">
                        <feColorMatrix
                            type="matrix"
                            values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 -255 -255 -255 0 1"
                            result="black-pixels"
                        />
                        <feMorphology
                            in="black-pixels"
                            operator="dilate"
                            radius="0.5"
                            result="smoothed"
                        />
                        <feComposite in="SourceGraphic" in2="smoothed" operator="out" />
                    </filter>
                </defs>
            </svg>
        </div>
    );
};

export default LiquidToggle;
