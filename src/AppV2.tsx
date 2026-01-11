import React, { useEffect, useState } from 'react';
import { PillarColumn } from './components/PillarColumn';

type Company = {
  name: string;
  domain?: string;
  description?: string;
  hq?: string;
  logo?: string;
};

type CategoryData = Company[] | Record<string, Company[]>;

type PillarData = Record<string, CategoryData>;

type PillarStructure = {
  Brain: PillarData;
  Engine: PillarData;
  Megaphone: PillarData;
};

export default function AppV2() {
  const [data, setData] = useState<PillarStructure | null>(null);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Company | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Load data
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/companiesV2.json', { cache: 'no-store' });
        if (!res.ok) throw new Error(`Failed to load companiesV2.json (${res.status})`);
        const json = await res.json();
        setData(json as PillarStructure);
      } catch (e: any) {
        console.error('Failed to load companies:', e);
      }
    }
    load();
  }, []);

  // Track viewport size for responsive tweaks
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const handleChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches);
    };
    setIsMobile(mediaQuery.matches);
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    } else {
      mediaQuery.addListener(handleChange);
      return () => {
        mediaQuery.removeListener(handleChange);
      };
    }
  }, []);

  if (!data) {
    return (
      <div 
        style={{ 
          width: '100vw', 
          height: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          fontFamily: 'Inter, sans-serif',
          color: '#6B7280'
        }}
      >
        Loading data...
      </div>
    );
  }

  return (
    <div 
      className="relative" 
      style={{ 
        backgroundColor: '#FFFFFF',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden' // Fit in one frame - no scrolling
      }}
    >
      {/* Subtle Web-like Background Lines */}
      <svg
        style={{
          position: 'absolute',
          top: isMobile ? 'clamp(60px, 8vh, 80px)' : 'clamp(55px, 7vh, 70px)',
          left: isMobile ? 'clamp(8px, 1.5vw, 16px)' : 'clamp(20px, 2.5vw, 40px)',
          right: isMobile ? 'clamp(8px, 1.5vw, 16px)' : 'clamp(20px, 2.5vw, 40px)',
          bottom: isMobile ? 'clamp(12px, 2vh, 20px)' : 'clamp(16px, 2vh, 24px)',
          pointerEvents: 'none',
          zIndex: 0,
          width: '100%',
          height: '100%'
        }}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {/* Web-like lines connecting the three pillars */}
        {/* Left pillar (16.67%) to Center pillar (50%) */}
        <line
          x1="16.67"
          y1="20"
          x2="50"
          y2="35"
          stroke="#9CA3AF"
          strokeWidth="0.15"
          opacity="0.5"
        />
        <line
          x1="16.67"
          y1="40"
          x2="50"
          y2="50"
          stroke="#9CA3AF"
          strokeWidth="0.15"
          opacity="0.5"
        />
        <line
          x1="16.67"
          y1="60"
          x2="50"
          y2="65"
          stroke="#9CA3AF"
          strokeWidth="0.15"
          opacity="0.5"
        />
        <line
          x1="16.67"
          y1="80"
          x2="50"
          y2="80"
          stroke="#9CA3AF"
          strokeWidth="0.15"
          opacity="0.5"
        />
        {/* Center pillar (50%) to Right pillar (83.33%) */}
        <line
          x1="50"
          y1="25"
          x2="83.33"
          y2="40"
          stroke="#9CA3AF"
          strokeWidth="0.15"
          opacity="0.5"
        />
        <line
          x1="50"
          y1="45"
          x2="83.33"
          y2="55"
          stroke="#9CA3AF"
          strokeWidth="0.15"
          opacity="0.5"
        />
        <line
          x1="50"
          y1="65"
          x2="83.33"
          y2="70"
          stroke="#9CA3AF"
          strokeWidth="0.15"
          opacity="0.5"
        />
        <line
          x1="50"
          y1="85"
          x2="83.33"
          y2="85"
          stroke="#9CA3AF"
          strokeWidth="0.15"
          opacity="0.5"
        />
        {/* Cross-pillar connections (Left to Right) */}
        <line
          x1="16.67"
          y1="30"
          x2="83.33"
          y2="45"
          stroke="#9CA3AF"
          strokeWidth="0.15"
          opacity="0.4"
        />
        <line
          x1="16.67"
          y1="50"
          x2="83.33"
          y2="60"
          stroke="#9CA3AF"
          strokeWidth="0.15"
          opacity="0.4"
        />
        <line
          x1="16.67"
          y1="70"
          x2="83.33"
          y2="75"
          stroke="#9CA3AF"
          strokeWidth="0.15"
          opacity="0.4"
        />
      </svg>
      {/* Header - Compact for single frame */}
      <div 
        className="absolute left-0 right-0 text-center"
        style={{
          top: 'clamp(12px, 2vh, 24px)'
        }}
      >
        <h1 
          className="tracking-tight" 
          style={{ 
            fontFamily: 'Inter, sans-serif',
            fontWeight: 800,
            fontSize: isMobile ? 'clamp(16px, 4vw, 22px)' : 'clamp(22px, 2.2vw, 36px)',
            color: '#003399', // EU blue
            letterSpacing: isMobile ? '-0.03em' : '-0.02em',
            lineHeight: 1.1,
            margin: 0,
            marginBottom: 'clamp(2px, 0.3vh, 4px)'
          }}
        >
          European Political Tech Landscape
        </h1>
        <p 
          style={{ 
            fontFamily: 'Inter, sans-serif',
            fontWeight: 400,
            fontSize: 'clamp(11px, 0.9vw, 14px)',
            color: '#000000',
            margin: 0
          }}
        >
          v2 Prototype · Nov 2025 · Partisan
        </p>
      </div>

      {/* Partisan Logo - Top Left */}
      <img 
        src="/logos/partisan.jpeg"
        alt="Partisan"
        style={{
          position: 'absolute',
          top: 'clamp(12px, 2vh, 24px)',
          left: 'clamp(20px, 2.5vw, 40px)',
          height: isMobile ? 'clamp(48px, 12vw, 66px)' : 'clamp(66px, 6.6vw, 108px)', // 3x the title font size
          width: 'auto',
          objectFit: 'contain',
          maxWidth: 'clamp(150px, 15vw, 200px)' // Prevent overflow
        }}
      />

      {/* 3-Pillar Layout Container - Fit in single viewport frame */}
      <div 
        className="absolute"
        style={{
          top: isMobile ? 'clamp(60px, 8vh, 80px)' : 'clamp(55px, 7vh, 70px)',
          left: isMobile ? 'clamp(8px, 1.5vw, 16px)' : 'clamp(20px, 2.5vw, 40px)',
          right: isMobile ? 'clamp(8px, 1.5vw, 16px)' : 'clamp(20px, 2.5vw, 40px)',
          bottom: isMobile ? 'clamp(12px, 2vh, 20px)' : 'clamp(16px, 2vh, 24px)',
          zIndex: 1 // Ensure content is above background lines
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: isMobile ? 'clamp(12px, 2vh, 18px)' : 'clamp(12px, 1.2vw, 18px)',
            height: '100%',
            width: '100%',
            alignItems: 'stretch'
          }}
        >
          {/* Brain Pillar */}
          <PillarColumn
            pillarName="Brain"
            categories={data.Brain}
            onCompanyClick={(company) => {
              setSelected(company);
              setOpen(true);
            }}
            isMobile={isMobile}
          />

          {/* Engine Pillar */}
          <PillarColumn
            pillarName="Engine"
            categories={data.Engine}
            onCompanyClick={(company) => {
              setSelected(company);
              setOpen(true);
            }}
            isMobile={isMobile}
          />

          {/* Megaphone Pillar */}
          <PillarColumn
            pillarName="Megaphone"
            categories={data.Megaphone}
            onCompanyClick={(company) => {
              setSelected(company);
              setOpen(true);
            }}
            isMobile={isMobile}
          />
        </div>
      </div>

      {/* Company Details Modal */}
      {open && selected && (() => {
        const logoUrl = selected.logo || 
          (selected.domain 
            ? `/logos/${selected.domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].replace(/\./g, '-')}.png`
            : null);
        
        return (
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
                padding: 'clamp(20px, 2vw, 32px)',
                maxWidth: '560px',
                width: '100%',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                fontFamily: 'Inter, sans-serif'
              }}
            >
              {/* Header with Logo and Close Button */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                  {logoUrl && (
                    <div
                      style={{
                        width: 'clamp(80px, 8vw, 120px)',
                        height: 'clamp(80px, 8vw, 120px)',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#F9FAFB',
                        borderRadius: '8px',
                        border: '1px solid #E5E7EB',
                        overflow: 'hidden'
                      }}
                    >
                      <img
                        src={logoUrl}
                        alt={`${selected.name} logo`}
                        style={{
                          maxWidth: '100%',
                          maxHeight: '100%',
                          objectFit: 'contain'
                        }}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h2 style={{ fontSize: 'clamp(18px, 1.5vw, 24px)', fontWeight: 600, color: '#111827', margin: 0, marginBottom: '4px' }}>
                      {selected.name}
                    </h2>
                    {selected.hq && (
                      <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '2px' }}>
                        {selected.hq}
                      </div>
                    )}
                  </div>
                </div>
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
                    padding: '4px',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '4px',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#F3F4F6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              
              {/* URL */}
              {selected.domain && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 500, color: '#6B7280', marginBottom: '4px' }}>
                    URL:
                  </div>
                  <a
                    href={selected.domain.startsWith('http') ? selected.domain : `https://${selected.domain}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      color: '#6B1FA8',
                      textDecoration: 'underline',
                      fontSize: '14px',
                      wordBreak: 'break-all'
                    }}
                  >
                    {selected.domain}
                  </a>
                </div>
              )}
              
              {/* Description */}
              {selected.description && (
                <div style={{ 
                  fontSize: '14px', 
                  color: '#374151', 
                  lineHeight: '1.6',
                  paddingTop: '16px',
                  borderTop: '1px solid #E5E7EB'
                }}>
                  {selected.description}
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
