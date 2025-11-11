import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './components/ui/dialog';
import { ConnectionArrows } from './components/ConnectionArrows';

type Company = {
  name: string;
  domain?: string;
  description?: string;
};

type CompaniesByCategory = Record<string, Company[]>;
type CardPositionMap = Record<string, { x: number; y: number }>;

type CategoryId =
  | 'Messaging & Media'
  | 'Engagement & Mobilisation'
  | 'Fundraising'
  | 'Research & Insights'
  | 'Data Analytics & Modeling'
  | 'GovTech / Civic Infrastructure'
  | 'Voting Tech'
  | 'Organisational Infrastructure';

export default function TextMap() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Company | null>(null);
  const [data, setData] = useState<CompaniesByCategory | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('Dialog state changed - open:', open, 'selected:', selected);
  }, [open, selected]);
  const [uniformHeight, setUniformHeight] = useState<number | null>(null);
  const [cardPositions, setCardPositions] = useState<CardPositionMap>({});
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let canceled = false;
    async function load() {
      try {
        const res = await fetch('/companies.json', { cache: 'no-store' });
        if (!res.ok) throw new Error(`Failed to load companies.json (${res.status})`);
        const json = await res.json();
        if (!canceled) setData(json as CompaniesByCategory);
      } catch (e: any) {
        if (!canceled) setError(e?.message ?? 'Failed to load data');
      }
    }
    load();
    return () => {
      canceled = true;
    };
  }, []);

  const categories = useMemo(() => {
    const companiesByCategory = (data ?? {}) as CompaniesByCategory;
    return [
      { id: 'messaging', name: 'Messaging & Media', bgColor: '#F3E8FF', items: companiesByCategory['Messaging & Media'] ?? [] },
      { id: 'engagement', name: 'Engagement & Mobilisation', bgColor: '#F5E1FF', items: companiesByCategory['Engagement & Mobilisation'] ?? [] },
      { id: 'fundraising', name: 'Fundraising', bgColor: '#EBD6FF', items: companiesByCategory['Fundraising'] ?? [] },
      { id: 'research', name: 'Research & Insights', bgColor: '#EFE3FF', items: companiesByCategory['Research & Insights'] ?? [] },
      { id: 'analytics', name: 'Data Analytics & Modeling', bgColor: '#EAD6FF', items: companiesByCategory['Data Analytics & Modeling'] ?? [] },
      { id: 'govtech', name: 'GovTech / Civic Infrastructure', bgColor: '#E9D5FF', items: companiesByCategory['GovTech / Civic Infrastructure'] ?? [] },
      { id: 'voting', name: 'Voting Tech', bgColor: '#E7D0FF', items: companiesByCategory['Voting Tech'] ?? [] },
      { id: 'infrastructure', name: 'Organisational Infrastructure', bgColor: '#F6ECFF', items: companiesByCategory['Organisational Infrastructure'] ?? [] },
    ];
  }, [data]);

  useEffect(() => {
    setUniformHeight(null);
    setCardPositions({});
  }, [data]);

  useLayoutEffect(() => {
    if (!data || !rootRef.current) {
      return;
    }

    const measure = () => {
      const rootEl = rootRef.current;
      if (!rootEl) return;
      const rootRect = rootEl.getBoundingClientRect();

      const heights: number[] = [];
      const nextPositions: CardPositionMap = {};

      categories.forEach((category) => {
        const el = cardRefs.current[category.id];
        if (!el) return;
        const rect = el.getBoundingClientRect();
        heights.push(rect.height);
        nextPositions[category.id] = {
          x: rect.left - rootRect.left + rect.width / 2,
          y: rect.top - rootRect.top + rect.height / 2,
        };
      });

      const positiveHeights = heights.filter((height) => height > 0);
      if (positiveHeights.length > 0) {
        const min = Math.min(...positiveHeights);
        setUniformHeight((prev) => (prev !== min ? min : prev));
      }

      setCardPositions((prev) => {
        const prevKeys = Object.keys(prev);
        const nextKeys = Object.keys(nextPositions);
        const sameLength = prevKeys.length === nextKeys.length;
        const unchanged =
          sameLength &&
          nextKeys.every((key) => {
            const nextVal = nextPositions[key];
            const prevVal = prev[key];
            return (
              prevVal &&
              Math.abs(prevVal.x - nextVal.x) < 0.5 &&
              Math.abs(prevVal.y - nextVal.y) < 0.5
            );
          });
        return unchanged ? prev : nextPositions;
      });
    };

    const frame = window.requestAnimationFrame(measure);
    window.addEventListener('resize', measure);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', measure);
    };
  }, [data, categories, uniformHeight]);

  return (
    <div ref={rootRef} className="w-[1920px] h-[1080px] relative" style={{ backgroundColor: '#FAF8FF' }}>
      {!data && !error && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280', fontFamily: 'Inter, sans-serif' }}>
          Loading data...
        </div>
      )}
      {error && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B91C1C', fontFamily: 'Inter, sans-serif' }}>
          {error}
        </div>
      )}
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
          Text Prototype · Nov 2025 · Partisan
        </p>
      </div>

      <ConnectionArrows positions={cardPositions} />

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
          className="grid grid-cols-4"
          style={{
            gap: '48px'
          }}
        >
          {categories.map((category) => (
            <div
              key={category.id}
              ref={(el) => {
                cardRefs.current[category.id] = el;
              }}
              className="relative flex flex-col rounded-[24px]"
              style={{
                backgroundColor: category.bgColor,
                border: '2px solid #E9D5FF',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                padding: '24px',
                gap: '16px',
                height: uniformHeight ? `${uniformHeight}px` : undefined
              }}
            >
              <h2 
                style={{ 
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 600,
                  fontSize: '24px',
                  color: '#7E22CE',
                  lineHeight: '1.2'
                }}
              >
                {category.name}
              </h2>

              <div
                style={{
                  flex: 1,
                  minHeight: 0,
                  overflowY: 'auto',
                  paddingRight: '8px'
                }}
              >
                {category.items.length > 0 ? (
                  <div 
                    className="flex flex-wrap"
                    style={{
                      gap: '12px',
                      justifyContent: 'flex-start',
                      alignItems: 'flex-start'
                    }}
                  >
                    {category.items.map((item) => (
                      <button
                        key={`${category.id}-${item.name}`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('Clicked:', item.name, item);
                          setSelected(item);
                          setOpen(true);
                          console.log('Dialog should open now, open state set to true');
                        }}
                        type="button"
                        className="flex items-center justify-center"
                        style={{
                          padding: '8px 12px',
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px',
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '12px',
                          color: '#4B5563',
                          cursor: 'pointer',
                          position: 'relative',
                          zIndex: 10
                        }}
                        aria-label={`View details for ${item.name}`}
                        title={item.name}
                      >
                        {item.name}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '12px',
                      color: '#9CA3AF'
                    }}
                  >
                    No entries yet.
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

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
        Click any entity to view Domain and Description from the dataset.
      </div>

      {/* Simple custom modal that definitely works */}
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
            
            <div style={{ fontSize: '14px', color: '#374151', lineHeight: '1.6' }}>
              {selected.description || 'No description available.'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


