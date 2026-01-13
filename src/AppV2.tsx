import React, { useEffect, useState, useMemo } from 'react';
import { Maximize2, X, Search } from 'lucide-react';
import { PillarColumn } from './components/PillarColumn';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Input } from './components/ui/input';

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
  const [selectedCountry, setSelectedCountry] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [maximizedBox, setMaximizedBox] = useState<{
    type: 'category' | 'subcategory';
    categoryName: string;
    subcategoryName?: string;
    pillarName: string;
  } | null>(null);

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

  // Extract unique countries from data
  const countries = useMemo(() => {
    if (!data) return [];
    const countrySet = new Set<string>();
    Object.values(data).forEach((pillar) => {
      Object.values(pillar).forEach((category) => {
        const companies = Array.isArray(category) ? category : Object.values(category).flat();
        companies.forEach((company) => {
          if (company.hq) {
            countrySet.add(company.hq);
          }
        });
      });
    });
    return Array.from(countrySet).sort();
  }, [data]);

  // Filter data by selected country and search query - keep structure, filter only companies
  const filteredData = useMemo(() => {
    if (!data) return data;
    
    const filterCompanies = (companies: Company[]): Company[] => {
      let filtered = companies;
      
      // Filter by country
      if (selectedCountry !== 'All') {
        filtered = filtered.filter(company => company.hq === selectedCountry);
      }
      
      // Filter by search query (company name)
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim();
        filtered = filtered.filter(company => 
          company.name.toLowerCase().includes(query)
        );
      }
      
      return filtered;
    };

    const filtered: PillarStructure = {
      Brain: {},
      Engine: {},
      Megaphone: {}
    };

    // Keep all categories and subcategories, just filter the companies
    Object.entries(data).forEach(([pillarName, categories]) => {
      const filteredCategories: Record<string, CategoryData> = {};
      Object.entries(categories).forEach(([categoryName, categoryData]) => {
        if (Array.isArray(categoryData)) {
          // Flat category - filter companies but keep structure
          filteredCategories[categoryName] = filterCompanies(categoryData);
        } else {
          // Category with subcategories - filter companies in each subcategory but keep all subcategories
          const filteredSubcats: Record<string, Company[]> = {};
          Object.entries(categoryData).forEach(([subcatName, companies]) => {
            filteredSubcats[subcatName] = filterCompanies(companies);
          });
          filteredCategories[categoryName] = filteredSubcats;
        }
      });
      filtered[pillarName as keyof PillarStructure] = filteredCategories;
    });

    return filtered;
  }, [data, selectedCountry, searchQuery]);

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
        {/* Web-like lines connecting the three pillars - Dense criss-cross pattern */}
        {/* Lines stay within map bounds: Y from ~15% (after header) to ~85% (before bottom) */}
        {/* Left pillar (16.67%) to Center pillar (50%) */}
        {/* More lines to first row */}
        <line x1="16.67" y1="15" x2="50" y2="22" stroke="#003399" strokeWidth="0.25" opacity="0.35" />
        <line x1="16.67" y1="18" x2="50" y2="25" stroke="#003399" strokeWidth="0.25" opacity="0.35" />
        <line x1="16.67" y1="20" x2="50" y2="28" stroke="#003399" strokeWidth="0.25" opacity="0.35" />
        <line x1="16.67" y1="22" x2="50" y2="30" stroke="#003399" strokeWidth="0.25" opacity="0.35" />
        <line x1="16.67" y1="25" x2="50" y2="32" stroke="#003399" strokeWidth="0.25" opacity="0.35" />
        <line x1="16.67" y1="28" x2="50" y2="34" stroke="#003399" strokeWidth="0.25" opacity="0.35" />
        <line x1="16.67" y1="30" x2="50" y2="36" stroke="#003399" strokeWidth="0.25" opacity="0.35" />
        <line x1="16.67" y1="33" x2="50" y2="38" stroke="#003399" strokeWidth="0.25" opacity="0.35" />
        <line x1="16.67" y1="35" x2="50" y2="40" stroke="#003399" strokeWidth="0.25" opacity="0.35" />
        <line x1="16.67" y1="38" x2="50" y2="42" stroke="#003399" strokeWidth="0.25" opacity="0.35" />
        <line x1="16.67" y1="40" x2="50" y2="44" stroke="#003399" strokeWidth="0.25" opacity="0.35" />
        <line x1="16.67" y1="43" x2="50" y2="46" stroke="#003399" strokeWidth="0.25" opacity="0.35" />
        <line x1="16.67" y1="45" x2="50" y2="48" stroke="#003399" strokeWidth="0.25" opacity="0.35" />
        <line x1="16.67" y1="48" x2="50" y2="50" stroke="#003399" strokeWidth="0.25" opacity="0.35" />
        <line x1="16.67" y1="50" x2="50" y2="52" stroke="#003399" strokeWidth="0.25" opacity="0.35" />
        <line x1="16.67" y1="53" x2="50" y2="54" stroke="#003399" strokeWidth="0.25" opacity="0.35" />
        <line x1="16.67" y1="55" x2="50" y2="56" stroke="#003399" strokeWidth="0.25" opacity="0.35" />
        <line x1="16.67" y1="58" x2="50" y2="58" stroke="#003399" strokeWidth="0.25" opacity="0.35" />
        <line x1="16.67" y1="60" x2="50" y2="60" stroke="#003399" strokeWidth="0.25" opacity="0.35" />
        <line x1="16.67" y1="63" x2="50" y2="62" stroke="#003399" strokeWidth="0.25" opacity="0.35" />
        <line x1="16.67" y1="65" x2="50" y2="64" stroke="#003399" strokeWidth="0.25" opacity="0.35" />
        <line x1="16.67" y1="68" x2="50" y2="66" stroke="#003399" strokeWidth="0.25" opacity="0.35" />
        <line x1="16.67" y1="70" x2="50" y2="68" stroke="#003399" strokeWidth="0.25" opacity="0.35" />
        <line x1="16.67" y1="73" x2="50" y2="70" stroke="#003399" strokeWidth="0.25" opacity="0.35" />
        <line x1="16.67" y1="75" x2="50" y2="72" stroke="#003399" strokeWidth="0.25" opacity="0.35" />
        <line x1="16.67" y1="78" x2="50" y2="74" stroke="#003399" strokeWidth="0.25" opacity="0.35" />
        <line x1="16.67" y1="80" x2="50" y2="76" stroke="#003399" strokeWidth="0.25" opacity="0.35" />
        {/* Center pillar (50%) to Right pillar (83.33%) */}
        {/* More lines to first row */}
        <line x1="50" y1="18" x2="83.33" y2="26" stroke="#003399" strokeWidth="0.25" opacity="0.35" />
        <line x1="50" y1="20" x2="83.33" y2="28" stroke="#003399" strokeWidth="0.25" opacity="0.35" />
        <line x1="50" y1="22" x2="83.33" y2="30" stroke="#003399" strokeWidth="0.25" opacity="0.35" />
        <line x1="50" y1="24" x2="83.33" y2="32" stroke="#003399" strokeWidth="0.25" opacity="0.35" />
        <line x1="50" y1="28" x2="83.33" y2="35" stroke="#003399" strokeWidth="0.25" opacity="0.35" />
        <line x1="50" y1="31" x2="83.33" y2="37" stroke="#003399" strokeWidth="0.25" opacity="0.35" />
        <line x1="50" y1="34" x2="83.33" y2="40" stroke="#003399" strokeWidth="0.25" opacity="0.35" />
        <line x1="50" y1="37" x2="83.33" y2="42" stroke="#003399" strokeWidth="0.25" opacity="0.35" />
        <line x1="50" y1="40" x2="83.33" y2="45" stroke="#003399" strokeWidth="0.25" opacity="0.35" />
        <line x1="50" y1="43" x2="83.33" y2="47" stroke="#003399" strokeWidth="0.25" opacity="0.35" />
        <line x1="50" y1="46" x2="83.33" y2="50" stroke="#003399" strokeWidth="0.25" opacity="0.35" />
        <line x1="50" y1="49" x2="83.33" y2="52" stroke="#003399" strokeWidth="0.25" opacity="0.35" />
        <line x1="50" y1="52" x2="83.33" y2="55" stroke="#003399" strokeWidth="0.25" opacity="0.35" />
        <line x1="50" y1="55" x2="83.33" y2="57" stroke="#003399" strokeWidth="0.25" opacity="0.35" />
        <line x1="50" y1="58" x2="83.33" y2="60" stroke="#003399" strokeWidth="0.25" opacity="0.35" />
        <line x1="50" y1="61" x2="83.33" y2="62" stroke="#003399" strokeWidth="0.25" opacity="0.35" />
        <line x1="50" y1="64" x2="83.33" y2="65" stroke="#003399" strokeWidth="0.25" opacity="0.35" />
        <line x1="50" y1="67" x2="83.33" y2="67" stroke="#003399" strokeWidth="0.25" opacity="0.35" />
        <line x1="50" y1="70" x2="83.33" y2="70" stroke="#003399" strokeWidth="0.25" opacity="0.35" />
        <line x1="50" y1="73" x2="83.33" y2="72" stroke="#003399" strokeWidth="0.25" opacity="0.35" />
        <line x1="50" y1="76" x2="83.33" y2="75" stroke="#003399" strokeWidth="0.25" opacity="0.35" />
        <line x1="50" y1="79" x2="83.33" y2="77" stroke="#003399" strokeWidth="0.25" opacity="0.35" />
        <line x1="50" y1="82" x2="83.33" y2="80" stroke="#003399" strokeWidth="0.25" opacity="0.35" />
        {/* Cross-pillar connections (Left to Right) - Criss-cross pattern */}
        {/* More lines to first row */}
        <line x1="16.67" y1="15" x2="83.33" y2="25" stroke="#003399" strokeWidth="0.25" opacity="0.3" />
        <line x1="16.67" y1="18" x2="83.33" y2="28" stroke="#003399" strokeWidth="0.25" opacity="0.3" />
        <line x1="16.67" y1="20" x2="83.33" y2="30" stroke="#003399" strokeWidth="0.25" opacity="0.3" />
        <line x1="16.67" y1="22" x2="83.33" y2="32" stroke="#003399" strokeWidth="0.25" opacity="0.3" />
        <line x1="16.67" y1="25" x2="83.33" y2="35" stroke="#003399" strokeWidth="0.25" opacity="0.3" />
        <line x1="16.67" y1="28" x2="83.33" y2="38" stroke="#003399" strokeWidth="0.25" opacity="0.3" />
        <line x1="16.67" y1="31" x2="83.33" y2="41" stroke="#003399" strokeWidth="0.25" opacity="0.3" />
        <line x1="16.67" y1="34" x2="83.33" y2="44" stroke="#003399" strokeWidth="0.25" opacity="0.3" />
        <line x1="16.67" y1="37" x2="83.33" y2="47" stroke="#003399" strokeWidth="0.25" opacity="0.3" />
        <line x1="16.67" y1="40" x2="83.33" y2="50" stroke="#003399" strokeWidth="0.25" opacity="0.3" />
        <line x1="16.67" y1="43" x2="83.33" y2="53" stroke="#003399" strokeWidth="0.25" opacity="0.3" />
        <line x1="16.67" y1="46" x2="83.33" y2="56" stroke="#003399" strokeWidth="0.25" opacity="0.3" />
        <line x1="16.67" y1="49" x2="83.33" y2="59" stroke="#003399" strokeWidth="0.25" opacity="0.3" />
        <line x1="16.67" y1="52" x2="83.33" y2="62" stroke="#003399" strokeWidth="0.25" opacity="0.3" />
        <line x1="16.67" y1="55" x2="83.33" y2="65" stroke="#003399" strokeWidth="0.25" opacity="0.3" />
        <line x1="16.67" y1="58" x2="83.33" y2="68" stroke="#003399" strokeWidth="0.25" opacity="0.3" />
        <line x1="16.67" y1="61" x2="83.33" y2="71" stroke="#003399" strokeWidth="0.25" opacity="0.3" />
        <line x1="16.67" y1="64" x2="83.33" y2="74" stroke="#003399" strokeWidth="0.25" opacity="0.3" />
        <line x1="16.67" y1="67" x2="83.33" y2="76" stroke="#003399" strokeWidth="0.25" opacity="0.3" />
        <line x1="16.67" y1="70" x2="83.33" y2="78" stroke="#003399" strokeWidth="0.25" opacity="0.3" />
        {/* Reverse criss-cross (Right to Left) */}
        {/* More lines to first row */}
        <line x1="83.33" y1="18" x2="16.67" y2="28" stroke="#003399" strokeWidth="0.25" opacity="0.25" />
        <line x1="83.33" y1="20" x2="16.67" y2="30" stroke="#003399" strokeWidth="0.25" opacity="0.25" />
        <line x1="83.33" y1="22" x2="16.67" y2="32" stroke="#003399" strokeWidth="0.25" opacity="0.25" />
        <line x1="83.33" y1="26" x2="16.67" y2="36" stroke="#003399" strokeWidth="0.25" opacity="0.25" />
        <line x1="83.33" y1="30" x2="16.67" y2="42" stroke="#003399" strokeWidth="0.25" opacity="0.25" />
        <line x1="83.33" y1="34" x2="16.67" y2="46" stroke="#003399" strokeWidth="0.25" opacity="0.25" />
        <line x1="83.33" y1="38" x2="16.67" y2="52" stroke="#003399" strokeWidth="0.25" opacity="0.25" />
        <line x1="83.33" y1="42" x2="16.67" y2="58" stroke="#003399" strokeWidth="0.25" opacity="0.25" />
        <line x1="83.33" y1="46" x2="16.67" y2="62" stroke="#003399" strokeWidth="0.25" opacity="0.25" />
        <line x1="83.33" y1="50" x2="16.67" y2="66" stroke="#003399" strokeWidth="0.25" opacity="0.25" />
        <line x1="83.33" y1="54" x2="16.67" y2="72" stroke="#003399" strokeWidth="0.25" opacity="0.25" />
        <line x1="83.33" y1="58" x2="16.67" y2="75" stroke="#003399" strokeWidth="0.25" opacity="0.25" />
        <line x1="83.33" y1="62" x2="16.67" y2="78" stroke="#003399" strokeWidth="0.25" opacity="0.25" />
        <line x1="83.33" y1="66" x2="16.67" y2="80" stroke="#003399" strokeWidth="0.25" opacity="0.25" />
        <line x1="83.33" y1="70" x2="16.67" y2="82" stroke="#003399" strokeWidth="0.25" opacity="0.25" />
      </svg>
      {/* Filters - Top Right */}
      <div
        className="absolute"
        style={{
          top: isMobile ? 'clamp(12px, 2vh, 24px)' : 'clamp(12px, 2vh, 24px)',
          right: isMobile ? 'clamp(8px, 1.5vw, 16px)' : 'clamp(20px, 2.5vw, 40px)',
          zIndex: 10000,
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
          alignItems: 'flex-end'
        }}
      >
        {/* Country Filter */}
        <Select value={selectedCountry} onValueChange={setSelectedCountry}>
          <SelectTrigger
            className="!border-none !bg-transparent !shadow-none hover:!bg-transparent focus:!bg-transparent [&_svg]:!text-black"
            style={{
              width: isMobile ? 'clamp(120px, 25vw, 160px)' : 'clamp(140px, 12vw, 180px)',
              fontSize: isMobile ? 'clamp(11px, 2vw, 13px)' : 'clamp(12px, 0.9vw, 14px)',
              height: isMobile ? 'clamp(28px, 5vw, 32px)' : 'clamp(32px, 2.5vw, 36px)',
              padding: 0,
              border: 'none',
              backgroundColor: 'transparent',
              boxShadow: 'none',
              fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'
            }}
          >
            <SelectValue placeholder="Filter by country" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} />
          </SelectTrigger>
          <SelectContent 
            className="!z-[10001] !bg-white [&_[data-slot=select-item]>span]:hidden !max-h-[200px] !overflow-y-auto" 
            style={{ zIndex: 10001, backgroundColor: '#FFFFFF', fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', cursor: 'default', maxHeight: '200px', overflowY: 'auto' }}
            onCloseAutoFocus={(e) => e.preventDefault()}
          >
            <SelectItem value="All" className="!cursor-pointer !pr-2 [&>span]:hidden" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', cursor: 'pointer', fontSize: isMobile ? 'clamp(10px, 1.8vw, 12px)' : 'clamp(11px, 0.8vw, 13px)' }}>
              All Countries
            </SelectItem>
            {countries.map((country) => (
              <SelectItem key={country} value={country} className="!cursor-pointer !pr-2 [&>span]:hidden" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', cursor: 'pointer', fontSize: isMobile ? 'clamp(10px, 1.8vw, 12px)' : 'clamp(11px, 0.8vw, 13px)' }}>
                {country}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Search by Company */}
        <div
          style={{
            position: 'relative',
            width: isMobile ? 'clamp(120px, 25vw, 160px)' : 'clamp(140px, 12vw, 180px)',
            height: isMobile ? 'clamp(28px, 5vw, 32px)' : 'clamp(32px, 2.5vw, 36px)',
            marginTop: isMobile ? '-4px' : '-6px'
          }}
        >
          <Search
            size={isMobile ? 14 : 16}
            style={{
              position: 'absolute',
              left: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#666',
              pointerEvents: 'none',
              zIndex: 1
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: isMobile ? '4px' : '6px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2,
                color: '#666'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#000';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#666';
              }}
            >
              <X size={isMobile ? 12 : 14} />
            </button>
          )}
          <Input
            type="text"
            placeholder="Search by company"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="!border-none !bg-transparent !shadow-none focus-visible:!ring-0 focus-visible:!ring-offset-0 pl-6 pr-2 search-company-input"
            style={{
              width: '100%',
              height: isMobile ? 'clamp(28px, 5vw, 32px)' : 'clamp(32px, 2.5vw, 36px)',
              fontSize: isMobile ? 'clamp(11px, 2vw, 13px)' : 'clamp(12px, 0.9vw, 14px)',
              paddingLeft: isMobile ? '20px' : '22px',
              paddingRight: searchQuery ? (isMobile ? '20px' : '24px') : (isMobile ? '8px' : '10px'),
              fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
              backgroundColor: 'transparent',
              border: 'none',
              boxShadow: 'none',
              outline: 'none'
            }}
          />
        </div>
      </div>

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
            fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
            fontWeight: 800,
            fontSize: isMobile ? 'clamp(16px, 4vw, 22px)' : 'clamp(22px, 2.2vw, 36px)',
            color: '#001A66', // Darker blue
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
            fontFamily: 'monospace',
            fontWeight: 400,
            fontSize: 'clamp(11px, 0.9vw, 14px)',
            color: '#000000',
            margin: 0
          }}
        >
          v2 Prototype. Jan 2026. Political Tech Summit
        </p>
      </div>

      {/* Partisan and PTS Logos - Top Left */}
      <div
        style={{
          position: 'absolute',
          top: 'clamp(12px, 2vh, 24px)',
          left: 'clamp(20px, 2.5vw, 40px)',
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(8px, 1vw, 12px)'
        }}
      >
        <img 
          src="/logos/partisan.jpeg"
          alt="Partisan"
          style={{
            height: isMobile ? 'clamp(48px, 12vw, 66px)' : 'clamp(66px, 6.6vw, 108px)', // Original size
            width: 'auto',
            objectFit: 'contain',
            maxWidth: 'clamp(150px, 15vw, 200px)' // Prevent overflow
          }}
        />
        <img 
          src="/logos/pts.png"
          alt="PTS"
          style={{
            height: isMobile ? 'clamp(32px, 8vw, 44px)' : 'clamp(44px, 4.4vw, 72px)', // Same size as Partisan logo
            width: 'auto',
            objectFit: 'contain',
            maxWidth: 'clamp(100px, 10vw, 130px)' // Prevent overflow
          }}
        />
      </div>

      {/* 3-Pillar Layout Container - Fit in single viewport frame */}
      <div 
        className="absolute"
        style={{
          top: isMobile ? 'clamp(60px, 8vh, 80px)' : 'clamp(55px, 7vh, 70px)',
          left: isMobile ? 'clamp(8px, 1.5vw, 16px)' : 'clamp(20px, 2.5vw, 40px)',
          right: isMobile ? 'clamp(8px, 1.5vw, 16px)' : 'clamp(20px, 2.5vw, 40px)',
          bottom: isMobile ? 'clamp(12px, 2vh, 20px)' : 'clamp(16px, 2vh, 24px)',
          zIndex: 1, // Ensure content is above background lines
          transform: 'scale(0.9)',
          transformOrigin: 'center center'
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
            categories={filteredData?.Brain || {}}
            onCompanyClick={(company) => {
              setSelected(company);
              setOpen(true);
            }}
            onMaximize={(categoryName, subcategoryName) => {
              setMaximizedBox({ type: subcategoryName ? 'subcategory' : 'category', categoryName, subcategoryName, pillarName: 'Brain' });
            }}
            isMobile={isMobile}
          />

          {/* Engine Pillar */}
          <PillarColumn
            pillarName="Engine"
            categories={filteredData?.Engine || {}}
            onCompanyClick={(company) => {
              setSelected(company);
              setOpen(true);
            }}
            onMaximize={(categoryName, subcategoryName) => {
              setMaximizedBox({ type: subcategoryName ? 'subcategory' : 'category', categoryName, subcategoryName, pillarName: 'Engine' });
            }}
            isMobile={isMobile}
          />

          {/* Megaphone Pillar */}
          <PillarColumn
            pillarName="Megaphone"
            categories={filteredData?.Megaphone || {}}
            onCompanyClick={(company) => {
              setSelected(company);
              setOpen(true);
            }}
            onMaximize={(categoryName, subcategoryName) => {
              setMaximizedBox({ type: subcategoryName ? 'subcategory' : 'category', categoryName, subcategoryName, pillarName: 'Megaphone' });
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
              zIndex: 10002, // Above maximized box (10001)
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

      {/* Maximized Box Modal */}
      {maximizedBox && (() => {
        const pillarData = filteredData?.[maximizedBox.pillarName as keyof PillarStructure];
        const categoryData = pillarData?.[maximizedBox.categoryName];
        
        if (!categoryData) return null;

        let companiesToShow: Company[] = [];
        let title = maximizedBox.categoryName;
        
        if (maximizedBox.type === 'subcategory' && maximizedBox.subcategoryName) {
          // Subcategory view
          if (!Array.isArray(categoryData)) {
            companiesToShow = categoryData[maximizedBox.subcategoryName] || [];
            title = `${maximizedBox.categoryName} - ${maximizedBox.subcategoryName}`;
          }
        } else {
          // Flat category view
          if (Array.isArray(categoryData)) {
            companiesToShow = categoryData;
          }
        }

        // Sort companies alphabetically
        const sortedCompanies = [...companiesToShow].sort((a, b) => 
          a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
        );

        return (
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setMaximizedBox(null);
              }
            }}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10001, // Above company modal
              padding: isMobile ? 'clamp(12px, 2vh, 20px)' : 'clamp(20px, 2vw, 40px)'
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                padding: isMobile ? 'clamp(16px, 2vw, 24px)' : 'clamp(24px, 2.5vw, 40px)',
                maxWidth: isMobile ? '95vw' : '90vw',
                maxHeight: isMobile ? '90vh' : '85vh',
                width: '100%',
                height: 'auto',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                position: 'relative'
              }}
            >
              {/* Close Button */}
              <button
                onClick={() => setMaximizedBox(null)}
                style={{
                  position: 'absolute',
                  top: isMobile ? 'clamp(12px, 1.5vw, 16px)' : 'clamp(16px, 1.5vw, 20px)',
                  right: isMobile ? 'clamp(12px, 1.5vw, 16px)' : 'clamp(16px, 1.5vw, 20px)',
                  background: 'rgba(255, 255, 255, 0.9)',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  padding: 'clamp(6px, 0.6vw, 8px)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10,
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                }}
                aria-label="Close"
              >
                <X size={isMobile ? 18 : 20} color="#6B7280" />
              </button>

              {/* Title */}
              <h2
                style={{
                  fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
                  fontWeight: 600,
                  fontSize: isMobile ? 'clamp(18px, 4vw, 22px)' : 'clamp(24px, 2vw, 32px)',
                  color: '#001A66',
                  marginBottom: isMobile ? 'clamp(16px, 2vh, 20px)' : 'clamp(20px, 2vh, 28px)',
                  marginTop: 0,
                  textAlign: 'center',
                  paddingRight: isMobile ? 'clamp(32px, 4vw, 40px)' : 'clamp(40px, 3vw, 48px)' // Space for close button
                }}
              >
                {title}
              </h2>

              {/* Logo Grid - Larger in maximized view */}
              {sortedCompanies.length > 0 ? (
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    alignItems: 'flex-start',
                    alignContent: 'flex-start',
                    gap: isMobile ? 'clamp(12px, 2vw, 16px)' : 'clamp(16px, 1.5vw, 24px)',
                    overflowY: 'auto',
                    paddingRight: 'clamp(4px, 0.4vw, 8px)',
                    paddingBottom: 'clamp(4px, 0.4vw, 8px)'
                  }}
                >
                  {sortedCompanies.map((company, index) => {
                    const logoUrl = company.logo || 
                      (company.domain 
                        ? `/logos/${company.domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].replace(/\./g, '-')}.png`
                        : null);
                    
                    return (
                      <div
                        key={`${company.name}-${index}`}
                        onClick={() => {
                          // Don't close maximized box - keep it open so we can return to it
                          setSelected(company);
                          setOpen(true);
                        }}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          cursor: 'pointer',
                          transition: 'opacity 0.2s, transform 0.2s',
                          padding: isMobile ? 'clamp(8px, 1vw, 12px)' : 'clamp(12px, 1vw, 16px)',
                          flexShrink: 0,
                          width: isMobile 
                            ? 'calc(33.333% - clamp(8px, 1.33vw, 10.67px))'
                            : 'clamp(120px, 8vw, 160px)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = '0.8';
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = '1';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        {/* Logo - Larger in maximized view */}
                        <div
                          style={{
                            width: isMobile 
                              ? 'clamp(80px, 10vw, 100px)' 
                              : 'clamp(100px, 6.5vw, 140px)',
                            height: isMobile 
                              ? 'clamp(50px, 6.25vh, 62px)' 
                              : 'clamp(62px, 4.3vh, 87px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: isMobile ? 'clamp(6px, 0.8vw, 8px)' : 'clamp(8px, 0.6vw, 12px)',
                            flexShrink: 0,
                            backgroundColor: '#F9FAFB',
                            borderRadius: '8px',
                            border: '1px solid #E5E7EB',
                            padding: 'clamp(4px, 0.4vw, 8px)'
                          }}
                        >
                          {logoUrl ? (
                            <img 
                              src={logoUrl} 
                              alt={company.name}
                              style={{
                                maxWidth: '100%',
                                maxHeight: '100%',
                                width: 'auto',
                                height: 'auto',
                                objectFit: 'contain'
                              }}
                              onError={(e) => {
                                const target = e.currentTarget as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = `<div style="
                                    width: 100%;
                                    height: 100%;
                                    background-color: #E9D5FF;
                                    border-radius: 6px;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    font-family: Inter, sans-serif;
                                    font-size: clamp(10px, 1vw, 14px);
                                    font-weight: 500;
                                    color: #6B1FA8;
                                    text-align: center;
                                    padding: clamp(4px, 0.4vw, 8px);
                                  ">${company.name.substring(0, 12)}</div>`;
                                }
                              }}
                            />
                          ) : (
                            <div 
                              style={{
                                width: '100%',
                                height: '100%',
                                backgroundColor: '#E9D5FF',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontFamily: 'Inter, sans-serif',
                                fontSize: isMobile ? 'clamp(10px, 1.2vw, 12px)' : 'clamp(12px, 0.8vw, 16px)',
                                fontWeight: 500,
                                color: '#6B1FA8',
                                textAlign: 'center',
                                padding: 'clamp(4px, 0.4vw, 8px)'
                              }}
                            >
                              {company.name.substring(0, 12)}
                            </div>
                          )}
                        </div>

                        {/* Company Name - Larger in maximized view */}
                        <div
                          style={{
                            width: '100%',
                            fontFamily: 'Inter, sans-serif',
                            fontSize: isMobile ? 'clamp(10px, 1.5vw, 12px)' : 'clamp(12px, 0.9vw, 16px)',
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
                          title={company.name}
                        >
                          {company.name}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: isMobile ? 'clamp(14px, 2vw, 16px)' : 'clamp(16px, 1.2vw, 18px)',
                    color: '#9CA3AF',
                    textAlign: 'center',
                    padding: 'clamp(32px, 4vh, 48px)'
                  }}
                >
                  No companies in this {maximizedBox.type === 'subcategory' ? 'subcategory' : 'category'}
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
