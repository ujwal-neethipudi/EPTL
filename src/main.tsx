
  import React from "react";
  import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
  import TextMap from "./TextMap.tsx";
  import "./index.css";

  type ViewMode = 'logos' | 'text';

  function RootApp() {
    const getModeFromHash = (): ViewMode =>
      window.location.hash === '#text' ? 'text' : 'logos';

    const [mode, setMode] = React.useState<ViewMode>(getModeFromHash);

    React.useEffect(() => {
      const handleHashChange = () => setMode(getModeFromHash());
      window.addEventListener('hashchange', handleHashChange);
      return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    const switchMode = (next: ViewMode) => {
      if (next === 'text') {
        window.location.hash = '#text';
      } else {
        window.history.pushState('', document.title, window.location.pathname + window.location.search);
      }
      setMode(next);
    };

    return (
      <>
        {mode === 'text' ? <TextMap /> : <App />}
        <div
          style={{
            position: 'fixed',
            top: '32px',
            right: '32px',
            display: 'flex',
            gap: '8px',
            zIndex: 1000,
          }}
        >
          <button
            type="button"
            onClick={() => switchMode('logos')}
            style={{
              padding: '8px 16px',
              borderRadius: '9999px',
              border: '1px solid #E5E7EB',
              backgroundColor: mode === 'logos' ? '#7E22CE' : '#FFFFFF',
              color: mode === 'logos' ? '#FFFFFF' : '#7E22CE',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: mode === 'logos' ? '0 2px 8px rgba(126, 34, 206, 0.25)' : '0 1px 3px rgba(15, 23, 42, 0.08)',
              transition: 'all 0.15s ease'
            }}
          >
            Logos View
          </button>
          <button
            type="button"
            onClick={() => switchMode('text')}
            style={{
              padding: '8px 16px',
              borderRadius: '9999px',
              border: '1px solid #E5E7EB',
              backgroundColor: mode === 'text' ? '#7E22CE' : '#FFFFFF',
              color: mode === 'text' ? '#FFFFFF' : '#7E22CE',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: mode === 'text' ? '0 2px 8px rgba(126, 34, 206, 0.25)' : '0 1px 3px rgba(15, 23, 42, 0.08)',
              transition: 'all 0.15s ease'
            }}
          >
            Text View
          </button>
        </div>
      </>
    );
  }

  createRoot(document.getElementById("root")!).render(<RootApp />);
  