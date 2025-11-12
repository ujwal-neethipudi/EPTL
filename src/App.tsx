import React, { useEffect, useState, useMemo } from 'react';
import { CategoryCard } from './components/CategoryCard';
import { ConnectionArrows } from './components/ConnectionArrows';

type Company = {
  name: string;
  domain?: string;
  description?: string;
};

type CompaniesByCategory = Record<string, Company[]>;

// Helper to map domain to logo filename
// Logo files are named like: change-org.png, datack-com.ico, engagingnetworks-net.png
function domainToLogoPath(domain: string): string | null {
  if (!domain) return null;
  
  // Normalize domain: remove protocol, www, trailing slash, get just the domain
  let normalized = domain.toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0]
    .split('?')[0]; // Remove query params
  
  // Replace dots with hyphens: change.org -> change-org
  normalized = normalized.replace(/\./g, '-');
  
  // Return .png as default (browser will handle 404s for missing files)
  return `/logos/${normalized}.png`;
}

export default function App() {
  const [data, setData] = useState<CompaniesByCategory | null>(null);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Company | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/companies.json', { cache: 'no-store' });
        if (!res.ok) throw new Error(`Failed to load companies.json (${res.status})`);
        const json = await res.json();
        setData(json as CompaniesByCategory);
      } catch (e: any) {
        console.error('Failed to load companies:', e);
      }
    }
    load();
  }, []);

  const categories = useMemo(() => {
    const companiesByCategory = (data ?? {}) as CompaniesByCategory;
    const categoryMap = {
      messaging: { name: 'Messaging & Media', bgColor: '#F3E8FF', key: 'Messaging & Media' },
      engagement: { name: 'Engagement & Mobilisation', bgColor: '#F5E1FF', key: 'Engagement & Mobilisation' },
      fundraising: { name: 'Fundraising', bgColor: '#EBD6FF', key: 'Fundraising' },
      research: { name: 'Research & Insights', bgColor: '#EFE3FF', key: 'Research & Insights' },
      analytics: { name: 'Data Analytics & Modeling', bgColor: '#EAD6FF', key: 'Data Analytics & Modeling' },
      govtech: { name: 'GovTech / Civic Infrastructure', bgColor: '#E9D5FF', key: 'GovTech / Civic Infrastructure' },
      voting: { name: 'Voting Tech', bgColor: '#E7D0FF', key: 'Voting Tech' },
      infrastructure: { name: 'Organisational Infrastructure', bgColor: '#F6ECFF', key: 'Organisational Infrastructure' },
    };

    return Object.entries(categoryMap).map(([id, config]) => {
      const companies = companiesByCategory[config.key] ?? [];
      const logos = companies.map(company => ({
        url: company.domain ? domainToLogoPath(company.domain) || '' : '',
        name: company.name,
        company: company // Pass full company data for click handler
      }));

      return {
        id,
        name: config.name,
        bgColor: config.bgColor,
        logos,
        position: {
          row: id === 'messaging' || id === 'engagement' || id === 'fundraising' || id === 'research' ? 0 : 1,
          col: id === 'messaging' || id === 'analytics' ? 0 : id === 'engagement' || id === 'govtech' ? 1 : id === 'fundraising' || id === 'voting' ? 2 : 3
        }
      };
    });
  }, [data]);

  return (
    <div className="w-[1920px] h-[1080px] relative" style={{ backgroundColor: '#FAF8FF' }}>
      {/* Header */}
      <div className="absolute top-[40px] left-0 right-0 text-center">
        <h1 
          className="tracking-tight" 
          style={{ 
            fontFamily: 'Inter, sans-serif',
            fontWeight: 800,
            fontSize: '56px',
            color: '#7E22CE',
            letterSpacing: '-0.56px'
          }}
        >
          European Political Tech Landscape
        </h1>
        <p 
          className="mt-2" 
          style={{ 
            fontFamily: 'Inter, sans-serif',
            fontWeight: 400,
            fontSize: '20px',
            color: '#6B7280'
          }}
        >
          Prototype · Nov 2025 · Partisan
        </p>
      </div>

      {/* Version Label */}
      <div 
        className="absolute top-[40px] left-[60px]"
        style={{ 
          fontFamily: 'Inter, sans-serif',
          fontWeight: 600,
          fontSize: '14px',
          color: '#7E22CE',
          backgroundColor: '#F3E8FF',
          padding: '8px 16px',
          borderRadius: '8px',
          border: '1.5px solid #E9D5FF'
        }}
      >
        v1 Prototype
      </div>

      {/* Connection Arrows - Behind cards */}
      <ConnectionArrows />

      {/* Grid Container */}
      <div 
        className="absolute"
        style={{
          top: '200px',
          left: '60px',
          right: '60px',
          bottom: '120px',
        }}
      >
        <div 
          className="grid grid-cols-4 grid-rows-2 h-full"
          style={{
            gap: '48px'
          }}
        >
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              name={category.name}
              bgColor={category.bgColor}
              logos={category.logos}
              onLogoClick={(company) => {
                setSelected(company);
                setOpen(true);
              }}
            />
          ))}
        </div>
      </div>

      {/* Company Details Modal */}
      {open && selected && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setOpen(false);
              setSelected(null);
            }
          }}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '500px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              fontFamily: 'Inter, sans-serif'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#111827', margin: 0 }}>
                {selected.name}
              </h2>
              <button
                onClick={() => {
                  setOpen(false);
                  setSelected(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6B7280',
                  padding: 0,
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            
            {selected.domain ? (
              <div style={{ marginBottom: '16px' }}>
                <a
                  href={selected.domain.startsWith('http') ? selected.domain : `https://${selected.domain}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    color: '#7E22CE',
                    textDecoration: 'underline',
                    fontSize: '14px'
                  }}
                >
                  {selected.domain}
                </a>
              </div>
            ) : (
              <div style={{ marginBottom: '16px', color: '#9CA3AF', fontSize: '14px' }}>
                No website available
              </div>
            )}
            
            <div style={{ fontSize: '14px', color: '#374151', lineHeight: '1.6' }}>
              {selected.description || 'No description available.'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}