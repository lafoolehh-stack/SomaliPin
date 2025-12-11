import * as React from 'react';
import { Profile, VerificationLevel, Language } from '../types';
import { BrandPin, OfficialSeal, QrCode } from './Icons';
import { X } from 'lucide-react';

interface Props {
  profile: Profile;
  lang: Language;
  onClose: () => void;
}

const VerificationCertificate: React.FC<Props> = ({ profile, lang, onClose }) => {
  // Styles based on level
  const getTheme = () => {
    switch (profile.verificationLevel) {
      case VerificationLevel.NOBEL:
        return {
          border: 'border-purple-600',
          text: 'text-purple-700',
          bg: 'bg-purple-50',
          sealColor: 'text-purple-600',
          title: 'Nobel Verification'
        };
      case VerificationLevel.HERO:
        return {
          border: 'border-red-800',
          text: 'text-red-900',
          bg: 'bg-red-50',
          sealColor: 'text-red-800',
          title: 'National Hero Registry'
        };
      case VerificationLevel.GOLDEN:
        return {
          border: 'border-gold',
          text: 'text-navy',
          bg: 'bg-yellow-50/50',
          sealColor: 'text-gold',
          title: 'Gold Tier Verification'
        };
      case VerificationLevel.STANDARD:
      default:
        return {
          border: 'border-navy-light',
          text: 'text-navy',
          bg: 'bg-white',
          sealColor: 'text-navy',
          title: 'Standard Verification'
        };
    }
  };

  const theme = getTheme();
  
  // Prevent scrolling and copy shortcuts
  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    
    // Disable common save shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'p' || e.key === 'S' || e.key === 'P')) {
            e.preventDefault();
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => { 
        document.body.style.overflow = 'unset'; 
        window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy/90 backdrop-blur-md animate-fade-in print:hidden"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* CSS to enforce print hiding */}
      <style>{`@media print { body { display: none !important; } }`}</style>
      
      <div 
        className="relative w-full max-w-sm aspect-[9/16] max-h-[90vh] bg-white rounded-lg shadow-2xl overflow-hidden transform transition-all scale-100 flex flex-col select-none"
        style={{ 
            WebkitUserSelect: 'none', 
            MozUserSelect: 'none', 
            msUserSelect: 'none', 
            userSelect: 'none',
            WebkitTouchCallout: 'none' 
        }}
      >
        
        {/* Security Layer: Invisible overlay to capture right-clicks and drags */}
        <div className="absolute inset-0 z-50 bg-transparent cursor-default" onContextMenu={(e) => e.preventDefault()} />

        {/* Close Button - Lifted above security layer */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-[60] p-2 bg-gray-100/80 hover:bg-gray-200 rounded-full transition-colors backdrop-blur-sm"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        <div className={`flex-1 m-3 border-4 border-double ${theme.border} p-6 flex flex-col justify-between relative overflow-hidden ${theme.bg}`}>
          {/* Watermark */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none">
            <BrandPin className="w-96 h-96" />
          </div>

          {/* Header */}
          <div className="text-center relative z-10 mt-4">
            <div className="flex justify-center mb-4">
              <BrandPin className={`w-12 h-12 ${theme.sealColor}`} />
            </div>
            <h1 className="font-serif text-2xl font-bold text-navy uppercase tracking-widest mb-2">
              Certificate of Authenticity
            </h1>
            <div className="flex items-center justify-center space-x-4">
              <div className={`h-px w-8 ${theme.border}`}></div>
              <span className={`font-sans text-[10px] font-bold uppercase tracking-wider ${theme.text}`}>
                {theme.title}
              </span>
              <div className={`h-px w-8 ${theme.border}`}></div>
            </div>
          </div>

          {/* Body */}
          <div className="text-center space-y-4 relative z-10">
            <p className="font-serif text-base text-gray-600 italic">
              This digital record certifies that the identity and historical profile of
            </p>
            
            <h2 className={`font-serif text-3xl font-bold ${theme.text} py-2 border-b border-gray-200 inline-block px-4 leading-tight`}>
              {profile.name}
            </h2>

            <p className="font-serif text-base text-gray-600 italic">
              has been officially verified and archived within the SomaliPin Registry.
            </p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-6 relative z-10 border-t border-b border-gray-100 py-6">
            <div className="text-left">
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Registry ID</span>
              <span className="font-mono text-sm text-navy font-bold break-all">{`SOM-${profile.id.padStart(4, '0')}`}</span>
            </div>
            <div className="text-right">
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Category</span>
              <span className="font-serif text-base text-navy leading-tight">{profile.categoryLabel || profile.category}</span>
            </div>
            <div className="text-left">
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Status</span>
              <span className="font-sans text-xs font-bold bg-gray-100 px-2 py-1 rounded text-gray-700">
                {profile.status}
              </span>
            </div>
            <div className="text-right">
               <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Verified On</span>
               <span className="font-sans text-xs text-gray-700">{new Date().toLocaleDateString()}</span>
            </div>
          </div>

          {/* Footer / Seal */}
          <div className="flex justify-between items-end relative z-10 mb-2">
            <div className="flex flex-col items-center">
               <QrCode className="w-16 h-16 text-navy mb-2" />
               <span className="text-[8px] text-gray-400 uppercase tracking-widest">Scan to Verify</span>
            </div>

            <div className="text-right">
              <div className="relative inline-block">
                <OfficialSeal className={`w-20 h-20 ${theme.sealColor} opacity-90`} />
                <div className="absolute inset-0 flex items-center justify-center transform -rotate-12">
                   <span className={`text-[8px] font-bold border ${theme.border} px-1 py-0.5 rounded text-navy bg-white/80`}>
                     VERIFIED
                   </span>
                </div>
              </div>
              <div className="mt-2 border-t border-gray-400 w-32 ml-auto"></div>
              <p className="text-[10px] text-gray-500 font-serif italic mt-1">Official Digital Registrar</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationCertificate;