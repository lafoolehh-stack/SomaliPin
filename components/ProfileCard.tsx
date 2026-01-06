
import * as React from 'react';
import { Share2, Check, ShieldCheck } from 'lucide-react';
import { Profile, VerificationLevel } from '../types';
import { GoldenBadge, HeroBadge, StandardBadge, NobelBadge, SilverBadge } from './Icons';

interface ProfileCardProps {
  profile: Profile;
  onClick: (profile: Profile) => void;
  onVerify?: (e: React.MouseEvent) => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ profile, onClick, onVerify }) => {
  const [isCopied, setIsCopied] = React.useState(false);
  
  const renderBadge = () => {
    if (!profile.verified) return null;

    switch (profile.verificationLevel) {
      case VerificationLevel.NOBEL:
        return (
          <div className="text-purple-700" title="Nobel Verified">
            <NobelBadge className="w-6 h-6" />
          </div>
        );
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
      case VerificationLevel.SILVER:
        return (
          <div className="text-[#8E9AAF]" title="Silver Verified">
            <SilverBadge className="w-6 h-6" />
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
        console.debug('Share canceled', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        console.error('Clipboard failed', err);
      }
    }
  };

  return (
    <div 
      onClick={() => onClick(profile)}
      className={`group relative bg-white dark:bg-navy border-t-4 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden rounded-sm flex flex-col justify-between h-full
        ${profile.verificationLevel === VerificationLevel.NOBEL ? 'border-purple-600' :
          profile.verificationLevel === VerificationLevel.HERO ? 'border-red-800' : 
          profile.verificationLevel === VerificationLevel.SILVER ? 'border-[#8E9AAF]' :
          profile.verificationLevel === VerificationLevel.STANDARD ? 'border-navy-light' : 'border-gold'}
      `}
    >
      <div className="p-6 pb-2">
        <div className="flex justify-between items-start mb-4">
          <div className="relative">
            <img 
              src={profile.imageUrl || 'https://via.placeholder.com/150'} 
              alt={profile.name} 
              className={`w-20 h-20 object-cover rounded-sm border grayscale group-hover:grayscale-0 transition-all duration-500
                ${profile.verificationLevel === VerificationLevel.NOBEL ? 'border-purple-200' : 
                  profile.verificationLevel === VerificationLevel.HERO ? 'border-red-100' : 
                  profile.verificationLevel === VerificationLevel.SILVER ? 'border-slate-200' : 'border-gray-100 dark:border-gray-700'}
              `}
            />
            <div className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white dark:border-navy ${getStatusColor()}`} title={profile.status}></div>
          </div>
          {renderBadge()}
        </div>
        
        <div className="space-y-1">
          <span className={`text-xs font-bold tracking-widest uppercase
             ${profile.verificationLevel === VerificationLevel.NOBEL ? 'text-purple-700' :
               profile.verificationLevel === VerificationLevel.HERO ? 'text-red-700' : 
               profile.verificationLevel === VerificationLevel.SILVER ? 'text-slate-600' :
               profile.verificationLevel === VerificationLevel.STANDARD ? 'text-navy-light dark:text-blue-300' : 'text-gold'}
          `}>
            {profile.categoryLabel || profile.category}
          </span>
          <h3 className="text-xl font-serif font-bold text-navy dark:text-white leading-tight group-hover:text-gold-dark transition-colors">
            {profile.name}
          </h3>
          <p className="text-xs text-gray-400 font-sans uppercase tracking-wide">
            {profile.title}
          </p>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 leading-relaxed">
            {profile.shortBio}
          </p>
        </div>
      </div>

      <div className="p-6 pt-2 mt-auto">
        <div className="flex justify-between items-center">
          <div className="flex items-center text-navy dark:text-gold font-medium text-sm group-hover:translate-x-1 transition-transform rtl:group-hover:-translate-x-1">
            <span className="rtl:hidden">View Dossier <span className="ml-2">→</span></span>
            <span className="hidden rtl:inline">عرض الملف <span className="mr-2">←</span></span>
          </div>

          <div className="flex items-center space-x-2 relative z-10">
            {profile.verified && onVerify && (
              <button
                onClick={onVerify}
                className="flex items-center space-x-1 text-[10px] font-bold text-navy dark:text-white hover:text-gold border border-navy/10 hover:border-gold px-2 py-1.5 rounded-sm transition-all bg-slate dark:bg-navy-light hover:bg-white dark:hover:bg-navy uppercase tracking-wider"
                title="Verify Authenticity"
              >
                <ShieldCheck className="w-3 h-3" />
                <span>Verify</span>
              </button>
            )}

            <button
              onClick={handleShare}
              className="p-2 text-gray-400 hover:text-gold hover:bg-navy/5 dark:hover:bg-navy-light rounded-full transition-all"
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
    </div>
  );
};

export default ProfileCard;
