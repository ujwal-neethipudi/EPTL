import React from 'react';
import { SubcategoryGroup } from './SubcategoryGroup';

type Company = {
  name: string;
  domain?: string;
  description?: string;
  hq?: string;
  logo?: string;
};

// Border colors for each category
const categoryBorderColors: Record<string, string> = {
  // Brain
  'Research & Intelligence': '#3B82F6', // Blue
  'Strategy & Creative Production': '#8B5CF6', // Purple
  // Engine
  'Field & Mobilization': '#10B981', // Green
  'Campaign Management & CRM': '#F59E0B', // Orange
  'Fundraising & Payments': '#EF4444', // Red
  'Organizational Infrastructure': '#06B6D4', // Cyan
  // Megaphone
  'Digital Communications and Advertising': '#EC4899', // Pink
  'Participation & Election Tech': '#6366F1' // Indigo
};

// Helper function to generate different hues of a base color
function getSubcategoryHue(baseColor: string, index: number, total: number): string {
  // Parse hex color to RGB
  const hex = baseColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Create variations: lighter for earlier subcategories, darker for later ones
  // Variation factor: -15% to +10% brightness
  const variationRange = 0.25; // 25% variation range
  const variation = (index / Math.max(total - 1, 1)) * variationRange - 0.15; // -0.15 to +0.10
  
  // Apply variation (make lighter or darker)
  const newR = Math.max(0, Math.min(255, Math.round(r + (255 - r) * variation)));
  const newG = Math.max(0, Math.min(255, Math.round(g + (255 - g) * variation)));
  const newB = Math.max(0, Math.min(255, Math.round(b + (255 - b) * variation)));
  
  // Convert back to hex
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
}

interface CategorySectionProps {
  categoryName: string;
  companies?: Company[]; // For flat categories (no subcategories)
  subcategories?: Record<string, Company[]>; // For categories with subcategories
  onCompanyClick?: (company: Company) => void;
  isMobile?: boolean;
  bgColor?: string;
  entityCount?: number; // Total number of entities for adaptive sizing
  categoryCount?: number; // Number of categories in the pillar (for proportional sizing)
  forceFullHeight?: boolean; // If true, category should fill 100% of its container (for 50/50 split)
  logosPerRow?: number; // Optional: specify number of logos per row for flat categories
}

export function CategorySection({ 
  categoryName, 
  companies, 
  subcategories, 
  onCompanyClick, 
  isMobile = false,
  bgColor = '#FFFFFF',
  entityCount = 0,
  categoryCount = 2, // Default to 2 (Brain/Megaphone), Engine has 4
  forceFullHeight = false, // If true, fill container height (for 50/50 category split)
  logosPerRow // Optional: number of logos per row for flat categories
}: CategorySectionProps) {
  const hasSubcategories = subcategories && Object.keys(subcategories).length > 0;
  const isFlat = companies && companies.length > 0 && !hasSubcategories;
  
  // Calculate actual entity count if not provided
  const totalCount = entityCount > 0 
    ? entityCount 
    : (isFlat 
        ? companies!.length 
        : hasSubcategories 
          ? Object.values(subcategories!).reduce((sum, comps) => sum + comps.length, 0)
          : 0);

  // Adaptive sizing: Very compact for single-frame viewport
  // Adjust base sizing based on number of categories in pillar (more categories = smaller base)
  // Engine has 4 categories vs 2 for Brain/Megaphone, so needs very compact sizing
  const categoryScaleFactor = categoryCount > 2 ? 0.5 : 1.0; // Reduce by 50% if 4+ categories (very aggressive)
  const baseMinHeight = isMobile ? 45 : (45 * categoryScaleFactor); // Very reduced base: 45px scaled down for Engine (~22px)
  const entitiesPerUnit = categoryCount > 2 ? 8 : 5; // Very compact per entity for Engine (8 vs 5)
  const heightPerUnit = isMobile ? 25 : (25 * categoryScaleFactor); // Reduced height per unit: 25px scaled down (~12px)
  
  // Calculate adaptive height: base + (entities / entitiesPerUnit) * heightPerUnit
  const entityHeight = Math.ceil(totalCount / entitiesPerUnit) * heightPerUnit;
  const maxHeightCap = categoryCount > 2 ? (isMobile ? 100 : 115) : (isMobile ? 180 : 220); // Very low cap for Engine
  const adaptiveHeight = Math.min(baseMinHeight + entityHeight, maxHeightCap);

  // For categories with subcategories, calculate total height based on original subcategory height logic
  // This keeps category box size the same while allowing 50/50 split
  let categoryBoxHeight: string | undefined = undefined;
  if (hasSubcategories) {
    const subcatScaleFactor = categoryCount > 2 ? 0.65 : 1.0;
    const calculateSubcatHeight = (count: number) => {
      const subcatBaseHeight = isMobile ? 35 : (38 * subcatScaleFactor);
      const subcatEntityHeight = Math.ceil(count / (categoryCount > 2 ? 5 : 4)) * (isMobile ? 18 : (20 * subcatScaleFactor));
      const maxSubcatHeight = categoryCount > 2 ? (isMobile ? 110 : 130) : (isMobile ? 140 : 160);
      return Math.min(subcatBaseHeight + subcatEntityHeight, maxSubcatHeight);
    };
    
    const subcatEntries = Object.entries(subcategories!);
    const firstSubcat = subcatEntries[0];
    const remainingSubcats = subcatEntries.slice(1);
    const firstSubcatHeight = firstSubcat ? calculateSubcatHeight(firstSubcat[1].length) : 0;
    const remainingSubcatsMaxHeight = remainingSubcats.length > 0
      ? Math.max(...remainingSubcats.map(([_, companies]) => calculateSubcatHeight(companies.length)), 42)
      : 0;
    const gapHeight = 6;
    const totalSubcatsHeight = firstSubcatHeight + remainingSubcatsMaxHeight + (subcatEntries.length > 1 ? gapHeight : 0);
    
    // Calculate header height (approximate)
    const headerHeight = isMobile ? 25 : 30;
    const padding = categoryCount > 2 ? 12 : 20; // Top + bottom padding
    categoryBoxHeight = `${headerHeight + totalSubcatsHeight + padding}px`;
  }

  // Use flex-grow proportional to entity count, normalized by category count
  // Engine categories should grow much less since there are more of them
  const normalizedFlexGrow = categoryCount > 2 
    ? Math.max(totalCount * 0.04, 0.25) // Much reduced flex-grow for Engine (4 categories)
    : Math.max(totalCount * 0.1, 0.5); // Standard for Brain/Megaphone (2 categories)
  const flexGrowValue = normalizedFlexGrow;
  const borderColor = categoryBorderColors[categoryName] || '#E5E7EB';

  return (
    <div
      style={{
        flexShrink: 0,
        flexGrow: forceFullHeight ? 1 : (hasSubcategories ? 0 : flexGrowValue), // Fill container if forceFullHeight, otherwise use original logic
        height: forceFullHeight ? '100%' : categoryBoxHeight, // Fill container if forceFullHeight, otherwise use calculated height
        minHeight: forceFullHeight ? '100%' : (hasSubcategories ? categoryBoxHeight : `${adaptiveHeight}px`), // Fill container if forceFullHeight
        padding: categoryCount > 2 ? 'clamp(4px, 0.4vw, 6px)' : 'clamp(6px, 0.6vw, 10px)', // Very compact padding for Engine
        backgroundColor: bgColor,
        borderRadius: '6px',
        boxShadow: `0 0 0 1px ${borderColor}`, // Box-shadow respects border-radius and won't be clipped
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden' // Keep content within box
      }}
    >
      {/* Category Header - Compact */}
      <h2
        style={{
          fontFamily: 'monospace',
          fontWeight: 600,
          fontSize: isMobile ? 'clamp(11px, 2.5vw, 14px)' : (categoryCount > 2 ? 'clamp(11px, 0.8vw, 13px)' : 'clamp(12px, 0.9vw, 14px)'),
          color: '#003399', // EU blue
          marginBottom: categoryCount > 2 ? 'clamp(3px, 0.4vh, 5px)' : 'clamp(4px, 0.5vh, 6px)',
          paddingBottom: 0,
          marginTop: 0,
          lineHeight: 1.2,
          textAlign: 'center'
        }}
      >
        {categoryName}
      </h2>

      {/* Content: Subcategories or Flat Logo Grid */}
      {hasSubcategories ? (
        // Render subcategories: special layout for Digital Communications, otherwise first one full width, rest side-by-side
        (() => {
          const subcatEntries = Object.entries(subcategories);
          
          // Special layout for Participation & Election Tech: Deliberative Tech first, then other two horizontally
          if (categoryName === 'Participation & Election Tech') {
            // Find the specific subcategories
            const deliberativeTech = subcatEntries.find(([name]) => name === 'Deliberative Tech & Citizen Input');
            const voting = subcatEntries.find(([name]) => name === 'Voting & Election Systems');
            const citizenAdvocacy = subcatEntries.find(([name]) => name === 'Citizen Advocacy & Petitions');
            
            const firstSubcat = deliberativeTech ? [deliberativeTech] : [];
            const bottomSubcats = [voting, citizenAdvocacy].filter(Boolean) as [string, Company[]][];
            
            // Get original indices for hue calculation
            const getSubcatIndex = (name: string) => subcatEntries.findIndex(([n]) => n === name);
            
            return (
              <div style={{ 
                flex: 1, // Fill available space in category box
                display: 'flex', 
                flexDirection: 'column', 
                gap: 'clamp(4px, 0.5vh, 6px)',
                minHeight: 0,
                overflow: 'hidden'
              }}>
                {/* First subcategory: Deliberative Tech & Citizen Input, full width, 50% of space */}
                {firstSubcat.length > 0 && (
                  <div style={{
                    flex: '0 0 50%', // 50% of available space
                    flexShrink: 0,
                    minHeight: 0,
                    overflow: 'hidden'
                  }}>
                    <SubcategoryGroup
                      subcategoryName={firstSubcat[0][0]}
                      companies={firstSubcat[0][1]}
                      onCompanyClick={onCompanyClick}
                      isMobile={isMobile}
                      logosPerRow={5} // 5 logos per row for Deliberative Tech & Citizen Input
                      borderColor={getSubcategoryHue(borderColor, getSubcatIndex(firstSubcat[0][0]), subcatEntries.length)}
                    />
                  </div>
                )}
                
                {/* Bottom section: Voting & Citizen Advocacy horizontally stacked, 50% of space */}
                {bottomSubcats.length > 0 && (
                  <div style={{
                    flex: '0 0 50%', // 50% of available space
                    display: 'grid',
                    gridTemplateColumns: isMobile 
                      ? '1fr' // Stack vertically on mobile
                      : `repeat(${bottomSubcats.length}, 1fr)`, // Side-by-side on desktop
                    gap: 'clamp(4px, 0.5vh, 6px)',
                    flexShrink: 0,
                    minHeight: 0,
                    overflow: 'hidden'
                  }}>
                    {bottomSubcats.map(([subcatName, subcatCompanies]) => (
                      <div 
                        key={subcatName} 
                        style={{ 
                          height: '100%',
                          overflow: 'hidden'
                        }}
                      >
                        <SubcategoryGroup
                          subcategoryName={subcatName}
                          companies={subcatCompanies}
                          onCompanyClick={onCompanyClick}
                          isMobile={isMobile}
                          borderColor={getSubcategoryHue(borderColor, getSubcatIndex(subcatName), subcatEntries.length)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          }
          
          // Special layout for Organizational Infrastructure: all subcategories horizontally stacked
          if (categoryName === 'Organizational Infrastructure') {
            return (
              <div style={{ 
                flex: 1, // Fill available space in category box
                display: 'grid',
                gridTemplateColumns: isMobile 
                  ? '1fr' // Stack vertically on mobile
                  : `repeat(${subcatEntries.length}, 1fr)`, // Side-by-side on desktop
                gap: 'clamp(4px, 0.5vh, 6px)',
                minHeight: 0,
                overflow: 'hidden'
              }}>
                {subcatEntries.map(([subcatName, subcatCompanies], index) => (
                  <div 
                    key={subcatName} 
                    style={{ 
                      height: '100%',
                      overflow: 'hidden'
                    }}
                  >
                      <SubcategoryGroup
                        subcategoryName={subcatName}
                        companies={subcatCompanies}
                        onCompanyClick={onCompanyClick}
                        isMobile={isMobile}
                        borderColor={getSubcategoryHue(borderColor, index, subcatEntries.length)}
                      />
                  </div>
                ))}
              </div>
            );
          }
          
          // Special layout for Digital Communications and Advertising
          if (categoryName === 'Digital Communications and Advertising') {
            // Find the specific subcategories
            const infoIntegrity = subcatEntries.find(([name]) => name === 'Information Integrity & Defense');
            const socialMedia = subcatEntries.find(([name]) => name === 'Social Media & Management');
            const multiChannel = subcatEntries.find(([name]) => name === 'Multi-channel Messaging');
            const digitalAds = subcatEntries.find(([name]) => name === 'Digital Advertising & Targeting');
            
            const topSubcats = [infoIntegrity, socialMedia].filter(Boolean) as [string, Company[]][];
            const bottomSubcats = [multiChannel, digitalAds].filter(Boolean) as [string, Company[]][];
            
            // Get original indices for hue calculation
            const getSubcatIndex = (name: string) => subcatEntries.findIndex(([n]) => n === name);
            
            return (
              <div style={{ 
                flex: 1, // Fill available space in category box
                display: 'flex', 
                flexDirection: 'column', 
                gap: 'clamp(4px, 0.5vh, 6px)',
                minHeight: 0,
                overflow: 'hidden'
              }}>
                {/* Top section: Info Integrity & Social Media vertically stacked, 70% of space (35% + 35%) */}
                {topSubcats.length > 0 && (
                  <div style={{
                    flex: '0 0 70%', // 70% of available space (for 35% + 35% rows)
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'clamp(4px, 0.5vh, 6px)',
                    flexShrink: 0,
                    minHeight: 0,
                    overflow: 'hidden'
                  }}>
                    {topSubcats.map(([subcatName, subcatCompanies]) => (
                      <div 
                        key={subcatName} 
                        style={{ 
                          flex: '0 0 50%', // Each takes 50% of this section (50% of 70% = 35% total each)
                          flexShrink: 0,
                          overflow: 'hidden',
                          minHeight: 0
                        }}
                      >
                        <SubcategoryGroup
                          subcategoryName={subcatName}
                          companies={subcatCompanies}
                          onCompanyClick={onCompanyClick}
                          isMobile={isMobile}
                          logosPerRow={5} // 5 logos per row for Info Integrity & Social Media
                          borderColor={getSubcategoryHue(borderColor, getSubcatIndex(subcatName), subcatEntries.length)}
                        />
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Bottom section: Multi-channel & Digital Ads horizontally stacked, 30% of space */}
                {bottomSubcats.length > 0 && (
                  <div style={{
                    flex: '0 0 30%', // 30% of available space
                    display: 'grid',
                    gridTemplateColumns: isMobile 
                      ? '1fr' // Stack vertically on mobile
                      : `repeat(${bottomSubcats.length}, 1fr)`, // Side-by-side on desktop
                    gap: 'clamp(4px, 0.5vh, 6px)',
                    flexShrink: 0,
                    minHeight: 0,
                    overflow: 'hidden'
                  }}>
                    {bottomSubcats.map(([subcatName, subcatCompanies]) => (
                      <div 
                        key={subcatName} 
                        style={{ 
                          height: '100%',
                          overflow: 'hidden'
                        }}
                      >
                        <SubcategoryGroup
                          subcategoryName={subcatName}
                          companies={subcatCompanies}
                          onCompanyClick={onCompanyClick}
                          isMobile={isMobile}
                          borderColor={getSubcategoryHue(borderColor, getSubcatIndex(subcatName), subcatEntries.length)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          }
          
          // Default layout: first one full width, rest side-by-side
          const firstSubcat = subcatEntries[0];
          const remainingSubcats = subcatEntries.slice(1);
          
          // Calculate adaptive height for subcategory - more compact for Engine
          const subcatScaleFactor = categoryCount > 2 ? 0.65 : 1.0;
          const calculateSubcatHeight = (count: number) => {
            const subcatBaseHeight = isMobile ? 35 : (38 * subcatScaleFactor);
            const subcatEntityHeight = Math.ceil(count / (categoryCount > 2 ? 5 : 4)) * (isMobile ? 18 : (20 * subcatScaleFactor));
            const maxSubcatHeight = categoryCount > 2 ? (isMobile ? 110 : 130) : (isMobile ? 140 : 160);
            return Math.min(subcatBaseHeight + subcatEntityHeight, maxSubcatHeight);
          };
          
          // Calculate total height using original logic (sum of calculated heights + gap)
          const firstSubcatHeight = firstSubcat ? calculateSubcatHeight(firstSubcat[1].length) : 0;
          const remainingSubcatsMaxHeight = remainingSubcats.length > 0
            ? Math.max(...remainingSubcats.map(([_, companies]) => calculateSubcatHeight(companies.length)), 42)
            : 0;
          const gapHeight = 6; // Gap between subcategories
          const totalSubcatsHeight = firstSubcatHeight + remainingSubcatsMaxHeight + (subcatEntries.length > 1 ? gapHeight : 0);
          
          return (
            <div style={{ 
              flex: 1, // Fill available space in category box (removes empty space)
              display: 'flex', 
              flexDirection: 'column', 
              gap: 'clamp(4px, 0.5vh, 6px)',
              minHeight: 0,
              overflow: 'hidden' // No scrolling needed - all subcategories visible
            }}>
              {/* First subcategory: Full width, 50% of available space */}
              {firstSubcat && (
                <div 
                  key={firstSubcat[0]} 
                  style={{ 
                    flex: '0 0 50%', // 50% of available space
                    flexShrink: 0,
                    overflow: 'hidden',
                    minHeight: 0
                  }}
                >
                  <SubcategoryGroup
                    subcategoryName={firstSubcat[0]}
                    companies={firstSubcat[1]}
                    onCompanyClick={onCompanyClick}
                    isMobile={isMobile}
                    logosPerRow={firstSubcat[0] === 'Legislative & Policy Tracking' || firstSubcat[0] === 'Strategic Advisory & Agencies' ? 5 : undefined} // Special cases: 5 per row
                    borderColor={getSubcategoryHue(borderColor, 0, subcatEntries.length)}
                  />
                </div>
              )}
              
              {/* Remaining subcategories: Side-by-side horizontally, 50% of available space */}
              {remainingSubcats.length > 0 && (
                <div style={{
                  flex: '0 0 50%', // 50% of available space
                  display: 'grid',
                  gridTemplateColumns: isMobile 
                    ? '1fr' // Stack vertically on mobile
                    : `repeat(${remainingSubcats.length}, 1fr)`, // Side-by-side on desktop
                  gap: 'clamp(4px, 0.5vh, 6px)',
                  flexShrink: 0,
                  minHeight: 0,
                  overflow: 'hidden'
                }}>
                  {remainingSubcats.map(([subcatName, subcatCompanies], remainingIndex) => {
                    const originalIndex = subcatEntries.findIndex(([name]) => name === subcatName);
                    return (
                      <div 
                        key={subcatName} 
                        style={{ 
                          height: '100%',
                          overflow: 'hidden'
                        }}
                      >
                        <SubcategoryGroup
                          subcategoryName={subcatName}
                          companies={subcatCompanies}
                          onCompanyClick={onCompanyClick}
                          isMobile={isMobile}
                          logosPerRow={subcatName === 'Strategic Advisory & Agencies' ? 5 : undefined} // 5 per row for Strategic Advisory & Agencies
                          borderColor={getSubcategoryHue(borderColor, originalIndex, subcatEntries.length)}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()
      ) : isFlat ? (
        // Render flat logo grid (no subcategories) - compact, centered
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center', // Center logos, even for odd numbers or incomplete rows
            alignItems: 'flex-start',
            alignContent: 'flex-start',
            gap: 'clamp(4px, 0.4vw, 6px)',
            overflowY: 'auto' // Allow scrolling if needed
          }}
        >
          {companies!.map((company, index) => {
            const logoUrl = company.logo || 
              (company.domain 
                ? `/logos/${company.domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].replace(/\./g, '-')}.png`
                : null);
            
            // Calculate max-width: use logosPerRow if specified, otherwise use fixed width
            const targetPerRow = logosPerRow || undefined;
            const maxWidthPerLogo = targetPerRow 
              ? `calc((100% - ${targetPerRow - 1} * clamp(4px, 0.4vw, 6px)) / ${targetPerRow})`
              : undefined;
            
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
                  padding: 'clamp(4px, 0.4vw, 6px)',
                  flexShrink: 0,
                  width: isMobile 
                    ? 'calc(33.333% - clamp(2.67px, 0.27vw, 4px))' // ~3 columns on mobile
                    : (maxWidthPerLogo || 'clamp(77px, 4.95vw, 88px)'), // Dynamic width if logosPerRow specified, otherwise fixed width
                  maxWidth: maxWidthPerLogo, // Cap at calculated width if logosPerRow specified
                  minWidth: isMobile ? undefined : (logosPerRow === 5 ? 'clamp(44px, 2.75vw, 55px)' : undefined) // Smaller min width for 5 per row
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
                      ? 'clamp(50px, 6.6vw, 61px)' 
                      : 'clamp(55px, 3.85vw, 72px)', // Logo fits within container width
                    height: isMobile 
                      ? 'clamp(31px, 3.85vh, 39px)' 
                      : 'clamp(33px, 2.75vh, 40px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 'clamp(2px, 0.3vw, 4px)',
                    flexShrink: 0
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
                            border-radius: 4px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-family: Inter, sans-serif;
                            font-size: clamp(8px, 0.6vw, 10px);
                            font-weight: 500;
                            color: #6B1FA8;
                            text-align: center;
                            padding: clamp(3px, 0.3vw, 5px);
                          ">${company.name.substring(0, 8)}</div>`;
                        }
                      }}
                    />
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
                        fontSize: 'clamp(8px, 0.6vw, 10px)',
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
                    fontSize: isMobile ? 'clamp(8px, 1.5vw, 9px)' : 'clamp(8px, 0.6vw, 10px)',
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
          No companies in this category
        </div>
      )}
    </div>
  );
}
