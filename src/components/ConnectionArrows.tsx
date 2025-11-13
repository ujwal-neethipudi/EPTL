import React from 'react';

type CategoryKey =
  | 'messaging'
  | 'engagement'
  | 'fundraising'
  | 'research'
  | 'analytics'
  | 'voting'
  | 'infrastructure';

type CategoryPositions = Partial<Record<CategoryKey, { x: number; y: number }>>;

interface ConnectionArrowsProps {
  positions?: CategoryPositions;
}

export function ConnectionArrows({ positions: dynamicPositions = {} }: ConnectionArrowsProps = {}) {
  // Calculate positions based on the grid layout
  // Grid starts at top: 200px, left: 60px
  // Card dimensions: (1920 - 120 - 144) / 4 = 414px width per card (including gaps)
  // Card dimensions: (1080 - 200 - 120 - 48) / 2 = 356px height per card (including gaps)
  
  const gridLeft = 60;
  const gridTop = 200;
  const cardWidth = 414;
  const cardHeight = 356;
  const gap = 48;
  const actualCardWidth = cardWidth - (gap * 3 / 4);
  const actualCardHeight = cardHeight - (gap / 2);

  // Helper to get card center position
  const getCardCenter = (row: number, col: number, fractionalCol?: number) => {
    if (fractionalCol !== undefined) {
      // For row 1 with fractional positioning (centered items)
      const left = gridLeft + fractionalCol * cardWidth + fractionalCol * gap;
      return {
        x: left + actualCardWidth / 2,
        y: gridTop + row * cardHeight + actualCardHeight / 2
      };
    } else {
      // For row 0 with standard grid positioning
      return {
        x: gridLeft + col * cardWidth + actualCardWidth / 2,
        y: gridTop + row * cardHeight + actualCardHeight / 2
      };
    }
  };

  // Category positions (row, col) - row 1 uses fractional columns for centering
  const gridLayout: Record<CategoryKey, { row: number; col?: number; fractionalCol?: number }> = {
    messaging: { row: 0, col: 0 },
    engagement: { row: 0, col: 1 },
    fundraising: { row: 0, col: 2 },
    research: { row: 0, col: 3 },
    analytics: { row: 1, fractionalCol: 0.5 }, // Centered between col 0 and 1
    voting: { row: 1, fractionalCol: 1.5 }, // Centered between col 1 and 2
    infrastructure: { row: 1, fractionalCol: 2.5 }, // Centered between col 2 and 3
  };

  const connections: Array<{
    from: CategoryKey;
    to: CategoryKey;
    thick?: boolean;
    bidirectional?: boolean;
    thin?: boolean;
  }> = [
    // [0,1] Research & Insights → Data Analytics & Modeling
    { from: 'research', to: 'analytics', thick: false },
    // [0,2] Research & Insights → Messaging & Media
    { from: 'research', to: 'messaging', thick: false },
    // [1,2] Data Analytics & Modeling → Messaging & Media
    { from: 'analytics', to: 'messaging', thick: false },
    // [1,3] Data Analytics & Modeling → Engagement & Mobilisation
    { from: 'analytics', to: 'engagement', thick: false },
    // [1,5] Data Analytics & Modeling → Fundraising
    { from: 'analytics', to: 'fundraising', thick: false },
    // [1,6] Data Analytics & Modeling → Voting Tech
    { from: 'analytics', to: 'voting', thick: false },
    // [2,3] Messaging & Media → Engagement & Mobilisation
    { from: 'messaging', to: 'engagement', thick: false },
    // [3,5] Engagement & Mobilisation → Fundraising
    { from: 'engagement', to: 'fundraising', thick: false },
    // [3,6] Engagement & Mobilisation → Voting Tech
    { from: 'engagement', to: 'voting', thick: false },
    // [4,2] Organisational Infrastructure → Messaging & Media
    { from: 'infrastructure', to: 'messaging', thick: false, thin: true },
    // [4,3] Organisational Infrastructure → Engagement & Mobilisation
    { from: 'infrastructure', to: 'engagement', thick: false, thin: true },
    // [4,5] Organisational Infrastructure → Fundraising
    { from: 'infrastructure', to: 'fundraising', thick: false, thin: true },
    // [6,0] Voting Tech → Research & Insights (feedback loop - bidirectional)
    { from: 'voting', to: 'research', thick: false, bidirectional: true },
  ];

  const getCenterForCategory = (key: CategoryKey) => {
    const dynamic = dynamicPositions[key];
    if (dynamic) {
      return dynamic;
    }
    const layout = gridLayout[key];
    if ('fractionalCol' in layout) {
      return getCardCenter(layout.row, 0, layout.fractionalCol);
    } else {
      return getCardCenter(layout.row, layout.col);
    }
  };

  const createCurvedPath = (from: CategoryKey, to: CategoryKey) => {
    const fromPos = getCenterForCategory(from);
    const toPos = getCenterForCategory(to);

    const dx = toPos.x - fromPos.x;
    const dy = toPos.y - fromPos.y;
    
    // Create a curved path using quadratic bezier
    const controlPointX = fromPos.x + dx * 0.5;
    const controlPointY = fromPos.y + dy * 0.5 + (dx > 0 ? -30 : 30);

    const path = `M ${fromPos.x} ${fromPos.y} Q ${controlPointX} ${controlPointY} ${toPos.x} ${toPos.y}`;
    
    return path;
  };

  return (
    <svg 
      className="absolute inset-0 pointer-events-none"
      style={{ 
        width: '1920px', 
        height: '1080px',
        zIndex: 0
      }}
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path
            d="M0,0 L0,6 L9,3 z"
            fill="#A855F7"
            opacity="0.25"
          />
        </marker>
        <marker
          id="arrowhead-thin"
          markerWidth="8"
          markerHeight="8"
          refX="7"
          refY="2.5"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path
            d="M0,0 L0,5 L7,2.5 z"
            fill="#A855F7"
            opacity="0.15"
          />
        </marker>
      </defs>

      {connections.map((conn, index) => {
        const isThin = conn.thin || false;
        const path = createCurvedPath(conn.from, conn.to);
        
        return (
          <g key={index}>
            <path
              d={path}
              stroke="#A855F7"
              strokeWidth={isThin ? "2" : "3.5"}
              fill="none"
              opacity={isThin ? "0.15" : "0.25"}
              strokeLinecap="round"
              markerEnd={`url(#${isThin ? 'arrowhead-thin' : 'arrowhead'})`}
            />
            {conn.bidirectional && (
              <path
                d={createCurvedPath(conn.to, conn.from)}
                stroke="#A855F7"
                strokeWidth="3.5"
                fill="none"
                opacity="0.25"
                strokeLinecap="round"
                markerEnd="url(#arrowhead)"
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}
