import React from 'react';
import { CategorySection } from './CategorySection';

type Company = {
  name: string;
  domain?: string;
  description?: string;
  hq?: string;
  logo?: string;
};

type CategoryData = 
  | Company[] // Flat category (array of companies)
  | Record<string, Company[]>; // Category with subcategories

interface PillarColumnProps {
  pillarName: string;
  categories: Record<string, CategoryData>;
  onCompanyClick?: (company: Company) => void;
  onMaximize?: (categoryName: string, subcategoryName?: string) => void;
  isMobile?: boolean;
}

// Color mapping for pillars (very light hues)
const pillarColors: Record<string, string> = {
  'Brain': '#F0F4F8', // Very light blue
  'Engine': '#F0F9F5', // Very light green
  'Megaphone': '#FFF5F0' // Very light orange
};

export function PillarColumn({ pillarName, categories, onCompanyClick, onMaximize, isMobile = false }: PillarColumnProps) {
  const bgColor = pillarColors[pillarName] || '#FFFFFF';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: isMobile ? 'clamp(8px, 1.5vw, 12px)' : 'clamp(10px, 1vw, 14px)',
        backgroundColor: bgColor,
        borderRadius: '8px',
        overflow: 'hidden' // Ensure content fits within column
      }}
    >
      {/* Categories - Flexbox sized to fit without scrolling */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden', // No scrolling - everything must fit
          paddingRight: 'clamp(2px, 0.3vw, 4px)',
          gap: 'clamp(3px, 0.3vh, 5px)', // Very reduced gap to maximize vertical space
          minHeight: 0
        }}
      >
        {(() => {
          const categoryEntries = Object.entries(categories);
          const categoryCount = categoryEntries.length;
          // For BRAIN and MEGAPHONE (2 categories), each should be 50% of column height
          const isTwoCategoryColumn = categoryCount === 2;
          // For ENGINE (4 categories), use fixed proportions: 25%, 30%, 15%, 30% (remaining)
          const isFourCategoryColumn = categoryCount === 4;
          const engineProportions = [25, 30, 15, 30]; // Percentage for each category (4th is remaining = 100% - 25% - 30% - 15%)
          
          return categoryEntries.map(([categoryName, categoryData], index) => {
            // Determine if this is a flat category or has subcategories
            const isArray = Array.isArray(categoryData);
            const hasSubcategories = !isArray && typeof categoryData === 'object' && categoryData !== null;
            
            // Calculate total entity count for this category
            let entityCount = 0;
            if (isArray) {
              entityCount = categoryData.length;
            } else if (hasSubcategories) {
              entityCount = Object.values(categoryData).reduce((sum, companies) => sum + companies.length, 0);
            }

            // Determine flex value based on column type
            let flexValue: string | undefined;
            if (isTwoCategoryColumn) {
              flexValue = '0 0 50%'; // 50% height for BRAIN/MEGAPHONE categories
            } else if (isFourCategoryColumn && index < engineProportions.length) {
              flexValue = `0 0 ${engineProportions[index]}%`; // Fixed proportions for ENGINE
            }

            return (
              <div
                key={categoryName}
                style={{
                  flex: flexValue, // Fixed proportions for 2 or 4 category columns
                  flexShrink: 0,
                  minHeight: 0,
                  overflow: 'hidden'
                }}
              >
                <CategorySection
                  categoryName={categoryName}
                  companies={isArray ? categoryData : undefined}
                  subcategories={hasSubcategories ? categoryData : undefined}
                  onCompanyClick={onCompanyClick}
                  onMaximize={onMaximize}
                  isMobile={isMobile}
                  entityCount={entityCount}
                  categoryCount={categoryCount} // Pass category count to adjust sizing
                  forceFullHeight={isTwoCategoryColumn || isFourCategoryColumn} // Force category to fill its container for fixed-size columns
                  logosPerRow={isFourCategoryColumn && index < 3 ? 5 : undefined} // 5 logos per row for Engine rows 1, 2, 3
                />
              </div>
            );
          });
        })()}
      </div>
    </div>
  );
}
