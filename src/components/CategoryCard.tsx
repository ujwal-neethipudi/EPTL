import React, { useState, useEffect, useCallback, useRef } from 'react';

type Company = {
  name: string;
  domain?: string;
  description?: string;
};

interface Logo {
  url: string;
  name: string;
  company?: Company;
}

interface CategoryCardProps {
  name: string;
  bgColor: string;
  logos?: Logo[];
  tooltip?: string;
  onTitleClick?: () => void;
  onLogoClick?: (company: Company) => void;
  isMobile?: boolean;
}

// Component to handle logo image with fallback
function LogoImage({ url, name, onLoad }: { url: string; name: string; onLoad?: () => void }) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (hasError) {
      onLoad?.();
    }
  }, [hasError, onLoad]);

  if (hasError) {
    return (
      <div 
        style={{
          width: 'clamp(60px, 4.17vw, 80px)',
          height: 'clamp(30px, 2.8vh, 40px)',
          backgroundColor: '#E9D5FF',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Inter, sans-serif',
          fontSize: 'clamp(8px, 0.52vw, 10px)',
          fontWeight: 500,
          color: '#6B1FA8',
          textAlign: 'center',
          padding: 'clamp(3px, 0.21vw, 4px)'
        }}
      >
        {name.substring(0, 8)}
      </div>
    );
  }

  return (
    <img 
      src={url} 
      alt={name}
      style={{
        maxWidth: '100%',
        maxHeight: '100%',
        width: 'auto',
        height: 'auto',
        objectFit: 'contain'
      }}
      onError={() => {
        setHasError(true);
        onLoad?.();
      }}
      onLoad={() => onLoad?.()}
    />
  );
}

export function CategoryCard({ name, bgColor, logos = [], tooltip, onTitleClick, onLogoClick, isMobile = false }: CategoryCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [maxLogoWidth, setMaxLogoWidth] = useState<number | null>(null);
  const logoGridRef = useRef<HTMLDivElement>(null);
  // Show placeholders if no logos provided, otherwise show actual logos
  const items = logos.length > 0 ? logos : Array(8).fill({ url: '', name: 'LOGO' });

  const measureLogoWidths = useCallback(() => {
    if (!logoGridRef.current || !isMobile) {
      setMaxLogoWidth(null);
      return;
    }

    const wrappers = Array.from(
      logoGridRef.current.querySelectorAll<HTMLElement>('.category-card-logo-wrapper')
    );

    let largest = 0;
    wrappers.forEach((wrapper) => {
      const img = wrapper.querySelector('img');
      const width = img?.getBoundingClientRect().width || wrapper.getBoundingClientRect().width;
      if (width > largest) {
        largest = width;
      }
    });

    setMaxLogoWidth(largest ? Math.ceil(largest) : null);
  }, [isMobile]);

  useEffect(() => {
    if (!isMobile) {
      setMaxLogoWidth(null);
      return;
    }
    const frame = requestAnimationFrame(measureLogoWidths);
    return () => cancelAnimationFrame(frame);
  }, [isMobile, logos, measureLogoWidths]);

  useEffect(() => {
    if (!isMobile) return;
    const handleResize = () => measureLogoWidths();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile, measureLogoWidths]);

  const handleLogoLoad = useCallback(() => {
    requestAnimationFrame(measureLogoWidths);
  }, [measureLogoWidths]);

  return (
    <div 
      className="relative flex flex-col rounded-[24px]"
      style={{
        backgroundColor: '#FFFFFF',
        border: '2px solid #000000',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        padding: 'clamp(12px, 1.25vw, 24px)',
        paddingTop: isMobile ? 'clamp(40px, 8vw, 60px)' : 'clamp(12px, 1.25vw, 24px)',
        gap: 'clamp(8px, 0.83vw, 16px)',
        height: '100%'
      }}
    >
      {/* Category Heading */}
      <div 
        style={{ 
          position: 'relative', 
          width: '100%',
          display: 'flex',
          justifyContent: 'center'
        }}
      >
        <h2 
          className={isMobile ? 'category-title category-title-mobile' : 'category-title'}
          style={{ 
            fontFamily: 'Inter, sans-serif',
            fontWeight: 600,
            fontSize: 'clamp(14px, 1.1vw, 20px)',
            color: '#6B1FA8',
            lineHeight: '1.2',
            textAlign: 'center',
            cursor: onTitleClick ? 'pointer' : (tooltip ? 'help' : 'default'),
            transition: onTitleClick ? 'opacity 0.2s' : 'none',
            position: isMobile ? 'absolute' : 'relative',
            top: isMobile ? 0 : 'auto',
            left: isMobile ? '50%' : 'auto',
            transform: isMobile ? 'translate(-50%, -50%)' : 'none',
            zIndex: 2,
            padding: isMobile ? '0 clamp(10px, 3vw, 18px)' : 0
          }}
          onMouseEnter={() => tooltip && setShowTooltip(true)}
          onMouseLeave={(e) => {
            if (onTitleClick) {
              e.currentTarget.style.opacity = '1';
            }
            setShowTooltip(false);
          }}
          onClick={onTitleClick}
          onMouseDown={(e) => {
            if (onTitleClick) {
              e.currentTarget.style.opacity = '0.7';
            }
          }}
          onMouseUp={(e) => {
            if (onTitleClick) {
              e.currentTarget.style.opacity = '1';
            }
          }}
        >
          {name}
        </h2>
        {tooltip && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '100%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      marginBottom: 'clamp(4px, 0.42vw, 8px)',
                      padding: 'clamp(6px, 0.625vw, 8px) clamp(8px, 0.625vw, 12px)',
                      backgroundColor: '#1F2937',
                      color: '#FFFFFF',
                      fontSize: 'clamp(11px, 0.68vw, 13px)',
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 400,
                      lineHeight: '1.4',
                      borderRadius: '6px',
                      maxWidth: 'clamp(200px, 14.6vw, 280px)',
                      textAlign: 'center',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                      opacity: showTooltip ? 1 : 0,
                      visibility: showTooltip ? 'visible' : 'hidden',
                      transition: 'opacity 0.2s, visibility 0.2s',
                      pointerEvents: 'none',
                      zIndex: 1000,
                      wordWrap: 'break-word'
                    }}
                  >
            {tooltip}
            {/* Tooltip arrow */}
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 0,
                height: 0,
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: '6px solid #1F2937'
              }}
            />
          </div>
        )}
      </div>

      {/* Logo Grid */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          paddingRight: 'clamp(4px, 0.42vw, 8px)'
        }}
      >
        <div 
          className="category-card-logo-grid flex flex-wrap"
          ref={logoGridRef}
          style={{
            width: '100%',
            gap: 'clamp(5px, 0.6vw, 8px)',
            justifyContent: 'center',
            alignItems: 'flex-start',
            alignContent: 'flex-start'
          }}
        >
          {items.map((item, index) => (
            <div
              key={index}
              onClick={() => {
                if (item.company && onLogoClick) {
                  onLogoClick(item.company);
                }
              }}
              className="category-card-logo-item flex flex-col items-center justify-start"
              style={{
                cursor: item.company && onLogoClick ? 'pointer' : 'default',
                transition: 'opacity 0.2s',
                flexShrink: 0
              }}
              onMouseEnter={(e) => {
                if (item.company && onLogoClick) {
                  e.currentTarget.style.opacity = '0.8';
                }
              }}
              onMouseLeave={(e) => {
                if (item.company && onLogoClick) {
                  e.currentTarget.style.opacity = '1';
                }
              }}
            >
              {/* Logo - Direct display without container */}
              <div
                className="category-card-logo-wrapper"
                style={{
                  width: isMobile && maxLogoWidth ? `${maxLogoWidth}px` : 'clamp(70px, 6vw, 100px)',
                  maxWidth: '100%',
                  height: 'clamp(45px, 4.5vh, 65px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginBottom: 'clamp(3px, 0.4vw, 5px)'
                }}
              >
                {item.url ? (
                  <LogoImage url={item.url} name={item.name} onLoad={handleLogoLoad} />
                ) : (
                  <div 
                    style={{
                      width: '100%',
                      height: '100%',
                      backgroundColor: '#E9D5FF',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'Inter, sans-serif',
                      fontSize: 'clamp(10px, 0.75vw, 12px)',
                      fontWeight: 500,
                      color: '#6B1FA8',
                      textAlign: 'center',
                      padding: 'clamp(5px, 0.5vw, 7px)'
                    }}
                  >
                    {item.name.substring(0, 10)}
                  </div>
                )}
              </div>
              
              {/* Company Name - No container */}
              <div
                className="company-name-label"
                style={{
                  width: '100%',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 'clamp(9px, 0.65vw, 12px)',
                  fontWeight: 500,
                  color: '#374151',
                  textAlign: 'center',
                  lineHeight: '1.3',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  wordBreak: 'break-word'
                }}
                title={item.name}
              >
                {item.name}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}