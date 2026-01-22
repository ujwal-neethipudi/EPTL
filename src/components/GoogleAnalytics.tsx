import { useEffect } from 'react';

const GA_ID = 'G-BDMJW5TNSV';

export default function GoogleAnalytics() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Initialize dataLayer first
    window.dataLayer = window.dataLayer || [];
    
    // Define gtag function
    function gtag(...args: any[]) {
      window.dataLayer.push(args);
    }
    (window as any).gtag = gtag;

    // Load the gtag.js script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    
    // Configure GA4 AFTER the script loads
    script.onload = () => {
      if (window.gtag) {
        window.gtag('js', new Date());
        window.gtag('config', GA_ID, {
          page_path: window.location.pathname,
          debug_mode: true,
        });
      }
    };

    // Handle case where script might already be loaded
    script.onerror = () => {
      console.error('Failed to load Google Analytics script');
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  return null; // This component doesn't render anything
}
