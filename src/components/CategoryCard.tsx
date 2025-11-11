import React from 'react';

interface Logo {
  url: string;
  name: string;
}

interface CategoryCardProps {
  name: string;
  bgColor: string;
  logos?: Logo[];
}

export function CategoryCard({ name, bgColor, logos = [] }: CategoryCardProps) {
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
          lineHeight: '1.2'
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
              className="flex items-center justify-center"
              style={{
                width: '128px',
                height: '64px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                overflow: 'hidden',
                padding: '8px'
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