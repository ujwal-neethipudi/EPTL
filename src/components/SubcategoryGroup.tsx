import React from 'react';

type Company = {
  name: string;
  domain?: string;
  description?: string;
  hq?: string;
  logo?: string;
};

interface SubcategoryGroupProps {
  subcategoryName: string;
  companies: Company[];
  onCompanyClick?: (company: Company) => void;
  isMobile?: boolean;
  logosPerRow?: number; // Optional: specify number of logos per row (e.g., 5 for Legislative & Policy Tracking)
  borderColor?: string; // Border color to match parent category
}

// Helper to get logo URL from company data
function getLogoUrl(company: Company): string | null {
  if (company.logo) {
    return company.logo;
  }
  // Fallback to domain-based logo path if no logo URL
  if (company.domain) {
    // Extract domain and convert to logo filename
    const domain = company.domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    const filename = domain.replace(/\./g, '-') + '.png';
    return `/logos/${filename}`;
  }
  return null;
}

function LogoImage({ url, name, onLoad }: { url: string; name: string; onLoad?: () => void }) {
  const [hasError, setHasError] = React.useState(false);

  if (hasError) {
    return (
      <div 
        style={{
          width: 'clamp(53px, 3.68vw, 64px)', // 5% increase
      height: 'clamp(33px, 2.89vh, 41px)', // 5% increase
          backgroundColor: '#E9D5FF',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Inter, sans-serif',
          fontSize: 'clamp(8px, 0.55vw, 11px)', // 5% increase
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

export function SubcategoryGroup({ subcategoryName, companies, onCompanyClick, isMobile = false, logosPerRow, borderColor = '#E5E7EB' }: SubcategoryGroupProps) {
  // Compact padding for single-frame viewport
  const basePadding = isMobile ? 6 : 8;
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [showScrollIndicator, setShowScrollIndicator] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);
  
  // Check if content is scrollable and handle scroll events
  React.useEffect(() => {
    if (!scrollContainerRef.current) {
      setShowScrollIndicator(false);
      return;
    }
    
    const container = scrollContainerRef.current;
    
    const checkScrollable = () => {
      if (container) {
        const isScrollable = container.scrollHeight > container.clientHeight;
        if (!isScrollable) {
          setShowScrollIndicator(false);
          return;
        }
        // Show indicator only if not scrolled to bottom (with small threshold)
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 10;
        setShowScrollIndicator(!isNearBottom);
      }
    };
    
    const handleScroll = () => {
      if (container) {
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 10;
        setShowScrollIndicator(!isNearBottom);
      }
    };
    
    // Initial check
    checkScrollable();
    
    // Listen to scroll events
    container.addEventListener('scroll', handleScroll);
    // Recheck on resize
    window.addEventListener('resize', checkScrollable);
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', checkScrollable);
    };
  }, [companies]);
  
  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        padding: `${basePadding}px`,
        backgroundColor: '#FFFFFF',
        boxShadow: `0 0 0 1px ${borderColor}`, // Box-shadow respects border-radius and won't be clipped
        borderRadius: '4px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      {/* Subcategory Header - Compact */}
      <h3
        style={{
          fontFamily: 'monospace',
          fontWeight: 600,
          fontSize: isMobile ? 'clamp(10px, 2vw, 12px)' : 'clamp(10px, 0.75vw, 12px)',
          color: '#000000', // Black
          marginBottom: 'clamp(4px, 0.5vh, 6px)',
          paddingBottom: 0,
          marginTop: 0,
          lineHeight: 1.2,
          textAlign: 'center'
        }}
      >
        {subcategoryName}
      </h3>

      {/* Logo Grid - Compact, Centered */}
      {companies.length > 0 ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div
            ref={scrollContainerRef}
            style={{
              flex: 1,
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center', // Center logos, even for odd numbers or incomplete rows
              alignItems: 'flex-start',
              alignContent: 'flex-start',
              gap: 'clamp(3px, 0.3vw, 5px)',
              overflowY: 'auto', // Allow scrolling within subcategory if needed
            }}
          >
          {companies.map((company, index) => {
            const logoUrl = getLogoUrl(company);
            // Calculate max-width: use logosPerRow if specified, otherwise ensure at least 3 per row
            const targetPerRow = logosPerRow || (companies.length >= 3 ? 3 : companies.length);
            // Calculate: (100% - gaps) / targetPerRow, where gaps = (targetPerRow - 1) * gap
            const maxWidthPerLogo = `calc((100% - ${targetPerRow - 1} * clamp(3px, 0.3vw, 5px)) / ${targetPerRow})`;
            
            return (
              <div
                key={`${company.name}-${index}`}
                onClick={() => onCompanyClick?.(company)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: onCompanyClick ? 'pointer' : 'default',
                  transition: 'opacity 0.2s',
                  padding: 'clamp(2px, 0.2vw, 3px)',
                  flexShrink: 0,
                  width: isMobile 
                    ? 'calc(33.333% - clamp(2px, 0.2vw, 3.33px))' // ~3 columns on mobile
                    : maxWidthPerLogo, // Dynamic: uses logosPerRow if specified, otherwise min 3 per row
                  maxWidth: maxWidthPerLogo, // Cap at this to ensure target per row
                  minWidth: isMobile ? undefined : (logosPerRow === 5 ? 'clamp(44px, 2.75vw, 55px)' : 'clamp(55px, 3.5vw, 66px)') // Smaller min width for 5 per row
                }}
                onMouseEnter={(e) => {
                  if (onCompanyClick) {
                    e.currentTarget.style.opacity = '0.8';
                  }
                }}
                onMouseLeave={(e) => {
                  if (onCompanyClick) {
                    e.currentTarget.style.opacity = '1';
                  }
                }}
              >
                {/* Logo - Compact */}
                <div
                  style={{
                    width: isMobile 
                      ? 'clamp(53px, 6.93vw, 64px)' 
                      : 'clamp(58px, 4.04vw, 69px)', // Logo fits within container width (5% increase)
                    height: isMobile 
                      ? 'clamp(33px, 4.04vh, 41px)' 
                      : 'clamp(35px, 2.89vh, 42px)', // 5% increase
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 'clamp(2px, 0.3vw, 4px)',
                    flexShrink: 0
                  }}
                >
                  {logoUrl ? (
                    <LogoImage url={logoUrl} name={company.name} />
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
                        fontSize: 'clamp(8px, 0.63vw, 11px)', // 5% increase
                        fontWeight: 500,
                        color: '#6B1FA8',
                        textAlign: 'center',
                        padding: 'clamp(3px, 0.3vw, 5px)'
                      }}
                    >
                      {company.name.substring(0, 8)}
                    </div>
                  )}
                </div>

                {/* Company Name - Compact */}
                <div
                  style={{
                    width: '100%',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: isMobile ? 'clamp(8px, 1.58vw, 9px)' : 'clamp(8px, 0.63vw, 11px)', // 5% increase
                    fontWeight: 500,
                    color: '#374151',
                    textAlign: 'center',
                    lineHeight: '1.2',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    wordBreak: 'break-word'
                  }}
                  title={company.name}
                >
                  {company.name}
                </div>
              </div>
            );
          })}
          </div>
          
          {/* Scroll Indicator Icon - Visible on hover for all scrollable subcategories */}
          {showScrollIndicator && isHovered && (
            <div
              style={{
                position: 'absolute',
                bottom: 'clamp(4px, 0.5vh, 8px)',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 10,
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <div
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.6)',
                  color: '#FFFFFF',
                  borderRadius: '50%',
                  width: 'clamp(16px, 1.5vw, 20px)',
                  height: 'clamp(16px, 1.5vw, 20px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 'clamp(10px, 0.9vw, 12px)',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                }}
              >
                ↓
              </div>
            </div>
          )}
        </div>
      ) : (
        <div
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 'clamp(11px, 0.8vw, 13px)',
            color: '#9CA3AF',
            textAlign: 'center',
            padding: 'clamp(16px, 1.5vh, 24px)'
          }}
        >
          No companies in this subcategory
        </div>
      )}
    </div>
  );
}
