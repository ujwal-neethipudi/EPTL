import React, { useState } from 'react';

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
}

// Component to handle logo image with fallback
function LogoImage({ url, name }: { url: string; name: string }) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div 
        style={{
          width: '80px',
          height: '40px',
          backgroundColor: '#E9D5FF',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Inter, sans-serif',
          fontSize: '10px',
          fontWeight: 500,
          color: '#7E22CE',
          textAlign: 'center',
          padding: '4px'
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
        objectFit: 'contain'
      }}
      onError={() => setHasError(true)}
    />
  );
}

export function CategoryCard({ name, bgColor, logos = [], tooltip, onTitleClick, onLogoClick }: CategoryCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  // Show placeholders if no logos provided, otherwise show actual logos
  const items = logos.length > 0 ? logos : Array(8).fill({ url: '', name: 'LOGO' });

  return (
    <div 
      className="relative flex flex-col rounded-[24px]"
      style={{
        backgroundColor: bgColor,
        border: '2px solid #E9D5FF',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        padding: '24px',
        gap: '16px',
        height: '100%'
      }}
    >
      {/* Category Heading */}
      <div style={{ position: 'relative', width: '100%' }}>
        <h2 
          style={{ 
            fontFamily: 'Inter, sans-serif',
            fontWeight: 600,
            fontSize: '24px',
            color: '#7E22CE',
            lineHeight: '1.2',
            textAlign: 'center',
            cursor: onTitleClick ? 'pointer' : (tooltip ? 'help' : 'default'),
            transition: onTitleClick ? 'opacity 0.2s' : 'none'
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
              marginBottom: '8px',
              padding: '8px 12px',
              backgroundColor: '#1F2937',
              color: '#FFFFFF',
              fontSize: '13px',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 400,
              lineHeight: '1.4',
              borderRadius: '6px',
              maxWidth: '280px',
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
          paddingRight: '8px'
        }}
      >
        <div 
          className="flex flex-wrap"
          style={{
            gap: '16px',
            justifyContent: 'center',
            alignItems: 'center'
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
              className="flex flex-col items-center justify-start"
              style={{
                width: '128px',
                minHeight: '90px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                overflow: 'hidden',
                padding: '8px',
                gap: '6px',
                cursor: item.company && onLogoClick ? 'pointer' : 'default',
                transition: 'transform 0.2s, box-shadow 0.2s',
                ...(item.company && onLogoClick ? {
                  ':hover': {
                    transform: 'scale(1.05)',
                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
                  }
                } : {})
              }}
              onMouseEnter={(e) => {
                if (item.company && onLogoClick) {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (item.company && onLogoClick) {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              {/* Logo Container */}
              <div
                style={{
                  width: '100%',
                  height: '48px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                {item.url ? (
                  <LogoImage url={item.url} name={item.name} />
                ) : (
                  <div 
                    style={{
                      width: '80px',
                      height: '40px',
                      backgroundColor: '#E9D5FF',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '10px',
                      fontWeight: 500,
                      color: '#7E22CE',
                      textAlign: 'center',
                      padding: '4px'
                    }}
                  >
                    {item.name.substring(0, 8)}
                  </div>
                )}
              </div>
              
              {/* Company Name */}
              <div
                style={{
                  width: '100%',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '11px',
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