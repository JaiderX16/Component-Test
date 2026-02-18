import React, { useRef, useState, useEffect, forwardRef, createContext, useContext, useMemo, useCallback, useImperativeHandle } from 'react';
import { createPortal } from 'react-dom';

// ============= ICONS (Inline SVGs to prevent import errors) =============
const Icons = {
    Loader2: ({ className }) => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
    ),
    Plus: ({ className }) => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M5 12h14" /><path d="M12 5v14" />
        </svg>
    ),
    Minus: ({ className }) => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M5 12h14" />
        </svg>
    ),
    Maximize: ({ className }) => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M8 3H5a2 2 0 0 0-2 2v3" /><path d="M21 8V5a2 2 0 0 0-2-2h-3" /><path d="M3 16v3a2 2 0 0 0 2 2h3" /><path d="M16 21h3a2 2 0 0 0 2-2v-3" />
        </svg>
    ),
    Locate: ({ className }) => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <line x1="12" x2="12" y1="2" y2="5" /><line x1="12" x2="12" y1="19" y2="22" /><line x1="2" x2="5" y1="12" y2="12" /><line x1="19" x2="22" y1="12" y2="12" /><circle cx="12" cy="12" r="7" />
        </svg>
    ),
    Info: ({ className }) => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
        </svg>
    ),
    X: ({ className }) => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M18 6 6 18" /><path d="m6 6 12 12" />
        </svg>
    ),
};

// ============= UTILITIES (Mocking clsx/tailwind-merge) =============
function cn(...inputs) {
    return inputs.flat().filter(Boolean).join(" ");
}

// ============= CUSTOM HOOK FOR MAPLIBRE (SANDBOX FIX) =============
function useMapLibre() {
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined' && window.maplibregl) {
            setIsLoaded(true);
            return;
        }

        const version = "3.6.2"; // Stable version for sandbox
        const script = document.createElement('script');
        script.src = `https://unpkg.com/maplibre-gl@${version}/dist/maplibre-gl.js`;
        script.async = true;
        script.onload = () => setIsLoaded(true);
        document.head.appendChild(script);

        const link = document.createElement('link');
        link.href = `https://unpkg.com/maplibre-gl@${version}/dist/maplibre-gl.css`;
        link.rel = "stylesheet";
        document.head.appendChild(link);
    }, []);

    return isLoaded;
}

// ============= THEME HELPERS =============
function getDocumentTheme() {
    if (typeof document === "undefined") return null;
    if (document.documentElement.classList.contains("dark")) return "dark";
    if (document.documentElement.classList.contains("light")) return "light";
    return null;
}

function getSystemTheme() {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
}

function useResolvedTheme(themeProp) {
    const [detectedTheme, setDetectedTheme] = useState(
        () => getDocumentTheme() ?? getSystemTheme()
    );

    useEffect(() => {
        if (themeProp) return;

        const observer = new MutationObserver(() => {
            const docTheme = getDocumentTheme();
            if (docTheme) {
                setDetectedTheme(docTheme);
            }
        });
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class"],
        });

        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const handleSystemChange = (e) => {
            if (!getDocumentTheme()) {
                setDetectedTheme(e.matches ? "dark" : "light");
            }
        };
        mediaQuery.addEventListener("change", handleSystemChange);

        return () => {
            observer.disconnect();
            mediaQuery.removeEventListener("change", handleSystemChange);
        };
    }, [themeProp]);

    return themeProp ?? detectedTheme;
}

// ============= TOOLTIP COMPONENTS (Mocking Radix UI for Sandbox) =============
// Re-implemented to avoid npm dependency issues while keeping API surface
const TooltipContext = createContext({ open: false, setOpen: () => { } });

function TooltipProvider({ delayDuration = 0, children, ...props }) {
    return <div {...props}>{children}</div>;
}

function Tooltip({ children, ...props }) {
    const [open, setOpen] = useState(false);
    return (
        <TooltipContext.Provider value={{ open, setOpen }}>
            <div className="relative inline-block" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
                {children}
            </div>
        </TooltipContext.Provider>
    );
}

function TooltipTrigger({ asChild, children, ...props }) {
    // Handling asChild loosely for this demo
    return asChild ? children : <button {...props}>{children}</button>;
}

function TooltipContent({ className, sideOffset = 0, children, side = 'top', ...props }) {
    const { open } = useContext(TooltipContext);
    if (!open) return null;

    const sideClasses = {
        top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
        bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
        left: "right-full top-1/2 -translate-y-1/2 mr-2",
        right: "left-full top-1/2 -translate-y-1/2 ml-2",
    };

    return (
        <div
            className={cn(
                "absolute z-50 w-max rounded-md px-3 py-1.5 text-xs text-white bg-slate-900 animate-in fade-in-0 zoom-in-95",
                sideClasses[side] || sideClasses.top,
                className
            )}
            style={{ marginTop: side === 'bottom' ? sideOffset : undefined, marginBottom: side === 'top' ? sideOffset : undefined }}
            {...props}
        >
            {children}
            <div className="absolute w-2 h-2 bg-slate-900 rotate-45 left-1/2 -translate-x-1/2 -bottom-1 z-[-1]" />
        </div>
    );
}

// ============= MAP CONTEXT =============
const MapContext = createContext(null);

function useMap() {
    const context = useContext(MapContext);
    if (!context) {
        throw new Error("useMap must be used within a Map component");
    }
    return context;
}

const defaultStyles = {
    dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
    light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
};

const DefaultLoader = () => (
    <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-900 z-10">
        <div className="flex gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-pulse" />
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-pulse [animation-delay:150ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-pulse [animation-delay:300ms]" />
        </div>
    </div>
);

const Map = forwardRef(function Map(
    { children, theme: themeProp, styles, projection, ...props },
    ref
) {
    const libLoaded = useMapLibre();
    const containerRef = useRef(null);
    const [mapInstance, setMapInstance] = useState(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isStyleLoaded, setIsStyleLoaded] = useState(false);
    const currentStyleRef = useRef(null);
    const styleTimeoutRef = useRef(null);
    const resolvedTheme = useResolvedTheme(themeProp);

    const mapStyles = useMemo(
        () => ({
            dark: styles?.dark ?? defaultStyles.dark,
            light: styles?.light ?? defaultStyles.light,
        }),
        [styles]
    );

    useImperativeHandle(ref, () => mapInstance, [mapInstance]);

    const clearStyleTimeout = useCallback(() => {
        if (styleTimeoutRef.current) {
            clearTimeout(styleTimeoutRef.current);
            styleTimeoutRef.current = null;
        }
    }, []);

    // Helper to fetch style JSON manually to avoid library fetch issues in sandbox
    const [loadedStyles, setLoadedStyles] = useState({ light: null, dark: null });
    useEffect(() => {
        const loadStyle = async (url) => {
            if (typeof url !== 'string') return url;
            try {
                const res = await fetch(url);
                return await res.json();
            } catch (e) {
                console.error("Style load failed", e);
                return null;
            }
        };
        Promise.all([loadStyle(mapStyles.light), loadStyle(mapStyles.dark)])
            .then(([light, dark]) => setLoadedStyles({ light, dark }));
    }, [mapStyles]);

    useEffect(() => {
        if (!libLoaded || !containerRef.current || !loadedStyles.light || !loadedStyles.dark) return;

        const MapLibreGL = window.maplibregl;

        // --- SANDBOX SECURITY FIXES ---
        if (!MapLibreGL.workerUrl) {
            MapLibreGL.workerUrl = "https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl-csp-worker.js";
        }

        const initialStyle =
            resolvedTheme === "dark" ? loadedStyles.dark : loadedStyles.light;
        currentStyleRef.current = initialStyle;

        const map = new MapLibreGL.Map({
            container: containerRef.current,
            style: initialStyle,
            renderWorldCopies: false,
            attributionControl: {
                compact: true,
            },
            // --- CRITICAL CONFIGURATION FOR SANDBOX ---
            collectResourceTiming: false,
            localIdeographFontFamily: false,
            refreshExpiredTiles: false,
            validateStyle: false,
            crossSourceCollisions: false,
            fadeDuration: 0,
            ...props,
        });

        const styleDataHandler = () => {
            clearStyleTimeout();
            styleTimeoutRef.current = setTimeout(() => {
                setIsStyleLoaded(true);
                if (projection) {
                    map.setProjection(projection);
                }
            }, 100);
        };
        const loadHandler = () => setIsLoaded(true);

        map.on("load", loadHandler);
        map.on("styledata", styleDataHandler);

        // Suppress benign errors in console
        map.on("error", (e) => {
            if (e?.error?.message?.includes('href')) return;
            console.log("Map Notice:", e);
        });

        setMapInstance(map);

        return () => {
            clearStyleTimeout();
            if (map) {
                map.off("load", loadHandler);
                map.off("styledata", styleDataHandler);
                map.remove();
            }
            setIsLoaded(false);
            setIsStyleLoaded(false);
            setMapInstance(null);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [libLoaded, loadedStyles]);

    useEffect(() => {
        if (!mapInstance || !resolvedTheme || !loadedStyles.light) return;

        const newStyle =
            resolvedTheme === "dark" ? loadedStyles.dark : loadedStyles.light;

        if (currentStyleRef.current === newStyle) return;

        clearStyleTimeout();
        currentStyleRef.current = newStyle;
        setIsStyleLoaded(false);

        mapInstance.setStyle(newStyle, { diff: true });
    }, [mapInstance, resolvedTheme, loadedStyles, clearStyleTimeout]);

    const contextValue = useMemo(
        () => ({
            map: mapInstance,
            isLoaded: isLoaded && isStyleLoaded,
        }),
        [mapInstance, isLoaded, isStyleLoaded]
    );

    return (
        <MapContext.Provider value={contextValue}>
            <div ref={containerRef} className="relative w-full h-full">
                {(!isLoaded || !libLoaded) && <DefaultLoader />}
                {mapInstance && children}
            </div>
        </MapContext.Provider>
    );
});

// ============= MARKER CONTEXT =============
const MarkerContext = createContext(null);

function useMarkerContext() {
    const context = useContext(MarkerContext);
    if (!context) {
        throw new Error("Marker components must be used within MapMarker");
    }
    return context;
}

function MapMarker({
    longitude,
    latitude,
    children,
    onClick,
    onMouseEnter,
    onMouseLeave,
    onDragStart,
    onDrag,
    onDragEnd,
    draggable = false,
    ...markerOptions
}) {
    const { map } = useMap();
    const MapLibreGL = window.maplibregl;

    const marker = useMemo(() => {
        if (!MapLibreGL) return null;
        const markerInstance = new MapLibreGL.Marker({
            ...markerOptions,
            element: document.createElement("div"),
            draggable,
        }).setLngLat([longitude, latitude]);

        const handleClick = (e) => onClick?.(e);
        const handleMouseEnter = (e) => onMouseEnter?.(e);
        const handleMouseLeave = (e) => onMouseLeave?.(e);

        markerInstance.getElement()?.addEventListener("click", handleClick);
        markerInstance.getElement()?.addEventListener("mouseenter", handleMouseEnter);
        markerInstance.getElement()?.addEventListener("mouseleave", handleMouseLeave);

        const handleDragStart = () => {
            const lngLat = markerInstance.getLngLat();
            onDragStart?.({ lng: lngLat.lng, lat: lngLat.lat });
        };
        const handleDrag = () => {
            const lngLat = markerInstance.getLngLat();
            onDrag?.({ lng: lngLat.lng, lat: lngLat.lat });
        };
        const handleDragEnd = () => {
            const lngLat = markerInstance.getLngLat();
            onDragEnd?.({ lng: lngLat.lng, lat: lngLat.lat });
        };

        markerInstance.on("dragstart", handleDragStart);
        markerInstance.on("drag", handleDrag);
        markerInstance.on("dragend", handleDragEnd);

        return markerInstance;
    }, [MapLibreGL]);

    useEffect(() => {
        if (!map || !marker) return;

        marker.addTo(map);

        return () => {
            marker.remove();
        };
    }, [map, marker]);

    useEffect(() => {
        if (!marker) return;

        const currentPos = marker.getLngLat();
        if (currentPos.lng !== longitude || currentPos.lat !== latitude) {
            marker.setLngLat([longitude, latitude]);
        }
        if (marker.isDraggable() !== draggable) {
            marker.setDraggable(draggable);
        }

        const currentOffset = marker.getOffset();
        const newOffset = markerOptions.offset ?? [0, 0];
        const [newOffsetX, newOffsetY] = Array.isArray(newOffset)
            ? newOffset
            : [newOffset.x, newOffset.y];
        if (currentOffset.x !== newOffsetX || currentOffset.y !== newOffsetY) {
            marker.setOffset(newOffset);
        }

        if (marker.getRotation() !== markerOptions.rotation) {
            marker.setRotation(markerOptions.rotation ?? 0);
        }
        if (marker.getRotationAlignment() !== markerOptions.rotationAlignment) {
            marker.setRotationAlignment(markerOptions.rotationAlignment ?? "auto");
        }
        if (marker.getPitchAlignment() !== markerOptions.pitchAlignment) {
            marker.setPitchAlignment(markerOptions.pitchAlignment ?? "auto");
        }
    }, [marker, longitude, latitude, draggable, markerOptions]);

    if (!marker) return null;

    return (
        <MarkerContext.Provider value={{ marker, map }}>
            {children}
        </MarkerContext.Provider>
    );
}

function MarkerContent({ children, className }) {
    const { marker } = useMarkerContext();

    return createPortal(
        <div className={cn("relative cursor-pointer", className)}>
            {children || <DefaultMarkerIcon />}
        </div>,
        marker.getElement()
    );
}

function DefaultMarkerIcon() {
    return (
        <div className="relative h-4 w-4 rounded-full border-2 border-white bg-blue-500 shadow-lg" />
    );
}

function MarkerPopup({
    children,
    className,
    closeButton = false,
    ...popupOptions
}) {
    const { marker, map } = useMarkerContext();
    const container = useMemo(() => document.createElement("div"), []);
    const prevPopupOptions = useRef(popupOptions);
    const MapLibreGL = window.maplibregl;

    const popup = useMemo(() => {
        if (!MapLibreGL) return null;
        const popupInstance = new MapLibreGL.Popup({
            offset: 16,
            ...popupOptions,
            closeButton: false,
        })
            .setMaxWidth("none")
            .setDOMContent(container);

        return popupInstance;
    }, [MapLibreGL]);

    useEffect(() => {
        if (!map || !popup) return;

        popup.setDOMContent(container);
        marker.setPopup(popup);

        return () => {
            marker.setPopup(null);
        };
    }, [map, popup]);

    if (popup && popup.isOpen()) {
        const prev = prevPopupOptions.current;

        if (prev.offset !== popupOptions.offset) {
            popup.setOffset(popupOptions.offset ?? 16);
        }
        if (prev.maxWidth !== popupOptions.maxWidth && popupOptions.maxWidth) {
            popup.setMaxWidth(popupOptions.maxWidth ?? "none");
        }

        prevPopupOptions.current = popupOptions;
    }

    const handleClose = () => popup?.remove();

    if (!popup) return null;

    return createPortal(
        <div
            className={cn(
                "relative rounded-md border bg-white dark:bg-slate-900 p-3 text-slate-900 dark:text-slate-100 shadow-md animate-in fade-in-0 zoom-in-95",
                className
            )}
        >
            {closeButton && (
                <button
                    type="button"
                    onClick={handleClose}
                    className="absolute top-1 right-1 z-10 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    aria-label="Close popup"
                >
                    <Icons.X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                </button>
            )}
            {children}
        </div>,
        container
    );
}

function MarkerTooltip({ children, className, ...popupOptions }) {
    const { marker, map } = useMarkerContext();
    const container = useMemo(() => document.createElement("div"), []);
    const prevTooltipOptions = useRef(popupOptions);
    const MapLibreGL = window.maplibregl;

    const tooltip = useMemo(() => {
        if (!MapLibreGL) return null;
        const tooltipInstance = new MapLibreGL.Popup({
            offset: 16,
            ...popupOptions,
            closeOnClick: true,
            closeButton: false,
        }).setMaxWidth("none");

        return tooltipInstance;
    }, [MapLibreGL]);

    useEffect(() => {
        if (!map || !tooltip) return;

        tooltip.setDOMContent(container);

        const handleMouseEnter = () => {
            tooltip.setLngLat(marker.getLngLat()).addTo(map);
        };
        const handleMouseLeave = () => tooltip.remove();

        marker.getElement()?.addEventListener("mouseenter", handleMouseEnter);
        marker.getElement()?.addEventListener("mouseleave", handleMouseLeave);

        return () => {
            marker.getElement()?.removeEventListener("mouseenter", handleMouseEnter);
            marker.getElement()?.removeEventListener("mouseleave", handleMouseLeave);
            tooltip.remove();
        };
    }, [map, tooltip]);

    if (tooltip && tooltip.isOpen()) {
        const prev = prevTooltipOptions.current;

        if (prev.offset !== popupOptions.offset) {
            tooltip.setOffset(popupOptions.offset ?? 16);
        }
        if (prev.maxWidth !== popupOptions.maxWidth && popupOptions.maxWidth) {
            tooltip.setMaxWidth(popupOptions.maxWidth ?? "none");
        }

        prevTooltipOptions.current = popupOptions;
    }

    if (!tooltip) return null;

    return createPortal(
        <div
            className={cn(
                "rounded-md bg-slate-900 px-2 py-1 text-xs text-white shadow-md animate-in fade-in-0 zoom-in-95",
                className
            )}
        >
            {children}
        </div>,
        container
    );
}

function MarkerLabel({ children, className, position = "top" }) {
    const positionClasses = {
        top: "bottom-full mb-1",
        bottom: "top-full mt-1",
    };

    return (
        <div
            className={cn(
                "absolute left-1/2 -translate-x-1/2 whitespace-nowrap",
                "text-[10px] font-medium text-slate-900 dark:text-white",
                positionClasses[position],
                className
            )}
        >
            {children}
        </div>
    );
}

// ============= MAP CONTROLS =============
const positionClasses = {
    "top-left": "top-2 left-2",
    "top-right": "top-2 right-2",
    "bottom-left": "bottom-2 left-2",
    "bottom-right": "bottom-10 right-2",
};

function ControlGroup({ children }) {
    return (
        <div className="flex flex-col rounded-md border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 shadow-sm overflow-hidden [&>button:not(:last-child)]:border-b [&>button:not(:last-child)]:border-slate-200 dark:[&>button:not(:last-child)]:border-slate-800">
            {children}
        </div>
    );
}

function ControlButton({ onClick, label, children, disabled = false }) {
    return (
        <button
            onClick={onClick}
            aria-label={label}
            type="button"
            className={cn(
                "flex items-center justify-center size-8 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-200",
                disabled && "opacity-50 pointer-events-none cursor-not-allowed"
            )}
            disabled={disabled}
        >
            {children}
        </button>
    );
}

function MapControls({
    position = "bottom-right",
    showZoom = true,
    showCompass = false,
    showLocate = false,
    showFullscreen = false,
    className,
    onLocate,
}) {
    const { map } = useMap();
    const [waitingForLocation, setWaitingForLocation] = useState(false);

    const handleZoomIn = useCallback(() => {
        map?.zoomTo(map.getZoom() + 1, { duration: 300 });
    }, [map]);

    const handleZoomOut = useCallback(() => {
        map?.zoomTo(map.getZoom() - 1, { duration: 300 });
    }, [map]);

    const handleResetBearing = useCallback(() => {
        map?.resetNorthPitch({ duration: 300 });
    }, [map]);

    const handleLocate = useCallback(() => {
        setWaitingForLocation(true);
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const coords = {
                        longitude: pos.coords.longitude,
                        latitude: pos.coords.latitude,
                    };
                    map?.flyTo({
                        center: [coords.longitude, coords.latitude],
                        zoom: 14,
                        duration: 1500,
                    });
                    onLocate?.(coords);
                    setWaitingForLocation(false);
                },
                (error) => {
                    console.error("Error getting location:", error);
                    setWaitingForLocation(false);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        } else {
            setWaitingForLocation(false);
        }
    }, [map, onLocate]);

    const handleFullscreen = useCallback(() => {
        const container = map?.getContainer();
        if (!container) return;
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            container.requestFullscreen();
        }
    }, [map]);

    return (
        <div
            className={cn(
                "absolute z-10 flex flex-col gap-1.5",
                positionClasses[position],
                className
            )}
        >
            {showZoom && (
                <ControlGroup>
                    <ControlButton onClick={handleZoomIn} label="Zoom in">
                        <Icons.Plus className="size-4" />
                    </ControlButton>
                    <ControlButton onClick={handleZoomOut} label="Zoom out">
                        <Icons.Minus className="size-4" />
                    </ControlButton>
                </ControlGroup>
            )}
            {showCompass && (
                <ControlGroup>
                    <CompassButton onClick={handleResetBearing} />
                </ControlGroup>
            )}
            {showLocate && (
                <ControlGroup>
                    <ControlButton
                        onClick={handleLocate}
                        label="Find my location"
                        disabled={waitingForLocation}
                    >
                        {waitingForLocation ? (
                            <Icons.Loader2 className="size-4 animate-spin" />
                        ) : (
                            <Icons.Locate className="size-4" />
                        )}
                    </ControlButton>
                </ControlGroup>
            )}
            {showFullscreen && (
                <ControlGroup>
                    <ControlButton onClick={handleFullscreen} label="Toggle fullscreen">
                        <Icons.Maximize className="size-4" />
                    </ControlButton>
                </ControlGroup>
            )}
        </div>
    );
}

function CompassButton({ onClick }) {
    const { map } = useMap();
    const compassRef = useRef(null);

    useEffect(() => {
        if (!map || !compassRef.current) return;

        const compass = compassRef.current;

        const updateRotation = () => {
            const bearing = map.getBearing();
            const pitch = map.getPitch();
            compass.style.transform = `rotate(${-bearing}deg) rotateX(${pitch}deg)`;
        };

        map.on("rotate", updateRotation);
        map.on("pitch", updateRotation);
        updateRotation();

        return () => {
            map.off("rotate", updateRotation);
            map.off("pitch", updateRotation);
        };
    }, [map]);

    return (
        <button
            onClick={onClick}
            aria-label="Reset bearing"
            type="button"
            className="flex items-center justify-center size-8 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-200"
        >
            <svg
                ref={compassRef}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-4 transition-transform duration-100 ease-out"
                style={{ transformOrigin: "center" }}
            >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
        </button>
    );
}

// ============= MAIN COMPONENT (FlyToMap Example) =============
const LOCATIONS = [
    { name: "North America", lat: 40, lng: -100 },
    { name: "South America", lat: -15, lng: -60 },
    { name: "Europe", lat: 50, lng: 10 },
    { name: "Asia", lat: 34, lng: 100 },
    { name: "Africa", lat: 0, lng: 20 },
    { name: "Australia", lat: -25, lng: 135 },
];

export function FlyToMap() {
    const mapRef = useRef(null);
    const [userLocation, setUserLocation] = useState(null);

    return (
        <div className="relative w-full h-full rounded-none overflow-hidden border-none bg-slate-950">
            <Map
                ref={mapRef}
                projection={{ type: "mercator" }}
                theme="dark"
                center={[0, 20]}
                zoom={2}
                attributionControl={false}
            >
                <MapControls
                    position="bottom-right"
                    showZoom
                    showCompass
                    showFullscreen
                    showLocate
                    onLocate={(coords) => setUserLocation(coords)}
                />

                {/* Custom Discreet Attribution */}
                <div className="absolute bottom-1 left-1 z-10">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button className="p-1.5 rounded-full bg-black/20 text-white/30 hover:bg-black/40 hover:text-white/80 transition-all backdrop-blur-sm">
                                <Icons.Info className="w-3 h-3" />
                                <span className="sr-only">Map credits</span>
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="text-[10px] bg-black/80 text-white/70 border-none backdrop-blur-md">
                            <p>© CARTO, © OpenStreetMap contributors</p>
                        </TooltipContent>
                    </Tooltip>
                </div>

                {userLocation && (
                    <MapMarker
                        latitude={userLocation.latitude}
                        longitude={userLocation.longitude}
                    >
                        <MarkerContent>
                            <div className="relative flex items-center justify-center w-6 h-6 bg-white rounded-full shadow-xl ring-1 ring-black/10">
                                <div className="w-4 h-4 bg-blue-500 rounded-full" />
                            </div>
                        </MarkerContent>
                    </MapMarker>
                )}

                {LOCATIONS.map((loc) => (
                    <MapMarker
                        key={loc.name}
                        latitude={loc.lat}
                        longitude={loc.lng}
                        onClick={() => {
                            mapRef.current?.flyTo({
                                center: [loc.lng, loc.lat],
                                zoom: 4,
                                duration: 2000,
                                essential: true
                            });
                        }}
                    >
                        <MarkerContent>
                            <div className="relative flex items-center justify-center w-4 h-4">
                                <div className="absolute w-full h-full bg-blue-500 rounded-full opacity-50 animate-ping" />
                                <div className="relative w-2.5 h-2.5 bg-blue-400 border-2 border-white rounded-full shadow-sm" />
                            </div>
                        </MarkerContent>
                        <MarkerLabel className="text-xs font-bold tracking-wider text-white/90 drop-shadow-md">
                            {loc.name.toUpperCase()}
                        </MarkerLabel>
                    </MapMarker>
                ))}
            </Map>
        </div>
    );
}

// Export default App wrapping FlyToMap for display
export default function App() {
    return (
        <div className="w-full h-screen bg-slate-950">
            <FlyToMap />
        </div>
    );
}
