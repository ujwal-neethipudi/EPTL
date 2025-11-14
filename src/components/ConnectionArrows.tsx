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
  variant?: 'desktop' | 'mobile';
}

export function ConnectionArrows({ positions: dynamicPositions = {}, variant = 'desktop' }: ConnectionArrowsProps = {}) {
  // Calculate positions based on viewport units
  // Match the layout calculations from App.tsx
  // Grid container: left/right = clamp(30px, 3.1vw, 60px), top = clamp(120px, 18.5vh, 200px), bottom = clamp(60px, 5.5vh, 120px)
  // For SVG, we'll use a viewBox of 0 0 100 100 representing viewport percentages
  
  // Approximate layout constants based on desktop grid (percentage of viewport)
  const gridLeft = 3.125;
  const gridTop = 18.52;
  const gridBottom = 5.56;
  const availableWidth = 100 - (gridLeft * 2);
  const availableHeight = 100 - gridTop - gridBottom;
  const gapWidthPercent = 2.5;
  const gapHeightPercent = 4.44;
  const numGaps = 3;
  const cardWidthPercent = (availableWidth - (numGaps * gapWidthPercent)) / 4;
  const cardHeightPercent = (availableHeight - gapHeightPercent) / 2;

  const getCardCenter = (row: number, col: number, fractionalCol?: number) => {
    let x: number;
    let y: number;
    
    if (fractionalCol !== undefined) {
      // Row 1: fractional columns (0.5, 1.5, 2.5)
      x = gridLeft + (fractionalCol * (cardWidthPercent + gapWidthPercent)) + (cardWidthPercent / 2);
      y = gridTop + row * (cardHeightPercent + gapHeightPercent) + (cardHeightPercent / 2);
    } else {
      // Row 0: standard columns
      x = gridLeft + col * (cardWidthPercent + gapWidthPercent) + (cardWidthPercent / 2);
      y = gridTop + row * (cardHeightPercent + gapHeightPercent) + (cardHeightPercent / 2);
    }
    
    return { x, y };
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

  const baseConnections: Array<{
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

  const connections = variant === 'mobile'
    ? [
        { from: 'research', to: 'analytics' },
        { from: 'analytics', to: 'voting' },
        { from: 'analytics', to: 'fundraising' },
        { from: 'infrastructure', to: 'fundraising' }
      ]
    : baseConnections;

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
    // Control point offset as percentage of viewport (scaled down from ~30px)
    const controlOffset = dx > 0 ? -2 : 2; // Adjusted for percentage coordinates
    const controlPointX = fromPos.x + dx * 0.5;
    const controlPointY = fromPos.y + dy * 0.5 + controlOffset;

    const path = `M ${fromPos.x} ${fromPos.y} Q ${controlPointX} ${controlPointY} ${toPos.x} ${toPos.y}`;
    
    return path;
  };

  const getEdgePoint = (key: CategoryKey, edge: 'top' | 'bottom') => {
    const center = getCenterForCategory(key);
    const offset = (cardHeightPercent / 2) - 1; // subtract 1% to avoid overshooting rounded corners
    return {
      x: center.x,
      y: edge === 'top' ? center.y - offset : center.y + offset,
    };
  };

  const createMobilePath = (from: CategoryKey, to: CategoryKey) => {
    const fromLayout = gridLayout[from];
    const toLayout = gridLayout[to];
    const fromEdge = (fromLayout.row === 0) ? 'bottom' : 'top';
    const toEdge = (toLayout.row === 0) ? 'bottom' : 'top';
    const start = getEdgePoint(from, fromEdge);
    const end = getEdgePoint(to, toEdge);

    return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
  };

  return (
    <svg 
      className="absolute inset-0 pointer-events-none"
      style={{ 
        width: '100vw', 
        height: '100vh',
        zIndex: 0
      }}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="0.6"
          markerHeight="0.6"
          refX="0.55"
          refY="0.3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path
            d="M0,0 L0,0.4 L0.55,0.2 z"
            fill="#6B1FA8"
            opacity="0.5"
          />
        </marker>
        <marker
          id="arrowhead-thin"
          markerWidth="0.5"
          markerHeight="0.5"
          refX="0.45"
          refY="0.25"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path
            d="M0,0 L0,0.35 L0.45,0.175 z"
            fill="#6B1FA8"
            opacity="0.4"
          />
        </marker>
      </defs>

      {connections.map((conn, index) => {
        const isThin = conn.thin || false;
        const path = variant === 'mobile'
          ? createMobilePath(conn.from, conn.to)
          : createCurvedPath(conn.from, conn.to);
        
        return (
          <g key={index}>
            <path
              d={path}
              stroke="#6B1FA8"
              strokeWidth={
                variant === 'mobile' ? "0.12" : isThin ? "0.15" : "0.2"
              }
              fill="none"
              opacity={variant === 'mobile' ? "0.35" : isThin ? "0.4" : "0.5"}
              strokeLinecap="round"
              markerEnd={
                variant === 'mobile'
                  ? undefined
                  : `url(#${isThin ? 'arrowhead-thin' : 'arrowhead'})`
              }
            />
            {conn.bidirectional && variant !== 'mobile' && (
              <path
                d={createCurvedPath(conn.to, conn.from)}
                stroke="#6B1FA8"
                strokeWidth="0.2"
                fill="none"
                opacity="0.5"
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
