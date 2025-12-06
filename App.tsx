import * as React from 'react';
import { useState, useEffect } from 'react';
import { Search, MapPin, ChevronLeft, Building2, User, BookOpen, Upload, FileText, Image as ImageIcon, Award, PieChart, Newspaper, Globe, Calendar, Clock, Activity, Lock, Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import { BrandPin, VerifiedBadge, HeroBadge, GoldenBadge, StandardBadge, QrCode } from './components/Icons';
import ProfileCard from './components/ProfileCard';
import Timeline from './components/Timeline';
import VerificationCertificate from './components/VerificationCertificate';
import { getProfiles, UI_TEXT } from './constants';
import { Profile, Category, ArchiveItem, NewsItem, VerificationLevel, Language, DossierDB, ProfileStatus } from './types';
import { askArchive } from './services/geminiService';
import { supabase, isSupabaseConfigured } from './services/supabaseClient';

const App = () => {
  const [view, setView] = useState<'home' | 'profile' | 'admin'>('home');
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'archive' | 'news' | 'influence'>('archive');
  const [language, setLanguage] = useState<Language>('so');
  
  // Certificate State
  const [showCertificate, setShowCertificate] = useState(false);
  
  // Dynamic Data State
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Admin State
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<DossierDB>>({});
  const [uploadingImage, setUploadingImage] = useState(false);

  // Logo State
  const [logoError, setLogoError] = useState(false);

  // Fetch Data from Supabase
  const fetchDossiers = async () => {
    setIsLoading(true);

    if (!isSupabaseConfigured) {
      console.log('Supabase is not configured. Loading local mock data.');
      setProfiles(getProfiles(language));
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase.from('dossiers').select('*');
    
    if (error) {
      console.error('Error fetching dossiers:', error.message || error);
      // Fallback to constants if DB fails or is empty for demo purposes
      setProfiles(getProfiles(language)); 
    } else if (data && data.length > 0) {
      // Map DB rows to Frontend Profile Interface
      const mappedProfiles: Profile[] = data.map((d: DossierDB) => ({
        id: d.id,
        name: d.full_name,
        title: d.role,
        category: d.category as Category,
        categoryLabel: UI_TEXT[language][getCategoryKey(d.category as Category)] || d.category,
        verified: d.status === 'Verified',
        verificationLevel: d.verification_level as VerificationLevel,
        imageUrl: d.image_url,
        shortBio: d.bio,
        fullBio: d.details?.fullBio?.[language] || d.details?.fullBio?.en || d.bio,
        timeline: d.details?.timeline?.[language] || d.details?.timeline?.en || [],
        location: d.details?.location,
        archives: d.details?.archives || [],
        news: d.details?.news || [],
        influence: { support: d.reputation_score, neutral: 100 - d.reputation_score, opposition: 0 },
        isOrganization: d.details?.isOrganization || false,
        status: d.details?.status || 'ACTIVE',
        dateStart: d.details?.dateStart || 'Unknown',
        dateEnd: d.details?.dateEnd
      }));
      setProfiles(mappedProfiles);
    } else {
      setProfiles(getProfiles(language));
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchDossiers();
  }, [language]); // Refetch when language changes to re-map localized content

  // Update document direction based on language
  useEffect(() => {
    if (language === 'ar') {
      document.dir = 'rtl';
      document.documentElement.lang = 'ar';
    } else {
      document.dir = 'ltr';
      document.documentElement.lang = language;
    }
  }, [language]);

  const t = UI_TEXT[language];

  const filteredProfiles = profiles.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.categoryLabel && p.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase())) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleProfileClick = (profile: Profile) => {
    setSelectedProfile(profile);
    setAiSummary(null);
    setView('profile');
    setActiveTab('archive'); 
    setShowCertificate(false);
    window.scrollTo(0, 0);
  };

  const handleBack = () => {
    setView('home');
    setSelectedProfile(null);
    setAiSummary(null);
  };

  // --- ADMIN FUNCTIONS ---

  const handleAdminLogin = () => {
    // Simple mock auth for demonstration. In prod, use supabase.auth.signInWithPassword
    if (adminPassword === 'admin123') {
      setIsAdminLoggedIn(true);
      setAdminPassword('');
    } else {
      alert('Invalid password');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    // Fix: Allow local preview if Supabase is not configured (Mock Upload)
    if (!isSupabaseConfigured) {
      const file = e.target.files[0];
      const objectUrl = URL.createObjectURL(file);
      setEditForm({ ...editForm, image_url: objectUrl });
      return;
    }

    setUploadingImage(true);
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('dossier-images')
      .upload(filePath, file);

    if (uploadError) {
      alert('Error uploading image: ' + uploadError.message);
      console.error(uploadError);
    } else {
      const { data } = supabase.storage.from('dossier-images').getPublicUrl(filePath);
      setEditForm({ ...editForm, image_url: data.publicUrl });
    }
    setUploadingImage(false);
  };

  const handleSaveDossier = async () => {
    // Fix: Allow mock save if Supabase is not configured
    if (!isSupabaseConfigured) {
      console.log('Mock Save (Supabase not configured):', editForm);
      alert('Saved locally (Demo Mode: Supabase not connected)');
      setIsEditing(false);
      setEditForm({});
      // Optionally update local state here if needed for demo fluidity
      return;
    }

    if (!editForm.full_name || !editForm.category) {
      alert('Name and Category are required');
      return;
    }

    const dossierData = {
      full_name: editForm.full_name,
      role: editForm.role,
      bio: editForm.bio,
      status: editForm.status || 'Unverified',
      reputation_score: editForm.reputation_score || 0,
      image_url: editForm.image_url,
      category: editForm.category,
      verification_level: editForm.verification_level || 'Standard',
      details: editForm.details || {}
    };

    let error;
    if (editForm.id) {
      // Update
      const res = await supabase.from('dossiers').update(dossierData).eq('id', editForm.id);
      error = res.error;
    } else {
      // Insert
      const res = await supabase.from('dossiers').insert([dossierData]);
      error = res.error;
    }

    if (error) {
      console.error('Error saving:', error);
      alert('Failed to save dossier: ' + error.message);
    } else {
      await fetchDossiers();
      setIsEditing(false);
      setEditForm({});
    }
  };

  const handleDeleteDossier = async (id: string) => {
    // Fix: Allow mock delete if Supabase is not configured
    if (!isSupabaseConfigured) {
      if (window.confirm('Are you sure you want to delete this dossier? (Demo Mode)')) {
          alert('Deleted locally (Demo Mode: Supabase not connected)');
          // For a better demo, we could filter it out of `profiles` state here
      }
      return;
    }

    if (window.confirm('Are you sure you want to delete this dossier?')) {
      const { error } = await supabase.from('dossiers').delete().eq('id', id);
      if (error) {
        alert('Error deleting: ' + error.message);
      } else {
        await fetchDossiers();
      }
    }
  };

  const openEditModal = (profile?: Profile) => {
    if (profile) {
      // Map Profile back to DB structure for editing
      setEditForm({
        id: profile.id,
        full_name: profile.name,
        role: profile.title,
        bio: profile.shortBio,
        status: profile.verified ? 'Verified' : 'Unverified',
        reputation_score: profile.influence?.support,
        image_url: profile.imageUrl,
        category: profile.category,
        verification_level: profile.verificationLevel,
        details: {
          isOrganization: profile.isOrganization,
          status: profile.status,
          dateStart: profile.dateStart,
          fullBio: { en: profile.fullBio } // Simplified for demo
        }
      });
    } else {
      setEditForm({
        status: 'Unverified',
        reputation_score: 50,
        verification_level: 'Standard',
        details: { isOrganization: false, status: 'ACTIVE' }
      });
    }
    setIsEditing(true);
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const hasLocalResults = profiles.some(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!hasLocalResults) {
      setIsAiLoading(true);
      const summary = await askArchive(searchQuery, language);
      setAiSummary(summary);
      setIsAiLoading(false);
    } else {
        setAiSummary(null);
    }
  };

  const handleFileUpload = () => {
      alert("System Integration: Files uploaded here would be encrypted and stored in the secure archive database.");
  };

  const getVerificationIcon = (level?: VerificationLevel) => {
      switch (level) {
          case VerificationLevel.HERO: return <HeroBadge className="h-8 w-8 text-red-700" />;
          case VerificationLevel.GOLDEN: return <GoldenBadge className="h-8 w-8 text-gold" />;
          case VerificationLevel.STANDARD: return <StandardBadge className="h-8 w-8 text-navy-light" />;
          default: return <VerifiedBadge className="h-8 w-8 text-gray-400" />;
      }
  };

  const getVerificationLabel = (level?: VerificationLevel) => {
      switch (level) {
          case VerificationLevel.HERO: return t.lvl_hero;
          case VerificationLevel.GOLDEN: return t.lvl_golden;
          case VerificationLevel.STANDARD: return t.lvl_standard;
          default: return t.lvl_unverified;
      }
  };

  const getCategoryKey = (cat: Category) => {
    if (cat === Category.POLITICS) return 'nav_politics';
    if (cat === Category.BUSINESS) return 'nav_business';
    if (cat === Category.HISTORY) return 'nav_history';
    if (cat === Category.ARTS) return 'nav_arts';
    return 'nav_politics';
  };

  const getCategoryLabel = (cat: Category) => {
      const key = getCategoryKey(cat);
      return t[key as keyof typeof t] || cat;
  };

  const getStatusLabel = (profile: Profile) => {
    switch (profile.status) {
        case 'ACTIVE': return t.status_active;
        case 'DECEASED': return t.status_deceased;
        case 'RETIRED': return t.status_retired;
        case 'CLOSED': return t.status_closed;
        default: return profile.status;
    }
  };

  // --- ADMIN VIEW RENDER ---
  if (view === 'admin') {
    return (
      <div className="min-h-screen bg-slate p-8 font-sans">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-serif font-bold text-navy">Admin Dashboard</h1>
            <button onClick={() => setView('home')} className="text-navy hover:text-gold flex items-center">
              <ChevronLeft className="w-4 h-4 mr-2" /> Back to Site
            </button>
          </div>

          {!isAdminLoggedIn ? (
            <div className="max-w-md mx-auto bg-white p-8 rounded-sm shadow-md">
              <h2 className="text-xl font-bold mb-4">Admin Login</h2>
              <input 
                type="password" 
                placeholder="Enter password (admin123)" 
                className="w-full border p-2 mb-4 rounded-sm"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
              />
              <button 
                onClick={handleAdminLogin}
                className="w-full bg-navy text-white py-2 rounded-sm hover:bg-navy-light"
              >
                Login
              </button>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-sm shadow-sm p-6 mb-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-700">Dossier Management</h2>
                  <div className="flex space-x-4">
                    {!isSupabaseConfigured && (
                       <span className="text-red-600 bg-red-100 px-3 py-1 rounded text-sm flex items-center">
                         ⚠️ DB Not Configured
                       </span>
                    )}
                    <button 
                      onClick={() => openEditModal()}
                      className="bg-green-600 text-white px-4 py-2 rounded-sm flex items-center hover:bg-green-700"
                    >
                      <Plus className="w-4 h-4 mr-2" /> Add New
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-100 text-gray-600 text-sm uppercase">
                        <th className="p-3">Name</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Verification</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profiles.map(p => (
                        <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="p-3 font-medium text-navy">{p.name}</td>
                          <td className="p-3 text-sm text-gray-500">{p.category}</td>
                          <td className="p-3">
                            <span className={`px-2 py-1 text-xs rounded-full ${p.verified ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                              {p.verified ? 'Verified' : 'Unverified'}
                            </span>
                          </td>
                          <td className="p-3 text-sm">{p.verificationLevel}</td>
                          <td className="p-3 text-right space-x-2">
                            <button onClick={() => openEditModal(p)} className="text-blue-600 hover:text-blue-800">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteDossier(p.id)} className="text-red-600 hover:text-red-800">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Edit Modal */}
          {isEditing && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-sm p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-serif font-bold text-navy">
                    {editForm.id ? 'Edit Dossier' : 'New Dossier'}
                  </h2>
                  <button onClick={() => setIsEditing(false)}><X className="w-6 h-6 text-gray-400" /></button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                      <input 
                        type="text" 
                        className="w-full border p-2 rounded-sm"
                        value={editForm.full_name || ''}
                        onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Role/Title</label>
                      <input 
                        type="text" 
                        className="w-full border p-2 rounded-sm"
                        value={editForm.role || ''}
                        onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Category</label>
                      <select 
                        className="w-full border p-2 rounded-sm"
                        value={editForm.category || Category.POLITICS}
                        onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                      >
                        {Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Lifecycle Status</label>
                        <select 
                            className="w-full border p-2 rounded-sm"
                            value={editForm.details?.status || 'ACTIVE'}
                            onChange={(e) => setEditForm({
                                ...editForm, 
                                details: { ...editForm.details, status: e.target.value }
                            })}
                        >
                            <option value="ACTIVE">Active</option>
                            <option value="DECEASED">Deceased</option>
                            <option value="RETIRED">Retired</option>
                            <option value="CLOSED">Closed (Business)</option>
                        </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                     <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Verification Status</label>
                      <select 
                        className="w-full border p-2 rounded-sm"
                        value={editForm.status || 'Unverified'}
                        onChange={(e) => setEditForm({...editForm, status: e.target.value as 'Verified' | 'Unverified'})}
                      >
                        <option value="Unverified">Unverified</option>
                        <option value="Verified">Verified</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Verification Level</label>
                      <select 
                        className="w-full border p-2 rounded-sm"
                        value={editForm.verification_level || 'Standard'}
                        onChange={(e) => setEditForm({...editForm, verification_level: e.target.value})}
                      >
                        <option value="Standard">Standard</option>
                        <option value="Golden">Golden</option>
                        <option value="Hero">Hero</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Reputation Score (0-100)</label>
                      <input 
                        type="number" 
                        className="w-full border p-2 rounded-sm"
                        value={editForm.reputation_score || 0}
                        onChange={(e) => setEditForm({...editForm, reputation_score: parseInt(e.target.value)})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Profile Image</label>
                      <div className="flex items-center space-x-2">
                        {editForm.image_url && (
                          <img src={editForm.image_url} alt="Preview" className="w-10 h-10 object-cover rounded" />
                        )}
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="text-sm"
                        />
                      </div>
                      {uploadingImage && <span className="text-xs text-gold">Uploading...</span>}
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Bio</label>
                  <textarea 
                    className="w-full border p-2 rounded-sm h-24"
                    value={editForm.bio || ''}
                    onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                  />
                </div>

                <div className="mt-8 flex justify-end space-x-4">
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSaveDossier}
                    className="bg-navy text-white px-6 py-2 rounded-sm hover:bg-navy-light flex items-center"
                  >
                    <Save className="w-4 h-4 mr-2" /> Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- MAIN APP RENDER ---
  return (
    <div className={`min-h-screen bg-slate flex flex-col font-sans text-gray-800 ${language === 'ar' ? 'font-arabic' : ''}`}>
      
      {/* Certificate Modal */}
      {showCertificate && selectedProfile && (
        <VerificationCertificate 
          profile={selectedProfile} 
          lang={language} 
          onClose={() => setShowCertificate(false)} 
        />
      )}

      {/* Navigation - Sticky */}
      <nav className="sticky top-0 z-50 bg-navy text-white shadow-lg border-b border-navy-light">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div 
              className="flex items-center space-x-3 rtl:space-x-reverse cursor-pointer group"
              onClick={handleBack}
            >
              {!logoError ? (
                  <img 
                      src="/logo.png" 
                      alt="SomaliPin Logo" 
                      className="h-14 w-auto object-contain"
                      onError={() => setLogoError(true)}
                  />
              ) : (
                  <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      <BrandPin className="h-8 w-8 text-gold group-hover:text-white transition-colors" />
                      <div className="flex flex-col">
                        <span className="text-2xl font-serif font-bold tracking-tight">SomaliPin</span>
                        <span className="text-[10px] text-gray-400 uppercase tracking-widest">{t.subtitle}</span>
                      </div>
                  </div>
              )}
            </div>
            
            <div className="flex items-center space-x-6 rtl:space-x-reverse">
                {/* Desktop Nav Links */}
                <div className="hidden md:flex space-x-8 rtl:space-x-reverse text-sm font-medium text-gray-300">
                    <span className="hover:text-gold cursor-pointer transition-colors">{t.nav_politics}</span>
                    <span className="hover:text-gold cursor-pointer transition-colors">{t.nav_business}</span>
                    <span className="hover:text-gold cursor-pointer transition-colors">{t.nav_history}</span>
                </div>

                {/* Language Switcher */}
                <div className="flex items-center bg-navy-light/50 rounded-full px-1 py-1 border border-navy-light">
                    <button 
                        onClick={() => setLanguage('en')}
                        className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${language === 'en' ? 'bg-gold text-navy shadow-sm' : 'text-gray-400 hover:text-white'}`}
                    >
                        EN
                    </button>
                    <button 
                        onClick={() => setLanguage('so')}
                        className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${language === 'so' ? 'bg-gold text-navy shadow-sm' : 'text-gray-400 hover:text-white'}`}
                    >
                        SO
                    </button>
                    <button 
                        onClick={() => setLanguage('ar')}
                        className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${language === 'ar' ? 'bg-gold text-navy shadow-sm' : 'text-gray-400 hover:text-white'}`}
                    >
                        AR
                    </button>
                </div>

                <div className="hidden md:block">
                     <span className="border border-gold text-gold px-4 py-1.5 rounded-sm hover:bg-gold hover:text-navy transition-all cursor-pointer text-sm font-medium">
                        {t.nav_login}
                     </span>
                </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-grow">
        {view === 'home' ? (
          <>
            {/* Hero Section */}
            <section className="bg-navy pb-16 pt-10 px-4 text-center border-b border-gold/20">
              <div className="max-w-3xl mx-auto space-y-6">
                <h1 className="text-4xl md:text-6xl font-serif font-bold text-white leading-tight">
                  {t.hero_title_1} <br />
                  <span className="text-gold italic">{t.hero_title_2}</span>
                </h1>
                <p className="text-gray-300 text-lg md:text-xl font-light max-w-2xl mx-auto">
                  {t.hero_desc}
                </p>
                
                {/* Search Bar */}
                <form onSubmit={handleSearchSubmit} className="relative max-w-xl mx-auto mt-8">
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 rtl:pl-0 rtl:right-0 rtl:pr-4 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400 group-focus-within:text-navy transition-colors" />
                    </div>
                    <input
                      type="text"
                      className="block w-full pl-11 pr-4 rtl:pl-4 rtl:pr-11 py-4 bg-white border-0 rounded-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-gold focus:outline-none shadow-xl text-lg"
                      placeholder={t.search_placeholder}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button 
                        type="submit"
                        className="absolute right-2 rtl:right-auto rtl:left-2 top-2 bottom-2 bg-navy text-gold px-4 rounded-sm font-medium hover:bg-navy-light transition-colors"
                    >
                        {t.search_btn}
                    </button>
                  </div>
                </form>
              </div>
            </section>

            {/* AI Search Result */}
            {aiSummary && (
                <section className="max-w-6xl mx-auto px-4 -mt-8 mb-12 relative z-10">
                    <div className="bg-white p-8 rounded-sm shadow-xl border-t-4 border-gold">
                        <div className="flex items-center space-x-2 rtl:space-x-reverse mb-4">
                            <BrandPin className="h-6 w-6 text-navy" />
                            <h2 className="text-xl font-serif font-bold text-navy">{t.archive_result}</h2>
                        </div>
                        <div className="prose prose-lg text-gray-600 rtl:text-right">
                             <p className="leading-relaxed">{aiSummary}</p>
                        </div>
                        <div className="mt-4 text-xs text-gray-400 italic text-right rtl:text-left">
                            {t.generated_by}
                        </div>
                    </div>
                </section>
            )}

            {/* Directory Grid */}
            <section className="max-w-6xl mx-auto px-4 py-12 border-b border-gray-200">
               {!aiSummary && searchQuery && filteredProfiles.length === 0 && (
                   <div className="text-center py-12">
                       <p className="text-gray-500 text-lg">{t.no_profiles}</p>
                       <p className="text-sm text-gold mt-2 cursor-pointer hover:underline" onClick={handleSearchSubmit}>{t.click_search}</p>
                   </div>
               )}

              <div className="flex justify-between items-end mb-8 border-b border-gray-200 pb-4">
                <h2 className="text-3xl font-serif font-bold text-navy">{t.featured_dossiers}</h2>
                <div className="hidden md:flex space-x-2 rtl:space-x-reverse">
                   {Object.values(Category).map((cat) => (
                       <button key={cat} className="text-sm px-3 py-1 text-gray-500 hover:text-navy font-medium">
                           {getCategoryLabel(cat)}
                       </button>
                   ))}
                </div>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin h-8 w-8 border-4 border-gold border-t-transparent rounded-full"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredProfiles.map(profile => (
                    <ProfileCard 
                      key={profile.id} 
                      profile={profile} 
                      onClick={handleProfileClick} 
                    />
                  ))}
                </div>
              )}
            </section>

             {/* What We Do Section */}
            <section className="max-w-6xl mx-auto px-4 py-12">
               <h2 className="text-3xl font-serif font-bold text-navy mb-8 text-center">{t.section_what_we_do}</h2>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                   <div className="bg-white p-6 rounded-sm shadow-sm border-t-4 border-gold hover:shadow-lg transition-shadow">
                        <User className="h-8 w-8 text-gold mb-4" />
                        <h3 className="text-xl font-serif font-bold text-navy mb-2">{t.service_1_title}</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">{t.service_1_desc}</p>
                   </div>
                   <div className="bg-white p-6 rounded-sm shadow-sm border-t-4 border-gold hover:shadow-lg transition-shadow">
                        <VerifiedBadge className="h-8 w-8 text-gold mb-4" />
                        <h3 className="text-xl font-serif font-bold text-navy mb-2">{t.service_2_title}</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">{t.service_2_desc}</p>
                   </div>
                   <div className="bg-white p-6 rounded-sm shadow-sm border-t-4 border-gold hover:shadow-lg transition-shadow">
                        <BookOpen className="h-8 w-8 text-gold mb-4" />
                        <h3 className="text-xl font-serif font-bold text-navy mb-2">{t.service_3_title}</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">{t.service_3_desc}</p>
                   </div>
                   <div className="bg-white p-6 rounded-sm shadow-sm border-t-4 border-gold hover:shadow-lg transition-shadow">
                        <Search className="h-8 w-8 text-gold mb-4" />
                        <h3 className="text-xl font-serif font-bold text-navy mb-2">{t.service_4_title}</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">{t.service_4_desc}</p>
                   </div>
               </div>
            </section>
          </>
        ) : view === 'profile' && selectedProfile ? (
          <div className="bg-white min-h-screen pb-12">
            {/* Profile Header */}
            <div className="bg-navy pt-8 pb-16">
              <div className="max-w-6xl mx-auto px-4">
                <button 
                  onClick={handleBack}
                  className="text-gold hover:text-white flex items-center mb-6 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 mr-1" /> {t.back_directory}
                </button>
                
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="relative">
                     <img 
                        src={selectedProfile.imageUrl} 
                        alt={selectedProfile.name} 
                        className={`w-40 h-40 md:w-56 md:h-56 object-cover rounded-sm border-4 shadow-2xl relative z-10
                            ${selectedProfile.verificationLevel === VerificationLevel.HERO ? 'border-red-800' : 'border-gold'}
                        `}
                      />
                      <div className={`absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10 rounded-sm`}></div>
                  </div>
                  
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`px-3 py-1 rounded-sm text-xs font-bold tracking-widest uppercase bg-white/10 text-gold border border-gold/30`}>
                        {selectedProfile.categoryLabel || selectedProfile.category}
                      </span>
                      {selectedProfile.verified && (
                        <div 
                          className="flex items-center space-x-1 cursor-pointer hover:bg-white/10 p-1 rounded transition-colors" 
                          title={getVerificationLabel(selectedProfile.verificationLevel)}
                          onClick={() => setShowCertificate(true)}
                        >
                          {getVerificationIcon(selectedProfile.verificationLevel)}
                          <span className={`text-sm font-bold ${
                             selectedProfile.verificationLevel === VerificationLevel.HERO ? 'text-red-400' : 
                             selectedProfile.verificationLevel === VerificationLevel.STANDARD ? 'text-blue-300' : 'text-gold'
                          }`}>
                            {getVerificationLabel(selectedProfile.verificationLevel)}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <h1 className="text-4xl md:text-5xl font-serif font-bold text-white leading-tight">
                      {selectedProfile.name}
                    </h1>
                    <p className="text-xl text-gray-300 font-light">{selectedProfile.title}</p>
                    
                    <div className="flex items-center text-gray-400 text-sm mt-2">
                      <MapPin className="w-4 h-4 mr-2 text-gold" />
                      {selectedProfile.location}
                    </div>
                  </div>

                  <div className="flex space-x-4 self-start md:self-center">
                      <button className="bg-gold text-navy px-6 py-3 rounded-sm font-bold shadow-lg hover:bg-white transition-colors flex items-center">
                          <Building2 className="w-5 h-5 mr-2" />
                          {t.contact_office}
                      </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Content */}
            <div className="max-w-6xl mx-auto px-4 -mt-8 relative z-20 flex flex-col md:flex-row gap-8">
              
              {/* Sidebar */}
              <div className="md:w-1/3 flex flex-col gap-6">
                <div className="bg-white p-6 rounded-sm shadow-lg border-t-4 border-navy">
                  <h3 className="text-lg font-serif font-bold text-navy mb-6 pb-2 border-b border-gray-100">
                    {t.key_info}
                  </h3>
                  
                  <div className="space-y-6">
                    <div className="flex items-start">
                        <Building2 className="w-5 h-5 text-red-700 mr-4 mt-1" />
                        <div>
                            <span className="block text-xs font-bold text-gray-400 uppercase tracking-widest">{t.label_affiliation}</span>
                            <p className="text-navy font-medium text-lg">{selectedProfile.categoryLabel || selectedProfile.category}</p>
                        </div>
                    </div>
                    <div className="flex items-start">
                        <User className="w-5 h-5 text-red-700 mr-4 mt-1" />
                         <div>
                            <span className="block text-xs font-bold text-gray-400 uppercase tracking-widest">{t.label_role}</span>
                            <p className="text-navy font-medium">{selectedProfile.title}</p>
                        </div>
                    </div>
                    
                    {/* Lifecycle & Status */}
                    <div className="flex items-start">
                       <Activity className={`w-5 h-5 mr-4 mt-1 ${selectedProfile.status === 'ACTIVE' ? 'text-green-600' : 'text-gray-500'}`} />
                       <div>
                           <span className="block text-xs font-bold text-gray-400 uppercase tracking-widest">{t.lbl_status}</span>
                           <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1
                                ${selectedProfile.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 
                                  selectedProfile.status === 'DECEASED' ? 'bg-gray-100 text-gray-800' :
                                  selectedProfile.status === 'CLOSED' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                                }`}>
                                {getStatusLabel(selectedProfile)}
                           </span>
                       </div>
                    </div>

                    <div className="flex items-start">
                        <Calendar className="w-5 h-5 text-red-700 mr-4 mt-1" />
                        <div className="w-full">
                            <div className="flex justify-between mb-2">
                                <div>
                                    <span className="block text-xs font-bold text-gray-400 uppercase tracking-widest">
                                        {selectedProfile.isOrganization ? t.lbl_est : t.lbl_born}
                                    </span>
                                    <p className="text-navy font-medium">{selectedProfile.dateStart}</p>
                                </div>
                                {selectedProfile.dateEnd && (
                                    <div className="text-right">
                                        <span className="block text-xs font-bold text-gray-400 uppercase tracking-widest">
                                             {selectedProfile.isOrganization ? t.lbl_closed : t.lbl_died}
                                        </span>
                                        <p className="text-navy font-medium">{selectedProfile.dateEnd}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-start">
                        <BookOpen className="w-5 h-5 text-red-700 mr-4 mt-1" />
                         <div>
                            <span className="block text-xs font-bold text-gray-400 uppercase tracking-widest">{t.label_id}</span>
                            <p className="text-navy font-mono">SOM-{selectedProfile.id.padStart(4, '0')}</p>
                        </div>
                    </div>
                  </div>
                </div>

                {/* Verification/QR Code - Pushed to Bottom */}
                <div className="mt-auto bg-white p-6 rounded-sm shadow-lg border-t-4 border-navy text-center cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setShowCertificate(true)}>
                    <h4 className="font-serif font-bold text-navy mb-1">{t.verify_title}</h4>
                    <p className="text-xs text-gray-500 mb-3">{t.verify_desc}</p>
                    <QrCode className="w-24 h-24 mx-auto text-navy" />
                </div>
              </div>

              {/* Main Info */}
              <div className="md:w-2/3 space-y-8">
                
                {/* About Section */}
                <div className="bg-white p-8 rounded-sm shadow-sm">
                    <h2 className="text-2xl font-serif font-bold text-navy mb-4 border-l-4 border-gold pl-4">
                        {t.about}
                    </h2>
                    <div className="prose prose-lg text-gray-600">
                        <p className="leading-relaxed">{selectedProfile.fullBio}</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-sm shadow-sm border-b border-gray-200">
                    <div className="flex">
                        <button 
                            onClick={() => setActiveTab('archive')}
                            className={`flex-1 py-4 text-sm font-bold tracking-widest uppercase border-b-2 transition-colors
                                ${activeTab === 'archive' ? 'border-gold text-navy' : 'border-transparent text-gray-400 hover:text-navy'}
                            `}
                        >
                            {t.tab_archive}
                        </button>
                         <button 
                            onClick={() => setActiveTab('news')}
                            className={`flex-1 py-4 text-sm font-bold tracking-widest uppercase border-b-2 transition-colors
                                ${activeTab === 'news' ? 'border-gold text-navy' : 'border-transparent text-gray-400 hover:text-navy'}
                            `}
                        >
                            {t.tab_news}
                        </button>
                         <button 
                            onClick={() => setActiveTab('influence')}
                            className={`flex-1 py-4 text-sm font-bold tracking-widest uppercase border-b-2 transition-colors
                                ${activeTab === 'influence' ? 'border-gold text-navy' : 'border-transparent text-gray-400 hover:text-navy'}
                            `}
                        >
                            {t.tab_influence}
                        </button>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="bg-white p-8 rounded-sm shadow-sm min-h-[500px]">
                    {activeTab === 'archive' && (
                        <div className="animate-fade-in">
                            <h2 className="text-2xl font-serif font-bold text-navy mb-8 border-l-4 border-gold pl-4">
                                {t.timeline}
                            </h2>
                            <Timeline events={selectedProfile.timeline} />

                            <h3 className="text-xl font-serif font-bold text-navy mb-6 mt-12 flex items-center">
                                <FileText className="w-5 h-5 mr-2 text-gold" />
                                {t.upload_doc}
                            </h3>

                            {selectedProfile.archives && selectedProfile.archives.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {selectedProfile.archives.map((doc) => (
                                <div key={doc.id} className="flex items-center p-4 border border-gray-200 rounded-sm hover:border-gold transition-colors cursor-pointer group">
                                    {doc.type === 'PDF' ? <FileText className="w-8 h-8 text-red-500 mr-4" /> :
                                    doc.type === 'IMAGE' ? <ImageIcon className="w-8 h-8 text-blue-500 mr-4" /> :
                                    <Award className="w-8 h-8 text-gold mr-4" />}
                                    <div>
                                    <h4 className="font-bold text-navy text-sm group-hover:text-gold transition-colors">{doc.title}</h4>
                                    <p className="text-xs text-gray-400">{doc.date} • {doc.size}</p>
                                    </div>
                                </div>
                                ))}
                            </div>
                            ) : (
                            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-sm">
                                <p className="text-gray-400 text-sm">{t.no_docs}</p>
                            </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'news' && (
                        <div className="animate-fade-in">
                        <h2 className="text-2xl font-serif font-bold text-navy mb-8 border-l-4 border-gold pl-4">
                            {t.related_reports}
                        </h2>
                        {selectedProfile.news && selectedProfile.news.length > 0 ? (
                            <div className="space-y-6">
                                {selectedProfile.news.map((item) => (
                                <div key={item.id} className="border-b border-gray-100 pb-6 last:border-0">
                                    <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-lg font-bold text-navy hover:text-gold cursor-pointer">{item.title}</h3>
                                    <span className="text-xs text-gray-400 whitespace-nowrap ml-4">{item.date}</span>
                                    </div>
                                    <p className="text-sm text-gold font-medium mb-2 uppercase tracking-wide">{item.source}</p>
                                    <p className="text-gray-600 leading-relaxed">{item.summary}</p>
                                </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-gray-50 rounded-sm">
                                <Newspaper className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">{t.no_news}</p>
                            </div>
                        )}
                        </div>
                    )}

                    {activeTab === 'influence' && (
                        <div className="animate-fade-in">
                            <h2 className="text-2xl font-serif font-bold text-navy mb-8 border-l-4 border-gold pl-4">
                            {t.sentiment_title}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <div className="bg-green-50 p-6 rounded-sm text-center border border-green-100">
                                    <span className="block text-3xl font-bold text-green-700 mb-2">{selectedProfile.influence?.support}%</span>
                                    <span className="text-sm text-green-800 font-medium uppercase tracking-widest">{t.sentiment_support}</span>
                                </div>
                                <div className="bg-gray-50 p-6 rounded-sm text-center border border-gray-200">
                                    <span className="block text-3xl font-bold text-gray-600 mb-2">{selectedProfile.influence?.neutral}%</span>
                                    <span className="text-sm text-gray-500 font-medium uppercase tracking-widest">{t.sentiment_neutral}</span>
                                </div>
                                <div className="bg-red-50 p-6 rounded-sm text-center border border-red-100">
                                    <span className="block text-3xl font-bold text-red-700 mb-2">{selectedProfile.influence?.opposition}%</span>
                                    <span className="text-sm text-red-800 font-medium uppercase tracking-widest">{t.sentiment_oppose}</span>
                                </div>
                            </div>
                            <p className="text-gray-600 italic border-t border-gray-100 pt-6">
                                "{t.sentiment_desc}"
                            </p>
                        </div>
                    )}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </main>

      {/* Footer */}
      <footer className="bg-navy text-white pt-16 pb-8 border-t-4 border-gold">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 rtl:space-x-reverse mb-6">
                <BrandPin className="h-10 w-10 text-gold" />
                <div className="flex flex-col">
                  <span className="text-2xl font-serif font-bold tracking-tight">SomaliPin</span>
                  <span className="text-xs text-gray-400 uppercase tracking-widest">{t.subtitle}</span>
                </div>
              </div>
              <p className="text-gray-400 leading-relaxed max-w-sm">
                {t.footer_desc}
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-gold uppercase tracking-widest mb-6 text-sm">{t.footer_platform}</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li className="hover:text-white cursor-pointer transition-colors">{t.footer_directory}</li>
                <li className="hover:text-white cursor-pointer transition-colors">{t.footer_verify}</li>
                <li className="hover:text-white cursor-pointer transition-colors">{t.footer_membership}</li>
                <li 
                   className="hover:text-white cursor-pointer transition-colors"
                   onClick={() => setView('admin')}
                >
                   Admin Login
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-gold uppercase tracking-widest mb-6 text-sm">{t.footer_legal}</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li className="hover:text-white cursor-pointer transition-colors">{t.footer_privacy}</li>
                <li className="hover:text-white cursor-pointer transition-colors">{t.footer_terms}</li>
                <li className="hover:text-white cursor-pointer transition-colors">{t.footer_act}</li>
                <li className="hover:text-white cursor-pointer transition-colors">{t.footer_contact}</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
            <p>&copy; {new Date().getFullYear()} {t.rights}</p>
            <div className="flex items-center mt-4 md:mt-0 space-x-2 rtl:space-x-reverse">
              <span>{t.design_integrity}</span>
              <Award className="w-4 h-4 text-gold" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;