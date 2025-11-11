import React from 'react';
import { CategoryCard } from './components/CategoryCard';
import { ConnectionArrows } from './components/ConnectionArrows';

// EDIT THIS SECTION TO ADD YOUR LOGOS
// Just paste the image URLs and names for each category
const categoryData = {
  messaging: {
    name: 'Messaging & Media',
    bgColor: '#F3E8FF',
    logos: [
      // Example: { url: 'https://example.com/logo.png', name: 'Company Name' },
      // Add your logos here
    ]
  },
  engagement: {
    name: 'Engagement & Mobilisation',
    bgColor: '#F5E1FF',
    logos: []
  },
  fundraising: {
    name: 'Fundraising',
    bgColor: '#EBD6FF',
    logos: []
  },
  research: {
    name: 'Research & Insights',
    bgColor: '#EFE3FF',
    logos: []
  },
  analytics: {
    name: 'Data Analytics & Modeling',
    bgColor: '#EAD6FF',
    logos: []
  },
  govtech: {
    name: 'GovTech / Civic Infrastructure',
    bgColor: '#E9D5FF',
    logos: []
  },
  voting: {
    name: 'Voting Tech',
    bgColor: '#E7D0FF',
    logos: []
  },
  infrastructure: {
    name: 'Organisational Infrastructure',
    bgColor: '#F6ECFF',
    logos: []
  },
};

export default function App() {
  const categories = [
    { id: 'messaging', ...categoryData.messaging, position: { row: 0, col: 0 } },
    { id: 'engagement', ...categoryData.engagement, position: { row: 0, col: 1 } },
    { id: 'fundraising', ...categoryData.fundraising, position: { row: 0, col: 2 } },
    { id: 'research', ...categoryData.research, position: { row: 0, col: 3 } },
    { id: 'analytics', ...categoryData.analytics, position: { row: 1, col: 0 } },
    { id: 'govtech', ...categoryData.govtech, position: { row: 1, col: 1 } },
    { id: 'voting', ...categoryData.voting, position: { row: 1, col: 2 } },
    { id: 'infrastructure', ...categoryData.infrastructure, position: { row: 1, col: 3 } },
  ];

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
            />
          ))}
        </div>
      </div>

      {/* Footer Note */}
      <div 
        className="absolute bottom-[24px] right-[60px] max-w-[900px]"
        style={{ 
          fontFamily: 'Inter, sans-serif',
          fontWeight: 400,
          fontSize: '11px',
          color: '#6B7280',
          lineHeight: '1.5'
        }}
      >
        <strong>Schema (Map Bucket 1):</strong> 8 canonical categories consolidated from raw inputs: Civic Tech/Civictech/Govtech → GovTech/Civic Infra; 
        Voter Engagement + Volunteer Mobilisation + Community Engagement + Participation Tech → Engagement & Mobilisation; Information Integrity under 
        Messaging & Media; Organisational Infrastructure → Movement-Wide & Org Infra. Data: Relevance = Y.
      </div>
    </div>
  );
}