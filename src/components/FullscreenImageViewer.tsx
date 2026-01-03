import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, X, Loader2, Lock } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface FullscreenImageViewerProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  src: string;
  alt: string;
  title?: string;
  assets?: Array<{
    src: string;
    alt?: string;
    title?: string;
    locked?: boolean;
  }>;
  initialIndex?: number;
  canViewLocked?: boolean;
}

export function FullscreenImageViewer({
  isOpen,
  onOpenChange,
  src,
  alt,
  title,
  assets,
  initialIndex = 0,
  canViewLocked = false,
}: FullscreenImageViewerProps) {
  const hasCarousel: boolean = Array.isArray(assets) && assets.length > 0;
  const [currentIndex, setCurrentIndex] = useState(() => initialIndex);
  const [showControls, setShowControls] = useState(false);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mediaContainerRef = useRef<HTMLDivElement | null>(null);
  const thumbnailStripRef = useRef<HTMLDivElement | null>(null);
  const previousInputsRef = useRef<{ src: string; initialIndex: number; assetsLength: number } | null>(null);

  // Keep index in range when inputs change
  useEffect(() => {
    if (!hasCarousel || !assets?.length) return;
    
    const max = assets.length;
    const bySrc = src ? assets.findIndex((a) => (a?.src ?? '') === src) : -1;
    const candidateIndex = bySrc >= 0 ? bySrc : initialIndex;
    const nextIndex = Math.min(
      Math.max(candidateIndex, 0),
      Math.max(0, max - 1)
    );
    
    const currentInputs = { src: src ?? '', initialIndex, assetsLength: max };
    const prevInputs = previousInputsRef.current;
    
    if (
      !prevInputs ||
      prevInputs.src !== currentInputs.src ||
      prevInputs.initialIndex !== currentInputs.initialIndex ||
      prevInputs.assetsLength !== currentInputs.assetsLength
    ) {
      requestAnimationFrame(() => {
        setCurrentIndex((prev) => (prev !== nextIndex ? nextIndex : prev));
        previousInputsRef.current = currentInputs;
      });
    }
  }, [hasCarousel, assets, src, initialIndex]);

  const modulo = useCallback((n: number, m: number) => ((n % m) + m) % m, []);
  const handlePrev = useCallback(() => {
    if (!hasCarousel || !assets?.length) return;
    setCurrentIndex((idx) => modulo(idx - 1, assets.length));
  }, [hasCarousel, assets, modulo]);
  const handleNext = useCallback(() => {
    if (!hasCarousel || !assets?.length) return;
    setCurrentIndex((idx) => modulo(idx + 1, assets.length));
  }, [hasCarousel, assets, modulo]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (hasCarousel) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          handlePrev();
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          handleNext();
        }
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        onOpenChange(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, hasCarousel, handleNext, handlePrev, onOpenChange]);

  // Auto-hide controls
  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  // Scroll thumbnail strip
  useEffect(() => {
    if (!hasCarousel || !thumbnailStripRef.current) return;
    const thumbnailWrapper = thumbnailStripRef.current.children[
      currentIndex
    ] as HTMLElement;
    if (thumbnailWrapper) {
      thumbnailWrapper.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [currentIndex, hasCarousel]);

  // Hide header when viewer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const active =
    hasCarousel && assets?.length
      ? assets[Math.min(Math.max(currentIndex, 0), assets.length - 1)]
      : { src, alt, title, locked: false };
  const activeSrc = active?.src ?? '';
  const activeAlt = active?.alt ?? alt;
  const activeTitle = active?.title ?? title;
  const isActiveLocked = active?.locked && !canViewLocked;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTitle className="sr-only">{activeTitle || activeAlt}</DialogTitle>
      <p id="viewer-desc" className="sr-only">
        Fullscreen media viewer. Press Escape to close. Use left and right
        arrows to navigate.
      </p>
      <DialogContent
        className="!fixed !inset-0 !top-0 !left-0 !z-[100] !m-0 !flex !h-dvh !max-h-[100dvh] !w-screen !max-w-[100vw] !translate-x-0 !translate-y-0 !items-center !justify-center !rounded-none !border-none !bg-black/95 !p-0 !shadow-none"
        aria-describedby="viewer-desc"
        onMouseMove={handleMouseMove}
      >
        <div
          ref={mediaContainerRef}
          className="relative flex h-full w-full items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onOpenChange(false);
            }
          }}
        >
          {/* Desktop: Close Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="fixed top-4 right-4 z-[101] hidden gap-2 rounded-lg border border-white/20 bg-black/80 px-3 py-2 text-white backdrop-blur-sm hover:bg-black/90 hover:text-white md:flex"
          >
            <X className="h-4 w-4 text-white" />
            <span className="text-sm font-medium text-white">ESC</span>
          </Button>

          {/* Desktop: Prev/Next Controls */}
          {hasCarousel && assets && assets.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrev}
                className={cn(
                  'fixed top-1/2 left-4 z-[101] hidden -translate-y-1/2 rounded-lg border border-white/20 bg-black/80 text-white backdrop-blur-sm transition-opacity duration-300 hover:bg-black/90 md:flex',
                  showControls ? 'opacity-100' : 'pointer-events-none opacity-0'
                )}
                aria-label="Previous"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNext}
                className={cn(
                  'fixed top-1/2 right-4 z-[101] hidden -translate-y-1/2 rounded-lg border border-white/20 bg-black/80 text-white backdrop-blur-sm transition-opacity duration-300 hover:bg-black/90 md:flex',
                  showControls ? 'opacity-100' : 'pointer-events-none opacity-0'
                )}
                aria-label="Next"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </>
          )}

          {/* Thumbnail Strip */}
          {hasCarousel && assets && assets.length > 1 && (
            <div
              className="pointer-events-none fixed right-0 bottom-0 left-0 z-[101] flex items-center justify-center bg-gradient-to-t from-black/80 via-black/60 to-transparent px-4 pt-8 pb-20 md:pb-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                ref={thumbnailStripRef}
                className="pointer-events-auto flex max-w-full gap-2 overflow-x-auto py-2 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {assets.map((asset, index) => (
                  <div
                    key={`${asset.src}-${index}`}
                    className={cn(
                      'flex flex-shrink-0 items-center justify-center transition-all',
                      index === currentIndex ? 'p-1' : 'p-0.5'
                    )}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentIndex(index);
                      }}
                      className={cn(
                        'relative h-16 w-16 overflow-hidden rounded-lg border-2 transition-all md:h-14 md:w-14',
                        index === currentIndex
                          ? 'scale-105 border-white'
                          : 'border-white/30 opacity-60 hover:border-white/50 hover:opacity-80'
                      )}
                    >
                      <div className="relative h-full w-full">
                        <img
                          src={asset.src}
                          alt={asset.alt || `Thumbnail ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mobile: Bottom controls */}
          {hasCarousel && assets && assets.length > 1 ? (
            <div
              className="fixed right-0 bottom-0 left-0 z-[101] flex items-center justify-between gap-2 bg-black/80 p-4 backdrop-blur-sm md:hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                }}
                className="flex-1 rounded-lg border border-white/20 bg-black/50 py-3 text-white hover:bg-black/70"
                aria-label="Previous"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenChange(false);
                }}
                className="flex-1 rounded-lg border border-white/20 bg-black/50 py-3 font-medium text-white hover:bg-black/70"
              >
                Close
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                className="flex-1 rounded-lg border border-white/20 bg-black/50 py-3 text-white hover:bg-black/70"
                aria-label="Next"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          ) : (
            <div
              className="fixed right-0 bottom-0 left-0 z-[101] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm md:hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenChange(false);
                }}
                className="w-full max-w-xs rounded-lg border border-white/20 bg-black/50 py-3 font-medium text-white hover:bg-black/70"
              >
                Close
              </Button>
            </div>
          )}

          {/* Media content */}
          {activeSrc && (
            <ZoomableImage
              key={`${activeSrc}-${currentIndex}`}
              src={activeSrc}
              alt={activeAlt}
              isLocked={isActiveLocked}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface ZoomableImageProps {
  src: string;
  alt: string;
  isLocked?: boolean;
}

function ZoomableImage({ src, alt, isLocked = false }: ZoomableImageProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchStateRef = useRef<{
    initialDistance: number;
    initialScale: number;
  } | null>(null);

  const MIN_SCALE = 1;
  const MAX_SCALE = 8;
  const [scale, setScale] = useState<number>(1);
  const [translateX, setTranslateX] = useState<number>(0);
  const [translateY, setTranslateY] = useState<number>(0);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fullImageLoaded, setFullImageLoaded] = useState<boolean>(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  const clamp = useCallback((value: number, min: number, max: number) => {
    return Math.min(Math.max(value, min), max);
  }, []);

  const getPanBounds = useCallback(() => {
    const container = containerRef.current;
    const img = imageRef.current;
    if (!container || !img) return { maxX: Infinity, maxY: Infinity };

    const rect = container.getBoundingClientRect();
    const containerW = rect.width;
    const containerH = rect.height;

    const naturalW = img.naturalWidth || containerW;
    const naturalH = img.naturalHeight || containerH;
    const containerRatio = containerW / containerH;
    const imageRatio = naturalW / naturalH;

    let baseW: number;
    let baseH: number;
    if (imageRatio > containerRatio) {
      baseW = containerW;
      baseH = containerW / imageRatio;
    } else {
      baseH = containerH;
      baseW = containerH * imageRatio;
    }

    const displayW = baseW * scale;
    const displayH = baseH * scale;

    const maxX = Math.max(0, (displayW - containerW) / 2);
    const maxY = Math.max(0, (displayH - containerH) / 2);
    return { maxX, maxY };
  }, [scale]);

  const applyPanConstraints = useCallback(
    (x: number, y: number) => {
      const { maxX, maxY } = getPanBounds();
      return {
        x: clamp(x, -maxX, maxX),
        y: clamp(y, -maxY, maxY),
      };
    },
    [getPanBounds, clamp]
  );

  const zoomAt = useCallback(
    (deltaScale: number, clientX: number, clientY: number) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const offsetX = clientX - rect.left - rect.width / 2 - translateX;
      const offsetY = clientY - rect.top - rect.height / 2 - translateY;

      const newScale = clamp(scale * deltaScale, MIN_SCALE, MAX_SCALE);
      const scaleRatio = newScale / scale;

      const newTranslateX = translateX - offsetX * (scaleRatio - 1);
      const newTranslateY = translateY - offsetY * (scaleRatio - 1);

      const constrained = applyPanConstraints(newTranslateX, newTranslateY);

      setScale(newScale);
      setTranslateX(constrained.x);
      setTranslateY(constrained.y);
    },
    [scale, translateX, translateY, clamp, applyPanConstraints]
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      if (e.cancelable) {
        e.preventDefault();
      }
      const zoomIntensity = 0.0025;
      const delta = e.deltaY;
      const factor = Math.exp(-delta * zoomIntensity);
      zoomAt(factor, e.clientX, e.clientY);
    },
    [zoomAt]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (
        e.pointerType === 'mouse' &&
        (e.button !== 0 || e.ctrlKey || e.metaKey)
      ) {
        return;
      }
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);

      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pointersRef.current.size === 2) {
        const pts = Array.from(pointersRef.current.values());
        if (pts.length < 2) {
          return;
        }
        const p0 = pts[0];
        const p1 = pts[1];
        if (!p0 || !p1) {
          return;
        }
        const dx = p0.x - p1.x;
        const dy = p0.y - p1.y;
        const distance = Math.hypot(dx, dy);
        pinchStateRef.current = {
          initialDistance: Math.max(1, distance),
          initialScale: scale,
        };
        setIsPanning(false);
        lastPointRef.current = null;
      } else if (pointersRef.current.size === 1) {
        setIsPanning(true);
        lastPointRef.current = { x: e.clientX, y: e.clientY };
      }
    },
    [scale]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (pointersRef.current.has(e.pointerId)) {
        pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      }

      if (pointersRef.current.size === 2 && pinchStateRef.current) {
        const pts = Array.from(pointersRef.current.values());
        if (pts.length < 2) {
          return;
        }
        const p0 = pts[0];
        const p1 = pts[1];
        if (!p0 || !p1) {
          return;
        }
        const dx = p0.x - p1.x;
        const dy = p0.y - p1.y;
        const distance = Math.max(1, Math.hypot(dx, dy));
        const rawScale =
          (pinchStateRef.current.initialScale * distance) /
          pinchStateRef.current.initialDistance;
        const clampedScale = clamp(rawScale, MIN_SCALE, MAX_SCALE);

        const centerX = (p0.x + p1.x) / 2;
        const centerY = (p0.y + p1.y) / 2;
        const factor = clampedScale / scale;
        if (!Number.isFinite(factor) || factor === 1) return;
        zoomAt(factor, centerX, centerY);
        return;
      }

      if (!isPanning || !lastPointRef.current) return;
      const dx = e.clientX - lastPointRef.current.x;
      const dy = e.clientY - lastPointRef.current.y;
      lastPointRef.current = { x: e.clientX, y: e.clientY };

      const nextX = translateX + dx;
      const nextY = translateY + dy;
      const constrained = applyPanConstraints(nextX, nextY);
      setTranslateX(constrained.x);
      setTranslateY(constrained.y);
    },
    [
      isPanning,
      translateX,
      translateY,
      applyPanConstraints,
      clamp,
      zoomAt,
      scale,
    ]
  );

  const handlePointerUp = useCallback(
    (e?: React.PointerEvent<HTMLDivElement>) => {
      if (e) {
        pointersRef.current.delete(e.pointerId);
      }
      if (pointersRef.current.size < 2) {
        pinchStateRef.current = null;
      }
      if (pointersRef.current.size === 0) {
        setIsPanning(false);
        lastPointRef.current = null;
      }
    },
    []
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const nextScale = scale < 2 ? 2 : 1;
      const factor = nextScale / scale;
      zoomAt(factor, e.clientX, e.clientY);
    },
    [scale, zoomAt]
  );

  const resetView = useCallback(() => {
    setScale(1);
    setTranslateX(0);
    setTranslateY(0);
  }, []);

  const previousSrcRef = useRef<string>('');

  useEffect(() => {
    if (previousSrcRef.current !== src) {
      const raf = requestAnimationFrame(() => {
        resetView();
        setIsLoading(true);
        setFullImageLoaded(false);
        previousSrcRef.current = src;
      });
      return () => cancelAnimationFrame(raf);
    }
    return undefined;
  }, [src, resetView]);

  const handleFullImageLoad = useCallback(() => {
    setFullImageLoaded(true);
    setIsLoading(false);
  }, []);

  const handleFullImageError = useCallback(() => {
    setIsLoading(false);
    setFullImageLoaded(true);
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative flex h-full w-full touch-none items-center justify-center overflow-hidden select-none',
        isPanning ? 'cursor-grabbing' : 'cursor-grab'
      )}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onDoubleClick={handleDoubleClick}
      onClick={(e) => e.stopPropagation()}
      role="img"
      aria-label={alt}
    >
      {isLoading && !fullImageLoaded && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <img
            src={src}
            alt={alt}
            className="h-auto max-h-[90vh] w-auto max-w-[90vw] object-contain opacity-50"
          />
        </div>
      )}

      <div className="relative">
        <img
          key={src}
          ref={imageRef}
          src={src}
          alt={alt}
          draggable={false}
          onLoad={handleFullImageLoad}
          onError={handleFullImageError}
          className={cn(
            'max-h-[90vh] max-w-[90vw] object-contain transition-opacity duration-200',
            fullImageLoaded
              ? 'visible opacity-100'
              : 'pointer-events-none invisible opacity-0',
            isLocked && 'blur-2xl'
          )}
          style={{
            transform: `translate3d(${translateX}px, ${translateY}px, 0) scale(${scale})`,
            transition: isPanning ? 'none' : 'transform 60ms ease-out',
            willChange: 'transform',
          }}
        />
        {isLocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-20 pointer-events-none">
            <div className="text-center text-white p-8 max-w-md">
              <Lock className="h-16 w-16 mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">This image is locked</p>
              <p className="text-sm">Sign in & get approved by admin to view</p>
            </div>
          </div>
        )}
      </div>

      {isLoading && (
        <div className="fixed top-4 left-1/2 z-[101] flex -translate-x-1/2 items-center gap-1.5 rounded-lg border border-white/20 bg-black/70 px-2.5 py-1.5 text-xs text-white backdrop-blur-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading full image</span>
        </div>
      )}
    </div>
  );
}

