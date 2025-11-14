import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { CategoryCard } from './components/CategoryCard';
import { ConnectionArrows } from './components/ConnectionArrows';

type Company = {
  name: string;
  domain?: string;
  description?: string;
  hq?: string;
};

type CompaniesByCategory = Record<string, Company[]>;

// Type for tracking which category a company belongs to
type CompanyCategoryMap = Record<string, string>; // company name -> category key

// Helper to map domain to logo filename
// Logo files are named like: change-org.png, datack-com.ico, engagingnetworks-net.png
export function domainToLogoPath(domain: string): string | null {
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

// Helper to map company name to logo filename (for entities without domains)
// Logo files are named like: electify.png, my-company.png
export function nameToLogoPath(name: string): string | null {
  if (!name) return null;
  
  // Normalize name: lowercase, replace spaces and special chars with hyphens
  let normalized = name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .substring(0, 60); // Limit length
  
  return `/logos/${normalized}.png`;
}

export const STORAGE_KEY = 'company-category-assignments';

export const categoryMap = {
  messaging: { 
    name: 'Messaging & Media', 
    bgColor: '#F3E8FF', 
    key: 'Messaging & Media',
    tooltip: 'Creates and distributes narratives, content, and paid/earned media.',
    detailed: 'Develops strategic narratives, creative content, and media plans to reach target audiences across channels (social, paid, email, broadcast). This includes disinformation detection and information integrity work, rapid response, ad buys, creative production, and measurement of message resonance.',
    subcategories: 'Creative agencies, content studios, paid-media buying, social amplification, information integrity & fact-checking, rapid response.'
  },
  engagement: { 
    name: 'Engagement & Mobilisation', 
    bgColor: '#F5E1FF', 
    key: 'Engagement & Mobilisation',
    tooltip: 'Converts supporters into action through organizing and outreach.',
    detailed: 'Runs grassroots and digital organizing programs that recruit, train, and mobilise volunteers and supporters. Tools and tactics include canvassing and phonebanking systems, event platforms, SMS/email outreach, volunteer management, and local organizing playbooks to drive turnout, advocacy, and actions.',
    subcategories: 'Canvass & phone tools, volunteer CRMs, event & RSVP platforms, SMS & mass messaging, peer-to-peer outreach, training & community organising.'
  },
  fundraising: { 
    name: 'Fundraising', 
    bgColor: '#EBD6FF', 
    key: 'Fundraising',
    tooltip: 'Tools and tactics to find, solicit, and steward financial supporters.',
    detailed: 'Covers platforms and services for online and offline fundraising - payment processing, donor CRMs, peer-to-peer fundraising, conversion optimization and donor analytics. Fundraising tech links supporter engagement to sustainable revenue and helps campaigns and organisations measure donor lifetime value and ROI.',
    subcategories: 'Donation processors, recurring giving platforms, donor CRMs, peer-to-peer tools, fundraising analytics, compliance/reporting.'
  },
  research: { 
    name: 'Research & Insights', 
    bgColor: '#EFE3FF', 
    key: 'Research & Insights',
    tooltip: 'Produces evidence and analysis that shape strategy and messaging.',
    detailed: 'Conducts primary and secondary research - polling, focus groups, program evaluations and qualitative analysis - to surface voter attitudes, policy impact, and campaign effectiveness. Research teams translate findings into actionable insights that inform targeting, narrative testing, and performance measurement.',
    subcategories: 'Public opinion polling, formative research, academic & policy research, evaluation & impact, message testing, user research.'
  },
  analytics: { 
    name: 'Data Analytics & Modeling', 
    bgColor: '#EAD6FF', 
    key: 'Data Analytics & Modeling',
    tooltip: 'Turns data into predictive models, segments, and operational datasets.',
    detailed: 'Builds and maintains the data infrastructure, analytical models, and pipelines that drive targeting, segmentation, forecasting, and measurement. Capabilities include voter modelling, propensity scoring, A/B analysis, and dashboards that convert raw data into operational decisions for field and digital programs.',
    subcategories: 'Voter files & master databases, predictive scoring, RCT/A-B analysis, dashboards & BI, ETL/data engineering, identity resolution.'
  },
  voting: { 
    name: 'Voting Tech', 
    bgColor: '#E7D0FF', 
    key: 'Voting Tech',
    tooltip: 'Software and services supporting ballots, verifiable voting, and election workflows.',
    detailed: 'Encompasses secure, transparent systems for voting, adjudication tools, ballot delivery, and vote verification used by organisations and public bodies. Includes end-to-end verifiable systems, secure polling infrastructure, and tools that enable civic participation while protecting integrity and privacy.',
    subcategories: 'E-voting platforms, ballot-marking tools, vote verification/receipt systems, election-administration software, secure authentication, audit and chain-of-custody tools.'
  },
  infrastructure: { 
    name: 'Organisational Infrastructure', 
    bgColor: '#F6ECFF', 
    key: 'Organisational Infrastructure',
    tooltip: 'Provides the backbone services, governance, and capacity-building for networks and coalitions.',
    detailed: 'Encompasses tools and services that keep movements and organisations running - fund accounting, membership systems, training programs, coalition platforms, governance frameworks, and shared technology. These offerings enable scale, resilience, and cross-organisational coordination without being campaign- or project-specific.',
    subcategories: 'Membership/CRM for orgs, training & capacity-building, coalition platforms, shared legal/finance tools, HR and volunteer ops, compliance & security tooling.'
  },
};

export default function App() {
  const [data, setData] = useState<CompaniesByCategory | null>(null);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Company | null>(null);
  const [categoryAssignments, setCategoryAssignments] = useState<CompanyCategoryMap>({});
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [selectedCategoryInfo, setSelectedCategoryInfo] = useState<{ name: string; detailed?: string; subcategories?: string } | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Load data and category assignments
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/companies.json', { cache: 'no-store' });
        if (!res.ok) throw new Error(`Failed to load companies.json (${res.status})`);
        const json = await res.json();
        setData(json as CompaniesByCategory);
        
        // Load saved category assignments from localStorage
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            // Clean up any assignments to the removed "GovTech / Civic Infrastructure" category
            const cleaned: CompanyCategoryMap = {};
            const validCategoryKeys = Object.values(categoryMap).map(c => c.key);
            Object.entries(parsed).forEach(([companyName, categoryKey]) => {
              if (validCategoryKeys.includes(categoryKey as string)) {
                cleaned[companyName] = categoryKey as string;
              }
            });
            setCategoryAssignments(cleaned);
            // Save cleaned version back
            if (Object.keys(cleaned).length !== Object.keys(parsed).length) {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
            }
          } catch (e) {
            console.error('Failed to parse saved category assignments:', e);
          }
        }
      } catch (e: any) {
        console.error('Failed to load companies:', e);
      }
    }
    load();
  }, []);

  // Save category assignments to localStorage whenever they change
  useEffect(() => {
    if (Object.keys(categoryAssignments).length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(categoryAssignments));
    }
  }, [categoryAssignments]);

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

  // Function to get the effective category for a company (from assignments or original data)
  const getCompanyCategory = useCallback((companyName: string, originalData: CompaniesByCategory): string | null => {
    // Check if we have a custom assignment
    if (categoryAssignments[companyName]) {
      return categoryAssignments[companyName];
    }
    
    // Otherwise, find in original data
    for (const [categoryKey, companies] of Object.entries(originalData)) {
      if (companies.some(c => c.name === companyName)) {
        return categoryKey;
      }
    }
    return null;
  }, [categoryAssignments]);

  // Function to move a company to a different category
  const moveCompanyToCategory = useCallback((companyName: string, newCategoryKey: string) => {
    setCategoryAssignments(prev => ({
      ...prev,
      [companyName]: newCategoryKey
    }));
  }, []);

  const categories = useMemo(() => {
    const companiesByCategory = (data ?? {}) as CompaniesByCategory;
    
    // Build effective category assignments
    const effectiveCategories: CompaniesByCategory = {};
    
    // Initialize all categories
    Object.values(categoryMap).forEach(config => {
      effectiveCategories[config.key] = [];
    });
    
    // Collect all companies and assign them to their effective categories
    const allCompanies: Array<{ company: Company; category: string }> = [];
    
    // First, add all companies from original data (excluding GovTech / Civic Infrastructure)
    Object.entries(companiesByCategory).forEach(([categoryKey, companies]) => {
      // Filter out companies from the removed "GovTech / Civic Infrastructure" category
      // unless they've been reassigned to another category
      if (categoryKey === 'GovTech / Civic Infrastructure') {
        // Only include if they have a custom assignment
        companies.forEach(company => {
          if (categoryAssignments[company.name]) {
            allCompanies.push({ company, category: categoryKey });
          }
          // Otherwise, filter them out (don't add to allCompanies)
        });
      } else {
        companies.forEach(company => {
          allCompanies.push({ company, category: categoryKey });
        });
      }
    });
    
    // Then reassign based on categoryAssignments
    allCompanies.forEach(({ company, category: originalCategory }) => {
      const effectiveCategory = categoryAssignments[company.name] || originalCategory;
      // Only add to valid categories (skip removed GovTech category)
      if (effectiveCategory === 'GovTech / Civic Infrastructure') {
        return; // Skip companies still assigned to removed category
      }
      if (!effectiveCategories[effectiveCategory]) {
        effectiveCategories[effectiveCategory] = [];
      }
      // Only add if not already added (avoid duplicates)
      if (!effectiveCategories[effectiveCategory].some(c => c.name === company.name)) {
        effectiveCategories[effectiveCategory].push(company);
      }
    });

    return Object.entries(categoryMap).map(([id, config]) => {
      const companies = effectiveCategories[config.key] ?? [];
      const logos = companies.map(company => ({
        url: company.domain 
          ? (domainToLogoPath(company.domain) || '') 
          : (nameToLogoPath(company.name) || ''),
        name: company.name,
        company: company // Pass full company data for click handler
      }));

      return {
        id,
        name: config.name,
        bgColor: config.bgColor,
        logos,
        tooltip: config.tooltip,
        detailed: config.detailed,
        subcategories: config.subcategories,
        position: {
          row: id === 'messaging' || id === 'engagement' || id === 'fundraising' || id === 'research' ? 0 : 1,
          col: id === 'messaging' ? 0 : id === 'engagement' ? 1 : id === 'fundraising' ? 2 : id === 'research' ? 3 : id === 'analytics' ? 1 : id === 'voting' ? 2 : 3
        }
      };
    });
  }, [data, categoryAssignments]);

  const gridHorizontalMargin = isMobile ? 'clamp(12px, 4vw, 24px)' : 'clamp(30px, 3.1vw, 60px)';
  const gridTopOffset = isMobile ? 'clamp(80px, 13vh, 150px)' : 'clamp(120px, 18.5vh, 200px)';
  const gridBottomOffset = isMobile ? 'clamp(20px, 3vh, 60px)' : 'clamp(60px, 5.5vh, 120px)';
  const gridGap = isMobile ? 'clamp(12px, 3vw, 24px)' : 'clamp(24px, 2.5vw, 48px)';
  const mobileRowShrink = 'clamp(24px, 5vh, 60px)';
  const rowHeight = isMobile
    ? `calc((100% - ${gridGap}) / 2 - ${mobileRowShrink})`
    : `calc((100% - ${gridGap}) / 2)`;
  const rowSpacing = gridGap;
  const cardWidth = `calc((100% - (3 * ${gridGap})) / 4)`;

  return (
    <div 
      className="relative" 
      style={{ 
        backgroundColor: '#FFFFFF',
        width: '100vw',
        height: isMobile ? '100dvh' : '100vh',
        minHeight: isMobile ? '100dvh' : '100vh',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div 
        className="absolute left-0 right-0 text-center"
        style={{
          top: 'clamp(20px, 3.7vh, 40px)'
        }}
      >
        <h1 
          className="tracking-tight" 
          style={{ 
            fontFamily: 'Inter, sans-serif',
            fontWeight: 800,
            fontSize: isMobile ? 'clamp(18px, 5vw, 26px)' : 'clamp(28px, 2.9vw, 56px)',
            color: '#000000',
            letterSpacing: isMobile ? '-0.03em' : '-0.02em',
            lineHeight: isMobile ? 1.1 : 1.2
          }}
        >
          European Political Tech Landscape
        </h1>
        <p 
          className="mt-2" 
          style={{ 
            fontFamily: 'Inter, sans-serif',
            fontWeight: 400,
            fontSize: 'clamp(14px, 1.04vw, 20px)',
            color: '#000000',
            marginBottom: isMobile ? 'clamp(8px, 1.5vh, 16px)' : 'clamp(12px, 1.5vh, 20px)'
          }}
        >
          Prototype · Nov 2025 · Partisan
        </p>
      </div>

      {/* Version Label */}
      {!isMobile && (
        <div 
          className="absolute"
          style={{ 
            fontFamily: '"Courier New", Courier, monospace',
            fontWeight: 600,
            fontSize: 'clamp(11px, 0.73vw, 14px)',
            color: '#000000',
            top: 'clamp(20px, 3.7vh, 40px)',
            left: 'clamp(30px, 3.1vw, 60px)'
          }}
        >
          v1 Prototype
        </div>
      )}

      {/* Connection Arrows - Behind cards */}
      {!isMobile && <ConnectionArrows variant="desktop" />}

      {/* Grid Container */}
      <div 
        className="absolute"
        style={{
          top: gridTopOffset,
          left: gridHorizontalMargin,
          right: gridHorizontalMargin,
          bottom: gridBottomOffset,
        }}
      >
        {/* Row 0: 4 categories using absolute positioning */}
        <div 
          style={{ 
            position: 'relative', 
            height: rowHeight,
            marginBottom: rowSpacing
          }}
        >
          {categories
            .filter(cat => cat.position.row === 0)
            .sort((a, b) => a.position.col - b.position.col)
            .map((category) => {
              // Calculate positions for 4 items in 4-column space
              // Use calc to distribute available width across 4 columns with 3 gaps
              const col = category.position.col;
              const left = `calc(${col} * (${cardWidth} + ${gridGap}))`;
              
              return (
                <div
                  key={category.id}
                  style={{
                    position: 'absolute',
                    left: left,
                    top: 0,
                    width: cardWidth,
                    height: '100%'
                  }}
                >
                  <CategoryCard
                    name={category.name}
                    bgColor={category.bgColor}
                    logos={category.logos}
                    tooltip={category.tooltip}
                    isMobile={isMobile}
                    onTitleClick={category.detailed ? () => {
                      setSelectedCategoryInfo({
                        name: category.name,
                        detailed: category.detailed,
                        subcategories: category.subcategories
                      });
                      setCategoryModalOpen(true);
                    } : undefined}
                    onLogoClick={(company) => {
                      setSelected(company);
                      setOpen(true);
                    }}
                  />
                </div>
              );
            })}
        </div>

        {/* Row 1: 3 categories using absolute positioning for perfect centering */}
        <div 
          style={{ 
            position: 'relative', 
            height: rowHeight
          }}
        >
          {categories
            .filter(cat => cat.position.row === 1)
            .sort((a, b) => a.position.col - b.position.col)
            .map((category, index) => {
              // Calculate positions to center 3 items in 4-column space
              // To center 3 items: start at column 0.5, 1.5, 2.5
              const fractionalCol = 0.5 + index; // 0.5, 1.5, 2.5
              // Calculate left position: (fractionalCol * cardWidth) + (fractionalCol * gap)
              const left = `calc(${fractionalCol} * (${cardWidth} + ${gridGap}))`;
              
              return (
                <div
                  key={category.id}
                  style={{
                    position: 'absolute',
                    left: left,
                    top: 0,
                    width: cardWidth,
                    height: '100%'
                  }}
                >
                  <CategoryCard
                    name={category.name}
                    bgColor={category.bgColor}
                    logos={category.logos}
                    tooltip={category.tooltip}
                    isMobile={isMobile}
                    onTitleClick={category.detailed ? () => {
                      setSelectedCategoryInfo({
                        name: category.name,
                        detailed: category.detailed,
                        subcategories: category.subcategories
                      });
                      setCategoryModalOpen(true);
                    } : undefined}
                    onLogoClick={(company) => {
                      setSelected(company);
                      setOpen(true);
                    }}
                  />
                </div>
              );
            })}
        </div>
      </div>

      {/* Category Details Modal */}
      {categoryModalOpen && selectedCategoryInfo && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setCategoryModalOpen(false);
              setSelectedCategoryInfo(null);
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
              padding: '32px',
              maxWidth: '600px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              fontFamily: 'Inter, sans-serif'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', margin: 0 }}>
                {selectedCategoryInfo.name}
              </h2>
              <button
                onClick={() => {
                  setCategoryModalOpen(false);
                  setSelectedCategoryInfo(null);
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
            
            {selectedCategoryInfo.detailed && (
              <div style={{ fontSize: '15px', color: '#374151', lineHeight: '1.6', marginBottom: '24px' }}>
                {selectedCategoryInfo.detailed}
              </div>
            )}
            
            {selectedCategoryInfo.subcategories && (
              <div style={{ paddingTop: '20px', borderTop: '1px solid #E5E7EB' }}>
                <h3 style={{ 
                  fontSize: '14px', 
                  fontWeight: 600, 
                  color: '#374151', 
                  marginBottom: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Subcategories / Examples
                </h3>
                <div style={{ fontSize: '14px', color: '#6B7280', lineHeight: '1.6' }}>
                  {selectedCategoryInfo.subcategories}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Company Details Modal */}
      {open && selected && (() => {
        const logoUrl = selected.domain 
          ? (domainToLogoPath(selected.domain) || nameToLogoPath(selected.name))
          : nameToLogoPath(selected.name);
        
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
              {selected.domain ? (
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
              ) : null}
              
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