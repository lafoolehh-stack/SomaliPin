import * as React from 'react';
import { Share2, Check, Copy } from 'lucide-react';
import { Profile, VerificationLevel } from '../types';
import { GoldenBadge, HeroBadge, StandardBadge } from './Icons';

interface ProfileCardProps {
  profile: Profile;
  onClick: (profile: Profile) => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ profile, onClick }) => {
  const [isCopied, setIsCopied] = React.useState(false);
  
  const renderBadge = () => {
    if (!profile.verified) return null;

    switch (profile.verificationLevel) {
      case VerificationLevel.HERO:
        return (
          <div className="text-red-700" title="National Hero">
            <HeroBadge className="w-6 h-6" />
          </div>
        );
      case VerificationLevel.GOLDEN:
        return (
          <div className="text-gold" title="Golden Verified">
            <GoldenBadge className="w-6 h-6" />
          </div>
        );
      case VerificationLevel.STANDARD:
      default:
        return (
          <div className="text-navy-light" title="Verified Entity">
            <StandardBadge className="w-6 h-6" />
          </div>
        );
    }
  };

  const getStatusColor = () => {
      switch (profile.status) {
          case 'ACTIVE': return 'bg-green-500';
          case 'DECEASED': return 'bg-gray-800';
          case 'RETIRED': return 'bg-orange-500';
          case 'CLOSED': return 'bg-red-600';
          default: return 'bg-gray-400';
      }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Construct a shareable URL (assuming query param support would be handled in App entry)
    const shareUrl = `${window.location.origin}?profile=${profile.id}`;
    const shareData = {
      title: `SomaliPin: ${profile.name}`,
      text: `View the official dossier for ${profile.name} on SomaliPin.`,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.debug('Share canceled or failed', err);
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        console.error('Clipboard write failed', err);
      }
    }
  };

  return (
    <div 
      onClick={() => onClick(profile)}
      className={`group relative bg-white border-t-4 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden rounded-sm flex flex-col justify-between h-full
        ${profile.verificationLevel === VerificationLevel.HERO ? 'border-red-800' : 
          profile.verificationLevel === VerificationLevel.STANDARD ? 'border-navy-light' : 'border-gold'}
      `}
    >
      <div className="p-6 pb-2">
        <div className="flex justify-between items-start mb-4">
          <div className="relative">
            <img 
              src={profile.imageUrl} 
              alt={profile.name} 
              className={`w-20 h-20 object-cover rounded-sm border grayscale group-hover:grayscale-0 transition-all duration-500
                ${profile.verificationLevel === VerificationLevel.HERO ? 'border-red-100' : 'border-gray-100'}
              `}
            />
            {/* Small status indicator dot */}
            <div className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white ${getStatusColor()}`} title={profile.status}></div>
          </div>
          {renderBadge()}
        </div>
        
        <div className="space-y-1">
          <span className={`text-xs font-bold tracking-widest uppercase
             ${profile.verificationLevel === VerificationLevel.HERO ? 'text-red-700' : 
               profile.verificationLevel === VerificationLevel.STANDARD ? 'text-navy-light' : 'text-gold'}
          `}>
            {profile.categoryLabel || profile.category}
          </span>
          <h3 className="text-xl font-serif font-bold text-navy leading-tight group-hover:text-gold-dark transition-colors">
            {profile.name}
          </h3>
          <p className="text-xs text-gray-400 font-sans uppercase tracking-wide">
            {profile.title}
          </p>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
            {profile.shortBio}
          </p>
        </div>
      </div>

      <div className="p-6 pt-2 mt-auto">
        <div className="flex justify-between items-center">
          <div className="flex items-center text-navy font-medium text-sm group-hover:translate-x-1 transition-transform rtl:group-hover:-translate-x-1">
            <span className="rtl:hidden">View Dossier <span className="ml-2">→</span></span>
            <span className="hidden rtl:inline">عرض الملف <span className="mr-2">←</span></span>
          </div>

          <button
            onClick={handleShare}
            className="p-2 text-gray-400 hover:text-gold hover:bg-navy/5 rounded-full transition-all relative z-10"
            title="Share Dossier"
          >
            {isCopied ? (
              <Check className="w-4 h-4 text-green-600" />
            ) : (
              <Share2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;