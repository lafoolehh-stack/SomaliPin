
import * as React from 'react';

// Using a custom SVG for the Pin to ensure specific branding
export const BrandPin: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zM12 11.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
  </svg>
);

// NOBEL LEVEL: Single Star (Xidig oo kaliya)
export const NobelBadge: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
);

// GOLDEN LEVEL: Intricate Shield
export const GoldenBadge: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M23 12l-2.44-2.79.34-3.69-3.61-.82-1.89-3.2L12 2.96 8.6 1.5 6.71 4.69 3.1 5.5l.34 3.7L1 12l2.44 2.79-.34 3.7 3.61.82L8.6 22.5l3.4-1.47 3.4 1.46 1.89-3.19 3.61-.82-.34-3.69L23 12zm-12.91 4.72l-3.8-3.81 1.48-1.48 2.32 2.33 5.85-5.87 1.48 1.48-7.33 7.35z"/>
  </svg>
);

// SILVER LEVEL: Wavy star burst as per user image
export const SilverBadge: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    viewBox="0 0 1024 1024" 
    fill="currentColor" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M960.543 416.793l-81.564-92.837 11.238-122.97-120.301-27.14-63.136-106.885-113.155 48.775-113.154-48.775-63.136 106.885-120.301 27.14 11.238 122.97-81.564 92.837 81.564 92.837-11.238 122.97 120.301 27.14 63.136 106.885 113.154-48.775 113.155 48.775 63.136-106.885 120.301-27.14-11.238-122.97 81.564-92.837zm-531.42 157.387L302.26 447.318l49.261-49.261 77.602 77.602 195.148-195.148 49.261 49.261-244.409 244.408z"/>
  </svg>
);

// HERO LEVEL: Medal with Ribbon Shape
export const HeroBadge: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 7.5L14.5 13H9.5L12 7.5Z" />
    <path d="M12 2L15 8H9L12 2Z" opacity="0.5"/>
    <path d="M7 2H17V8H7V2Z" opacity="0.3"/>
    <circle cx="12" cy="14" r="5" stroke="currentColor" strokeWidth="2" fill="none"/>
    <circle cx="12" cy="14" r="2" fill="currentColor"/>
  </svg>
);

// STANDARD LEVEL: Simple Check Circle
export const StandardBadge: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
  </svg>
);

export const VerifiedBadge = GoldenBadge; // Default fallback

export const OfficialSeal: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4" />
    <circle cx="12" cy="12" r="9" strokeWidth="0.5" strokeDasharray="2 2" />
  </svg>
);

export const QrCode: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3zM15 15h1v1h-1zM18 15h1v1h-1zM21 15h1v1h-1zM15 18h1v1h-1zM18 18h1v1h-1zM21 18h1v1h-1zM15 21h1v1h-1zM18 21h1v1h-1zM21 21h1v1h-1z" />
  </svg>
);
