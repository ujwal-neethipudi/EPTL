import React from 'react';

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
  onLogoClick?: (company: Company) => void;
}

export function CategoryCard({ name, bgColor, logos = [], onLogoClick }: CategoryCardProps) {
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
      <h2 
        style={{ 
          fontFamily: 'Inter, sans-serif',
          fontWeight: 600,
          fontSize: '24px',
          color: '#7E22CE',
          lineHeight: '1.2',
          textAlign: 'center'
        }}
      >
        {name}
      </h2>

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
              className="flex items-center justify-center"
              style={{
                width: '128px',
                height: '64px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                overflow: 'hidden',
                padding: '8px',
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
              {item.url ? (
                <img 
                  src={item.url} 
                  alt={item.name}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain'
                  }}
                  onError={(e) => {
                    // Hide broken images
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      parent.innerHTML = `<div style="width: 80px; height: 40px; background-color: #E9D5FF; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-family: Inter, sans-serif; font-size: 10px; font-weight: 500; color: #7E22CE;">${item.name}</div>`;
                    }
                  }}
                />
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
                    color: '#7E22CE'
                  }}
                >
                  {item.name}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}