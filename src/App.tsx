import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { CategoryCard } from './components/CategoryCard';
import { ConnectionArrows } from './components/ConnectionArrows';

type Company = {
  name: string;
  domain?: string;
  description?: string;
};

type CompaniesByCategory = Record<string, Company[]>;

// Type for tracking which category a company belongs to
type CompanyCategoryMap = Record<string, string>; // company name -> category key

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

// Helper to map company name to logo filename (for entities without domains)
// Logo files are named like: electify.png, my-company.png
function nameToLogoPath(name: string): string | null {
  if (!name) return null;
  
  // Normalize name: lowercase, replace spaces and special chars with hyphens
  let normalized = name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .substring(0, 60); // Limit length
  
  return `/logos/${normalized}.png`;
}

const STORAGE_KEY = 'company-category-assignments';

const categoryMap = {
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
  const [selectedCurrentCategory, setSelectedCurrentCategory] = useState<string | null>(null);
  const [categoryAssignments, setCategoryAssignments] = useState<CompanyCategoryMap>({});
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [selectedCategoryInfo, setSelectedCategoryInfo] = useState<{ name: string; detailed?: string; subcategories?: string } | null>(null);

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
        {/* Row 0: 4 categories using absolute positioning */}
        <div style={{ position: 'relative', height: '356px', marginBottom: '48px' }}>
          {categories
            .filter(cat => cat.position.row === 0)
            .sort((a, b) => a.position.col - b.position.col)
            .map((category) => {
              // Calculate positions for 4 items in 4-column space
              // Container width: 1920 - 120 = 1800px
              // Column width: 414px, Gap: 48px
              const gridLeft = 0; // Relative to container
              const columnWidth = 414;
              const gap = 48;
              const col = category.position.col;
              const left = gridLeft + col * columnWidth + col * gap;
              
              return (
                <div
                  key={category.id}
                  style={{
                    position: 'absolute',
                    left: `${left}px`,
                    top: 0,
                    width: `${columnWidth}px`,
                    height: '100%'
                  }}
                >
                  <CategoryCard
                    name={category.name}
                    bgColor={category.bgColor}
                    logos={category.logos}
                    tooltip={category.tooltip}
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
                      // Find current category for this company
                      if (data) {
                        const currentCategory = getCompanyCategory(company.name, data);
                        setSelectedCurrentCategory(currentCategory);
                      }
                      setOpen(true);
                    }}
                  />
                </div>
              );
            })}
        </div>

        {/* Row 1: 3 categories using absolute positioning for perfect centering */}
        <div style={{ position: 'relative', height: '356px' }}>
          {categories
            .filter(cat => cat.position.row === 1)
            .sort((a, b) => a.position.col - b.position.col)
            .map((category, index) => {
              // Calculate positions to center 3 items in 4-column space
              // Container width: 1920 - 120 = 1800px
              // Column width: 414px, Gap: 48px
              // To center 3 items: start at column 0.5, 1.5, 2.5
              const gridLeft = 0; // Relative to container
              const columnWidth = 414;
              const gap = 48;
              const fractionalCol = 0.5 + index; // 0.5, 1.5, 2.5
              const left = gridLeft + fractionalCol * columnWidth + fractionalCol * gap;
              
              return (
                <div
                  key={category.id}
                  style={{
                    position: 'absolute',
                    left: `${left}px`,
                    top: 0,
                    width: `${columnWidth}px`,
                    height: '100%'
                  }}
                >
                  <CategoryCard
                    name={category.name}
                    bgColor={category.bgColor}
                    logos={category.logos}
                    tooltip={category.tooltip}
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
                      // Find current category for this company
                      if (data) {
                        const currentCategory = getCompanyCategory(company.name, data);
                        setSelectedCurrentCategory(currentCategory);
                      }
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
            
            <div style={{ fontSize: '14px', color: '#374151', lineHeight: '1.6', marginBottom: '20px' }}>
              {selected.description || 'No description available.'}
            </div>
            
            {/* Category Selector */}
            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #E5E7EB' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '13px', 
                fontWeight: 600, 
                color: '#374151', 
                marginBottom: '8px' 
              }}>
                Category
              </label>
              <select
                value={selectedCurrentCategory || ''}
                onChange={(e) => {
                  const newCategory = e.target.value;
                  if (selected && newCategory) {
                    moveCompanyToCategory(selected.name, newCategory);
                    setSelectedCurrentCategory(newCategory);
                  }
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '14px',
                  fontFamily: 'Inter, sans-serif',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  backgroundColor: '#FFFFFF',
                  color: '#111827',
                  cursor: 'pointer'
                }}
              >
                {Object.entries(categoryMap).map(([id, config]) => (
                  <option key={id} value={config.key}>
                    {config.name}
                  </option>
                ))}
              </select>
              <p style={{ 
                fontSize: '12px', 
                color: '#6B7280', 
                marginTop: '6px',
                fontStyle: 'italic'
              }}>
                Changes are saved automatically and persist across page refreshes.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}