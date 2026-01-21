import React, { useEffect, useState, useMemo } from 'react';
import { Maximize2, X, Search, MessageSquare, Mail } from 'lucide-react';
import { CategorySection } from './components/CategorySection';
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

// Feedback email address
const FEEDBACK_EMAIL = 'techmap@partisan.community'; // No spaces

export default function AppV2() {
  const [data, setData] = useState<PillarStructure | null>(null);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Company | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [orientationLocked, setOrientationLocked] = useState(false);
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

  // Force landscape mode on mobile devices
  useEffect(() => {
    if (typeof window === 'undefined' || !isMobile) return;
    
    const checkOrientation = () => {
      // Check if landscape: width > height
      const isLandscapeOrientation = window.innerWidth > window.innerHeight;
      setIsLandscape(isLandscapeOrientation);
      
      // Try to lock orientation to landscape on supported browsers
      if (isMobile && !isLandscapeOrientation) {
        // Attempt orientation lock (requires user gesture, so we'll try on first interaction)
        if ('orientation' in screen && typeof (screen as any).orientation?.lock === 'function') {
          // Lock will be attempted on first user interaction
          const tryLock = async () => {
            try {
              await (screen as any).orientation.lock('landscape');
              setOrientationLocked(true);
            } catch (err) {
              // Lock failed (might require fullscreen or user gesture)
              setOrientationLocked(false);
            }
          };
          
          // Try to lock on any user interaction
          const events = ['touchstart', 'click', 'touchend'];
          const attemptLock = () => {
            tryLock();
            events.forEach(e => window.removeEventListener(e, attemptLock));
          };
          
          events.forEach(e => window.addEventListener(e, attemptLock, { once: true }));
        }
      }
    };
    
    // Initial check
    checkOrientation();
    
    // Listen for orientation changes using media query (more reliable)
    const orientationMediaQuery = window.matchMedia('(orientation: landscape)');
    const handleOrientationChange = (event: MediaQueryListEvent | MediaQueryList) => {
      const isLandscapeOrientation = 'matches' in event ? event.matches : orientationMediaQuery.matches;
      setIsLandscape(isLandscapeOrientation);
    };
    
    // Use orientationchange event for better mobile support (with small delay for dimension updates)
    const handleOrientationChangeEvent = () => {
      setTimeout(checkOrientation, 100);
    };
    
    window.addEventListener('orientationchange', handleOrientationChangeEvent);
    window.addEventListener('resize', checkOrientation);
    
    if (orientationMediaQuery.addEventListener) {
      orientationMediaQuery.addEventListener('change', handleOrientationChange);
    } else {
      orientationMediaQuery.addListener(handleOrientationChange as any);
    }
    
    return () => {
      window.removeEventListener('orientationchange', handleOrientationChangeEvent);
      window.removeEventListener('resize', checkOrientation);
      if (orientationMediaQuery.removeEventListener) {
        orientationMediaQuery.removeEventListener('change', handleOrientationChange);
      } else {
        orientationMediaQuery.removeListener(handleOrientationChange as any);
      }
      
      // Unlock orientation on unmount if locked
      if (orientationLocked && 'orientation' in screen && typeof (screen as any).orientation?.unlock === 'function') {
        (screen as any).orientation.unlock();
      }
    };
  }, [isMobile, orientationLocked]);

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

  // Calculate merged canvas structure
  const mergedCanvasStructure = useMemo(() => {
    if (!filteredData) return null;

    const pillarData = [
      { name: 'Brain', data: filteredData.Brain || {}, column: 1, bgColor: '#F0F4F8' },
      { name: 'Engine', data: filteredData.Engine || {}, column: 2, bgColor: '#F0F9F5' },
      { name: 'Megaphone', data: filteredData.Megaphone || {}, column: 3, bgColor: '#FFF5F0' }
    ];

    // Calculate all category positions
    const allCategories: Array<{
      pillarName: string;
      categoryName: string;
      categoryData: CategoryData;
      gridColumn: number;
      gridRowStart: number;
      gridRowEnd: number;
      entityCount: number;
      categoryCount: number;
      pillarBgColor: string;
    }> = [];

    pillarData.forEach(pillar => {
      const categoryEntries = Object.entries(pillar.data);
      const categoryCount = categoryEntries.length;
      
      // Calculate row proportions
      let rowProportions: number[];
      if (categoryCount === 2) {
        // Brain/Megaphone: 50% each
        rowProportions = [50, 50];
      } else if (categoryCount === 4) {
        // Engine: 25%, 30%, 15%, 30%
        rowProportions = [25, 30, 15, 30];
      } else {
        // Fallback: equal distribution
        rowProportions = Array(categoryCount).fill(100 / categoryCount);
      }

      // Calculate cumulative row positions (in percentage units, base 1-100)
      let currentRow = 1;
      categoryEntries.forEach(([categoryName, categoryData], index) => {
        const proportion = rowProportions[index];
        const rowStart = currentRow;
        const rowEnd = currentRow + proportion;
        
        // Calculate entity count
        let entityCount = 0;
        if (Array.isArray(categoryData)) {
          entityCount = categoryData.length;
        } else {
          entityCount = Object.values(categoryData).reduce((sum, companies) => sum + companies.length, 0);
        }

        allCategories.push({
          pillarName: pillar.name,
          categoryName,
          categoryData,
          gridColumn: pillar.column,
          gridRowStart: rowStart,
          gridRowEnd: rowEnd,
          entityCount,
          categoryCount,
          pillarBgColor: pillar.bgColor
        });

        currentRow = rowEnd;
      });
    });

    return { allCategories, pillarData };
  }, [filteredData]);

  // Calculate rotation and scaling for portrait mode on mobile (game-like landscape forcing)
  // IMPORTANT: All hooks must be called before any early returns to follow React's rules of hooks
  const needsRotation = isMobile && !isLandscape;
  const [rotationScale, setRotationScale] = useState<{
    rotate: string;
    scale: number;
    translateX: string;
    translateY: string;
  } | null>(null);

  useEffect(() => {
    if (!needsRotation || typeof window === 'undefined') {
      setRotationScale(null);
      return;
    }

    // Immediately calculate rotation (don't wait)
    const calculateTransform = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // When in portrait (e.g., 375x667), rotate 90deg clockwise to show landscape view
      // After rotation: content dimensions swap (667w x 375h)
      // To fit rotated content (667w x 375h) in portrait viewport (375w x 667h):
      // Scale to fit width: viewportWidth / rotatedWidth = 375 / 667 ≈ 0.56
      // Scale to fit height: viewportHeight / rotatedHeight = 667 / 375 ≈ 1.78
      // Use minimum to ensure it fits in both dimensions
      const scale = Math.min(viewportWidth / viewportHeight, viewportHeight / viewportWidth) * 0.98; // Slight margin
      
      // After rotation and scaling, center the content
      // Rotated and scaled width = viewportHeight * scale
      // Rotated and scaled height = viewportWidth * scale
      const scaledWidth = viewportHeight * scale;
      const scaledHeight = viewportWidth * scale;
      const translateX = (viewportWidth - scaledHeight) / 2; // X-axis becomes height after rotation
      const translateY = (viewportHeight - scaledWidth) / 2; // Y-axis becomes width after rotation

      setRotationScale({
        rotate: '90deg',
        scale,
        translateX: `${translateX}px`,
        translateY: `${translateY}px`
      });
    };

    calculateTransform();
    window.addEventListener('resize', calculateTransform);
    return () => window.removeEventListener('resize', calculateTransform);
  }, [needsRotation]);

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
          color: '#6B7280',
          backgroundColor: '#FFFFFF'
        }}
      >
        Loading data...
      </div>
    );
  }

  // Debug: Log when data is loaded
  console.log('Data loaded:', !!data, 'Filtered data:', !!filteredData, 'Merged structure:', !!mergedCanvasStructure);

  // Build the main content (same for both mobile portrait and desktop)
  const mainContent = (
    <div 
      className="relative" 
      style={{ 
        backgroundColor: '#FFFFFF',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden', // Fit in one frame - no scrolling
        position: 'relative',
        display: 'block'
      }}
    >
      {/* Subtle Web-like Background Lines */}
      <svg
        style={{
          position: 'absolute',
          top: (isMobile && !isLandscape) ? 'clamp(60px, 8vh, 80px)' : 'clamp(55px, 7vh, 70px)',
          left: (isMobile && !isLandscape) ? 'clamp(8px, 1.5vw, 16px)' : 'clamp(20px, 2.5vw, 40px)',
          right: (isMobile && !isLandscape) ? 'clamp(8px, 1.5vw, 16px)' : 'clamp(20px, 2.5vw, 40px)',
          bottom: (isMobile && !isLandscape) ? 'clamp(12px, 2vh, 20px)' : 'clamp(16px, 2vh, 24px)',
          pointerEvents: 'none',
          zIndex: 0,
          width: '100%',
          height: '100%'
        }}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {/* Web-like lines connecting the three pillars - Criss-cross pattern covering full height */}
        {/* Lines span from top of first row (8%) to end of last row (82%) - stopping well before bottom */}
        {/* Left pillar (16.67%) to Center pillar (50%) - Criss-cross */}
        {Array.from({ length: 38 }, (_, i) => {
          const y1 = 8 + (i * 74 / 37);
          const y2 = 10 + (i * 70 / 37);
          return <line key={`left-center-${i}`} x1="16.67" y1={y1.toFixed(2)} x2="50" y2={y2.toFixed(2)} stroke="#000000" strokeWidth="0.25" opacity="0.2" />;
        })}
        {/* Center pillar (50%) to Right pillar (83.33%) - Criss-cross */}
        {Array.from({ length: 38 }, (_, i) => {
          const y1 = 10 + (i * 70 / 37);
          const y2 = 12 + (i * 66 / 37);
          return <line key={`center-right-${i}`} x1="50" y1={y1.toFixed(2)} x2="83.33" y2={y2.toFixed(2)} stroke="#000000" strokeWidth="0.25" opacity="0.2" />;
        })}
        {/* Cross-pillar connections (Left to Right) - Criss-cross */}
        {Array.from({ length: 30 }, (_, i) => {
          const y1 = 8 + (i * 74 / 29);
          const y2 = 15 + (i * 62 / 29);
          return <line key={`left-right-${i}`} x1="16.67" y1={y1.toFixed(2)} x2="83.33" y2={y2.toFixed(2)} stroke="#000000" strokeWidth="0.25" opacity="0.18" />;
        })}
        {/* Reverse criss-cross (Right to Left) */}
        {Array.from({ length: 30 }, (_, i) => {
          const y1 = 12 + (i * 64 / 29);
          const y2 = 8 + (i * 74 / 29);
          return <line key={`right-left-${i}`} x1="83.33" y1={y1.toFixed(2)} x2="16.67" y2={y2.toFixed(2)} stroke="#000000" strokeWidth="0.25" opacity="0.15" />;
        })}
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
            className="country-filter-trigger [&_svg]:!text-[#001A66] [&_svg]:opacity-70 hover:[&_svg]:opacity-100"
            style={{
              width: isMobile ? 'clamp(120px, 25vw, 160px)' : 'clamp(140px, 12vw, 180px)',
              fontSize: isMobile ? 'clamp(11px, 2vw, 13px)' : 'clamp(12px, 0.9vw, 14px)',
              height: isMobile ? 'clamp(28px, 5vw, 32px)' : 'clamp(32px, 2.5vw, 36px)',
              padding: isMobile ? '0 8px' : '0 10px',
              border: '1px solid #001A66',
              borderRadius: '6px',
              backgroundColor: '#FFFFFF',
              boxShadow: '0 1px 2px rgba(0, 26, 102, 0.1)',
              fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
              fontWeight: 600,
              color: '#001A66',
              transition: 'all 0.2s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#001A66';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 26, 102, 0.15)';
              e.currentTarget.style.backgroundColor = '#F8F9FA';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#001A66';
              e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 26, 102, 0.1)';
              e.currentTarget.style.backgroundColor = '#FFFFFF';
            }}
          >
            <SelectValue placeholder="Filter by country" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', fontWeight: 600, color: '#001A66' }} />
          </SelectTrigger>
          <SelectContent 
            className="!z-[10001] !bg-white [&_[data-slot=select-item]>span]:hidden !max-h-[200px] !overflow-y-auto !border-[#001A66] !border-opacity-20" 
            style={{ 
              zIndex: 10001, 
              backgroundColor: '#FFFFFF', 
              fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', 
              cursor: 'default', 
              maxHeight: '200px', 
              overflowY: 'auto',
              border: '1px solid #001A66',
              borderRadius: '6px',
              boxShadow: '0 4px 12px rgba(0, 26, 102, 0.15)',
              padding: '4px'
            }}
            onCloseAutoFocus={(e) => e.preventDefault()}
          >
            <SelectItem 
              value="All" 
              className="!cursor-pointer !pr-2 [&>span]:hidden hover:!bg-[#F0F4F8] focus:!bg-[#F0F4F8] !rounded-[4px] !mx-1" 
              style={{ 
                fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', 
                cursor: 'pointer', 
                fontSize: isMobile ? 'clamp(10px, 1.8vw, 12px)' : 'clamp(11px, 0.8vw, 13px)',
                fontWeight: selectedCountry === 'All' ? 600 : 400,
                color: selectedCountry === 'All' ? '#001A66' : '#374151',
                padding: isMobile ? '6px 8px' : '8px 10px',
                transition: 'all 0.15s ease'
              }}
            >
              All Countries
            </SelectItem>
            {countries.map((country) => (
              <SelectItem 
                key={country} 
                value={country} 
                className="!cursor-pointer !pr-2 [&>span]:hidden hover:!bg-[#F0F4F8] focus:!bg-[#F0F4F8] !rounded-[4px] !mx-1" 
                style={{ 
                  fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', 
                  cursor: 'pointer', 
                  fontSize: isMobile ? 'clamp(10px, 1.8vw, 12px)' : 'clamp(11px, 0.8vw, 13px)',
                  fontWeight: selectedCountry === country ? 600 : 400,
                  color: selectedCountry === country ? '#001A66' : '#374151',
                  padding: isMobile ? '6px 8px' : '8px 10px',
                  transition: 'all 0.15s ease'
                }}
              >
                {country}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Search by Company */}
        <div
          className="search-input-wrapper"
          style={{
            position: 'relative',
            width: isMobile ? 'clamp(120px, 25vw, 160px)' : 'clamp(140px, 12vw, 180px)',
            height: isMobile ? 'clamp(28px, 5vw, 32px)' : 'clamp(32px, 2.5vw, 36px)',
            marginTop: isMobile ? '-4px' : '-6px',
            border: '1px solid #001A66',
            borderRadius: '6px',
            backgroundColor: '#FFFFFF',
            boxShadow: '0 1px 2px rgba(0, 26, 102, 0.1)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#001A66';
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 26, 102, 0.15)';
            e.currentTarget.style.backgroundColor = '#F8F9FA';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#001A66';
            e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 26, 102, 0.1)';
            e.currentTarget.style.backgroundColor = '#FFFFFF';
          }}
        >
          <Search
            size={isMobile ? 14 : 16}
            style={{
              position: 'absolute',
              left: isMobile ? '8px' : '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#666',
              pointerEvents: 'none',
              zIndex: 1,
              transition: 'color 0.2s ease'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: isMobile ? '6px' : '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(0, 26, 102, 0.05)',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2,
                color: '#666',
                transition: 'all 0.15s ease',
                width: isMobile ? '18px' : '20px',
                height: isMobile ? '18px' : '20px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#001A66';
                e.currentTarget.style.backgroundColor = 'rgba(0, 26, 102, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#666';
                e.currentTarget.style.backgroundColor = 'rgba(0, 26, 102, 0.05)';
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
            className="!border-none !bg-transparent !shadow-none focus-visible:!ring-2 focus-visible:!ring-[#001A66] focus-visible:!ring-offset-0 search-company-input"
            style={{
              width: '100%',
              height: isMobile ? 'clamp(28px, 5vw, 32px)' : 'clamp(32px, 2.5vw, 36px)',
              fontSize: isMobile ? 'clamp(11px, 2vw, 13px)' : 'clamp(12px, 0.9vw, 14px)',
              paddingLeft: isMobile ? '28px' : '32px',
              paddingRight: searchQuery ? (isMobile ? '28px' : '32px') : (isMobile ? '10px' : '12px'),
              fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
              backgroundColor: 'transparent',
              border: 'none',
              boxShadow: 'none',
              outline: 'none',
              color: '#001A66',
              fontWeight: 500
            }}
            onFocus={(e) => {
              const wrapper = e.currentTarget.closest('.search-input-wrapper') as HTMLElement;
              if (wrapper) {
                wrapper.style.borderColor = '#001A66';
                wrapper.style.boxShadow = '0 2px 6px rgba(0, 26, 102, 0.2)';
              }
            }}
            onBlur={(e) => {
              const wrapper = e.currentTarget.closest('.search-input-wrapper') as HTMLElement;
              if (wrapper) {
                wrapper.style.borderColor = '#001A66';
                wrapper.style.boxShadow = '0 1px 2px rgba(0, 26, 102, 0.1)';
              }
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
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <Mail size={14} style={{ color: '#001A66' }} />
          <span style={{ color: '#001A66' }}>{FEEDBACK_EMAIL}</span>
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
          top: (isMobile && !isLandscape) ? 'clamp(70px, 9vh, 90px)' : 'clamp(65px, 8vh, 80px)',
          left: (isMobile && !isLandscape) ? 'clamp(2px, 0.5vw, 6px)' : 'clamp(8px, 1vw, 18px)',
          right: (isMobile && !isLandscape) ? 'clamp(2px, 0.5vw, 6px)' : 'clamp(8px, 1vw, 18px)',
          bottom: (isMobile && !isLandscape) ? 'clamp(12px, 2vh, 20px)' : 'clamp(16px, 2vh, 24px)',
          zIndex: 1, // Ensure content is above background lines
          border: '2px solid #001A66', // Border around the entire map (dark EU blue)
          borderRadius: '6px', // Match category box border radius
          backgroundColor: '#FFFFFF', // White background like category boxes
          padding: isMobile ? 'clamp(6px, 0.8vw, 10px)' : 'clamp(8px, 0.6vw, 12px)', // Padding so border is visible
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transform: 'scale(0.922) translateY(1%)',
          transformOrigin: 'center center'
        }}
      >
        <div
          style={{
            flex: 1,
            width: '100%',
            height: '100%',
            minHeight: 0,
            overflow: 'hidden'
          }}
        >
        {/* Single merged canvas - categories rendered directly in grid */}
        {mergedCanvasStructure ? (() => {
          const { allCategories, pillarData } = mergedCanvasStructure;
          const gridTemplateRows = `repeat(100, 1fr)`;
          const categoryGap = isMobile ? 'clamp(3px, 0.3vh, 5px)' : 'clamp(3px, 0.3vh, 5px)';
          const columnGap = (isMobile && !isLandscape) ? 'clamp(6px, 1.2vh, 10px)' : 'clamp(6px, 0.6vw, 10px)'; // Further reduced gap - columns remain proportional

          return (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: (isMobile && !isLandscape) ? '1fr' : 'repeat(3, 1fr)',
                gridTemplateRows: gridTemplateRows,
                columnGap: columnGap,
                rowGap: categoryGap,
                height: '100%',
                width: '100%',
                position: 'relative'
              }}
            >
              {/* Column backgrounds */}
              {(!isMobile || isLandscape) && (
                <>
                  {/* Brain column background */}
                  <div
                    style={{
                      gridColumn: '1',
                      gridRow: '1 / -1',
                      backgroundColor: '#F0F4F8',
                      borderRadius: '8px',
                      padding: isMobile ? 'clamp(8px, 1.5vw, 12px)' : 'clamp(10px, 1vw, 14px)',
                      paddingRight: 'clamp(2px, 0.3vw, 4px)',
                      zIndex: 0,
                      pointerEvents: 'none'
                    }}
                  />
                  {/* Engine column background */}
                  <div
                    style={{
                      gridColumn: '2',
                      gridRow: '1 / -1',
                      backgroundColor: '#F0F9F5',
                      borderRadius: '8px',
                      padding: isMobile ? 'clamp(8px, 1.5vw, 12px)' : 'clamp(10px, 1vw, 14px)',
                      paddingRight: 'clamp(2px, 0.3vw, 4px)',
                      zIndex: 0,
                      pointerEvents: 'none'
                    }}
                  />
                  {/* Megaphone column background */}
                  <div
                    style={{
                      gridColumn: '3',
                      gridRow: '1 / -1',
                      backgroundColor: '#FFF5F0',
                      borderRadius: '8px',
                      padding: isMobile ? 'clamp(8px, 1.5vw, 12px)' : 'clamp(10px, 1vw, 14px)',
                      paddingRight: 'clamp(2px, 0.3vw, 4px)',
                      zIndex: 0,
                      pointerEvents: 'none'
                    }}
                  />
                </>
              )}

              {/* Render all categories */}
              {allCategories.map(({ pillarName, categoryName, categoryData, gridColumn, gridRowStart, gridRowEnd, entityCount, categoryCount, pillarBgColor }, index) => {
                const isArray = Array.isArray(categoryData);
                const hasSubcategories = !isArray && typeof categoryData === 'object' && categoryData !== null;
                const isTwoCategoryColumn = categoryCount === 2;
                const isFourCategoryColumn = categoryCount === 4;
                const categoryIndex = allCategories.filter(c => c.pillarName === pillarName).findIndex(c => c.categoryName === categoryName);
                
                return (
                  <div
                    key={`${pillarName}-${categoryName}`}
                    style={{
                      gridColumn: (isMobile && !isLandscape) ? '1' : gridColumn.toString(),
                      gridRow: `${Math.max(1, Math.round(gridRowStart))} / ${Math.max(1, Math.round(gridRowEnd))}`,
                      minHeight: 0,
                      overflow: 'hidden',
                      zIndex: 1
                    }}
                  >
                    <CategorySection
                      categoryName={categoryName}
                      companies={isArray ? categoryData : undefined}
                      subcategories={hasSubcategories ? categoryData : undefined}
                      onCompanyClick={(company) => {
                        setSelected(company);
                        setOpen(true);
                      }}
                      onMaximize={(catName, subcatName) => {
                        setMaximizedBox({ type: subcatName ? 'subcategory' : 'category', categoryName: catName, subcategoryName: subcatName, pillarName });
                      }}
                      isMobile={isMobile}
                      entityCount={entityCount}
                      categoryCount={categoryCount}
                      forceFullHeight={isTwoCategoryColumn || isFourCategoryColumn}
                      logosPerRow={isFourCategoryColumn && categoryIndex < 3 ? 5 : undefined}
                      bgColor={pillarBgColor}
                    />
                  </div>
                );
              })}
            </div>
          );
        })() : (
          <div style={{ 
            padding: '20px', 
            textAlign: 'center', 
            color: '#666',
            fontFamily: 'Inter, sans-serif'
          }}>
            Loading map...
          </div>
        )}
        </div>
      </div>

      {/* Company Details Modal */}
      {open && selected && (() => {
        const logoUrl = selected.logo || 
          (selected.domain 
            ? `/logos/${selected.domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].replace(/\./g, '-')}.png`
            : null);
        
        // Hub profile links for demonstration
        const hubProfileLinks: Record<string, string> = {
          'Qomon': 'https://hub.partisan.community/organizations/companies/Qomon61fhloy7/400421',
          'NationBuilder': 'https://hub.partisan.community/organizations/startups/NationBuilders9ysfewl/401518',
        };
        
        const hasHubProfile = selected.name in hubProfileLinks;
        
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
              
              {/* Action Buttons */}
              <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Hub Profile Button - Only for Qomon and NationBuilder */}
                {hasHubProfile && (
                  <a
                    href={hubProfileLinks[selected.name]}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-block',
                      padding: '10px 20px',
                      backgroundColor: '#6B1FA8',
                      color: '#FFFFFF',
                      textDecoration: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: 600,
                      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer',
                      border: 'none',
                      textAlign: 'center',
                      width: 'fit-content'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#7E22CE';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(107, 31, 168, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#6B1FA8';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    Partisan Hub Profile
                  </a>
                )}
                
                {/* Visit Website Button */}
                {selected.domain && (
                  <a
                    href={selected.domain.startsWith('http') ? selected.domain : `https://${selected.domain}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-block',
                      padding: '10px 20px',
                      backgroundColor: '#001A66',
                      color: '#FFFFFF',
                      textDecoration: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: 600,
                      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer',
                      border: 'none',
                      textAlign: 'center',
                      width: 'fit-content'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#002699';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 26, 102, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#001A66';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    Visit website
                  </a>
                )}
              </div>
              
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

      {/* Feedback Button - Bottom Right */}
      <a
        href={`mailto:${FEEDBACK_EMAIL}`}
        style={{
          position: 'fixed',
          bottom: isMobile ? 'clamp(16px, 3vh, 24px)' : 'clamp(20px, 2.5vh, 32px)',
          right: isMobile ? 'clamp(12px, 2vw, 20px)' : 'clamp(20px, 2.5vw, 32px)',
          width: isMobile ? 'clamp(44px, 6vw, 52px)' : 'clamp(48px, 3vw, 56px)',
          height: isMobile ? 'clamp(44px, 6vw, 52px)' : 'clamp(48px, 3vw, 56px)',
          borderRadius: '50%',
          backgroundColor: '#001A66', // Dark EU blue matching theme
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0, 26, 102, 0.2), 0 4px 12px rgba(0, 26, 102, 0.15)',
          transition: 'all 0.2s ease',
          zIndex: 1000, // Ensure it's above other content
          textDecoration: 'none',
          border: '2px solid rgba(255, 255, 255, 0.1)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 26, 102, 0.3), 0 6px 16px rgba(0, 26, 102, 0.2)';
          e.currentTarget.style.backgroundColor = '#002699';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 26, 102, 0.2), 0 4px 12px rgba(0, 26, 102, 0.15)';
          e.currentTarget.style.backgroundColor = '#001A66';
        }}
        aria-label="Provide feedback"
      >
        <MessageSquare 
          style={{ 
            width: isMobile ? 'clamp(22px, 3.3vw, 26px)' : 'clamp(24px, 1.5vw, 28px)',
            height: isMobile ? 'clamp(22px, 3.3vw, 26px)' : 'clamp(24px, 1.5vw, 28px)',
            strokeWidth: 2
          }} 
        />
      </a>

      {/* Portrait Mode Overlay - Show only when rotation is NOT applied (rotationScale is null) */}
      {needsRotation && !rotationScale && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 26, 102, 0.95)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100000,
            color: '#FFFFFF',
            fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
            padding: 'clamp(20px, 5vw, 40px)',
            textAlign: 'center'
          }}
        >
          <div
            style={{
              fontSize: 'clamp(48px, 12vw, 72px)',
              marginBottom: 'clamp(24px, 6vh, 40px)',
              animation: 'rotateDevice 2s ease-in-out infinite',
              transform: 'rotate(90deg)'
            }}
          >
            📱
          </div>
          <h2
            style={{
              fontSize: 'clamp(20px, 5vw, 28px)',
              fontWeight: 700,
              marginBottom: 'clamp(16px, 4vh, 24px)',
              color: '#FFFFFF'
            }}
          >
            Please Rotate Your Device
          </h2>
          <p
            style={{
              fontSize: 'clamp(14px, 3.5vw, 18px)',
              fontWeight: 400,
              color: 'rgba(255, 255, 255, 0.9)',
              lineHeight: 1.6,
              maxWidth: '400px'
            }}
          >
            For the best experience, please rotate your device to landscape mode.
          </p>
        </div>
      )}
    </div>
  );

  // Wrap with rotation div only if needed (mobile portrait)
  // When rotation is applied, the overlay won't show (it's inside mainContent but rotated away)
  if (needsRotation && rotationScale) {
    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          position: 'fixed',
          top: 0,
          left: 0,
          overflow: 'hidden',
          transform: `rotate(${rotationScale.rotate}) scale(${rotationScale.scale}) translate(${rotationScale.translateX}, ${rotationScale.translateY})`,
          transformOrigin: 'center center',
          transition: 'transform 0.3s ease',
          zIndex: 1
        }}
      >
        {mainContent}
      </div>
    );
  }

  // Normal desktop/landscape rendering without rotation wrapper
  return mainContent;
}
