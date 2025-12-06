
import * as React from 'react';
import { useState, useEffect } from 'react';
import { Search, MapPin, ChevronLeft, Building2, User, BookOpen, Upload, FileText, Image as ImageIcon, Award, PieChart, Newspaper, Globe, Calendar, Clock, Activity, Lock, Plus, Trash2, Edit2, Save, X, Database, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { BrandPin, VerifiedBadge, HeroBadge, GoldenBadge, StandardBadge } from './components/Icons';
import ProfileCard from './components/ProfileCard';
import Timeline from './components/Timeline';
import VerificationCertificate from './components/VerificationCertificate';
import { getProfiles, UI_TEXT } from './constants';
import { Profile, Category, ArchiveItem, NewsItem, VerificationLevel, Language, DossierDB, ProfileStatus, TimelineEvent } from './types';
import { askArchive } from './services/geminiService';
import { supabase, isSupabaseConfigured } from './services/supabaseClient';

const App = () => {
  const [view, setView] = useState<'home' | 'profile' | 'admin'>('home');
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'archive' | 'news' | 'influence'>('archive');
  const [language, setLanguage] = useState<Language>('en');
  
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
  const [activeAdminTab, setActiveAdminTab] = useState<'basic' | 'timeline' | 'archive' | 'news'>('basic');
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null); // Track which doc ID is uploading

  const t = UI_TEXT[language];

  // Helper to map DB categories to UI text
  const getCategoryKey = (cat: string) => {
    if (cat === Category.POLITICS) return 'nav_politics';
    if (cat === Category.BUSINESS) return 'nav_business';
    if (cat === Category.HISTORY) return 'nav_history';
    if (cat === Category.ARTS) return 'nav_arts';
    return null; 
  };

  const getCategoryLabel = (cat: string) => {
      const key = getCategoryKey(cat);
      if (key) {
        return t[key as keyof typeof t] || cat;
      }
      return cat;
  };

  // Fetch Data from Supabase
  const fetchDossiers = async () => {
    try {
      setIsLoading(true);

      if (!isSupabaseConfigured) {
        console.warn('Supabase is not configured properly.');
        setProfiles([]);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.from('dossiers').select('*');
      
      if (error) {
        console.error('Supabase Error fetching dossiers:', error);
        setProfiles([]); 
      } else if (data) {
        // Safe mapping with defensive checks
        const mappedProfiles: Profile[] = data.map((d: DossierDB) => {
          const details = d.details || {};
          
          const localizedFullBio = details.fullBio?.[language] || details.fullBio?.en || d.bio || '';
          
          // Fallback logic for dynamic arrays: check localized first, then root details, then empty
          const timeline = details.timeline || [];
          const archives = details.archives || [];
          const news = details.news || [];
          
          const rawCategory = d.category || Category.POLITICS;

          return {
            id: d.id || 'unknown',
            name: d.full_name || 'Unnamed Profile',
            title: d.role || '',
            category: rawCategory,
            categoryLabel: getCategoryLabel(rawCategory),
            verified: d.status === 'Verified',
            verificationLevel: (d.verification_level as VerificationLevel) || VerificationLevel.STANDARD,
            imageUrl: d.image_url || 'https://via.placeholder.com/150',
            shortBio: d.bio || '',
            fullBio: localizedFullBio,
            timeline: timeline,
            location: details.location || '',
            archives: archives,
            news: news,
            influence: { support: d.reputation_score || 0, neutral: 100 - (d.reputation_score || 0), opposition: 0 },
            isOrganization: details.isOrganization || false,
            status: details.status || 'ACTIVE',
            dateStart: details.dateStart || 'Unknown',
            dateEnd: details.dateEnd
          };
        });
        setProfiles(mappedProfiles);
      }
    } catch (err) {
      console.error('Unexpected crash in fetchDossiers:', err);
      setProfiles([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDossiers();
  }, [language]);

  useEffect(() => {
    if (language === 'ar') {
      document.dir = 'rtl';
      document.documentElement.lang = 'ar';
    } else {
      document.dir = 'ltr';
      document.documentElement.lang = language;
    }
  }, [language]);

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
  
  const handleVerifyClick = (e: React.MouseEvent, profile: Profile) => {
    e.stopPropagation();
    setSelectedProfile(profile);
    setShowCertificate(true);
  };

  // --- ADMIN FUNCTIONS ---

  const handleAdminLogin = () => {
    if (adminPassword === 'admin123') {
      setIsAdminLoggedIn(true);
      setAdminPassword('');
    } else {
      alert('Invalid password');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) return;
      
      setUploadingImage(true);
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `profile_${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('dossier-images')
        .upload(filePath, file);

      if (uploadError) {
        alert('Error uploading image: ' + uploadError.message);
      } else {
        const { data } = supabase.storage.from('dossier-images').getPublicUrl(filePath);
        setEditForm({ ...editForm, image_url: data.publicUrl });
      }
    } catch (err) {
      console.error('Image upload crash:', err);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleArchiveUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
      if (!e.target.files || e.target.files.length === 0) return;
      
      const file = e.target.files[0];
      const archives = [...(editForm.details?.archives || [])];
      const currentItem = archives[index];
      setUploadingDoc(currentItem.id || 'new');

      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `doc_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error } = await supabase.storage.from('dossier-images').upload(fileName, file);
        
        if (error) throw error;

        const { data } = supabase.storage.from('dossier-images').getPublicUrl(fileName);
        
        // Update the specific archive item url
        archives[index] = { ...currentItem, url: data.publicUrl, size: '2MB' }; // Mock size for now
        setEditForm({ ...editForm, details: { ...editForm.details, archives }});
      } catch (err: any) {
          alert('Upload failed: ' + err.message);
      } finally {
          setUploadingDoc(null);
      }
  };

  // --- Dynamic Array Handlers ---

  const addTimelineEvent = () => {
      const current = editForm.details?.timeline || [];
      const newItem: TimelineEvent = { year: '', title: '', description: '' };
      setEditForm({ ...editForm, details: { ...editForm.details, timeline: [...current, newItem] } });
  };

  const removeTimelineEvent = (idx: number) => {
      const current = [...(editForm.details?.timeline || [])];
      current.splice(idx, 1);
      setEditForm({ ...editForm, details: { ...editForm.details, timeline: current } });
  };

  const updateTimelineEvent = (idx: number, field: keyof TimelineEvent, value: string) => {
      const current = [...(editForm.details?.timeline || [])];
      current[idx] = { ...current[idx], [field]: value };
      setEditForm({ ...editForm, details: { ...editForm.details, timeline: current } });
  };

  const addArchiveItem = () => {
      const current = editForm.details?.archives || [];
      const newItem: ArchiveItem = { id: Date.now().toString(), type: 'PDF', title: '', date: '', url: '' };
      setEditForm({ ...editForm, details: { ...editForm.details, archives: [...current, newItem] } });
  };

  const removeArchiveItem = (idx: number) => {
      const current = [...(editForm.details?.archives || [])];
      current.splice(idx, 1);
      setEditForm({ ...editForm, details: { ...editForm.details, archives: current } });
  };

  const updateArchiveItem = (idx: number, field: keyof ArchiveItem, value: string) => {
      const current = [...(editForm.details?.archives || [])];
      current[idx] = { ...current[idx], [field]: value };
      setEditForm({ ...editForm, details: { ...editForm.details, archives: current } });
  };

  const addNewsItem = () => {
      const current = editForm.details?.news || [];
      const newItem: NewsItem = { id: Date.now().toString(), title: '', source: '', date: '', summary: '', url: '' };
      setEditForm({ ...editForm, details: { ...editForm.details, news: [...current, newItem] } });
  };

  const removeNewsItem = (idx: number) => {
      const current = [...(editForm.details?.news || [])];
      current.splice(idx, 1);
      setEditForm({ ...editForm, details: { ...editForm.details, news: current } });
  };

  const updateNewsItem = (idx: number, field: keyof NewsItem, value: string) => {
      const current = [...(editForm.details?.news || [])];
      current[idx] = { ...current[idx], [field]: value };
      setEditForm({ ...editForm, details: { ...editForm.details, news: current } });
  };

  const handleSaveDossier = async () => {
    try {
      if (!editForm.full_name || !editForm.category) {
        alert('Name and Category are required');
        return;
      }

      const currentFullBio = editForm.details?.fullBio || {};
      if (editForm.details?.tempFullBio) {
          currentFullBio['en'] = editForm.details.tempFullBio;
          // Simple fallback for other languages to ensure data exists
          if (!currentFullBio['so']) currentFullBio['so'] = editForm.details.tempFullBio;
          if (!currentFullBio['ar']) currentFullBio['ar'] = editForm.details.tempFullBio;
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
        details: {
          ...editForm.details,
          fullBio: currentFullBio
        }
      };

      if (dossierData.details.tempFullBio) delete dossierData.details.tempFullBio;

      let error;
      if (editForm.id) {
        const res = await supabase.from('dossiers').update(dossierData).eq('id', editForm.id);
        error = res.error;
      } else {
        const res = await supabase.from('dossiers').insert([dossierData]);
        error = res.error;
      }

      if (error) {
        alert('Failed to save dossier: ' + error.message);
      } else {
        await fetchDossiers();
        setIsEditing(false);
        setEditForm({});
      }
    } catch (err) {
      console.error('Save crash:', err);
      alert('An unexpected error occurred while saving.');
    }
  };

  const handleDeleteDossier = async (id: string) => {
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
    setActiveAdminTab('basic');
    if (profile) {
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
          dateEnd: profile.dateEnd,
          location: profile.location,
          tempFullBio: profile.fullBio,
          timeline: profile.timeline || [],
          archives: profile.archives || [],
          news: profile.news || []
        }
      });
    } else {
      setEditForm({
        status: 'Unverified',
        reputation_score: 50,
        verification_level: 'Standard',
        details: { 
            isOrganization: false, 
            status: 'ACTIVE',
            tempFullBio: '',
            timeline: [],
            archives: [],
            news: []
        }
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
                      {profiles.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="p-8 text-center text-gray-500 italic">
                                No dossiers found. Click "Add New" to create the first record.
                            </td>
                        </tr>
                      ) : (
                        profiles.map(p => (
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
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Edit Modal */}
          {isEditing && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white w-full max-w-4xl max-h-[95vh] overflow-y-auto rounded-sm flex flex-col">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                  <h2 className="text-2xl font-serif font-bold text-navy">
                    {editForm.id ? 'Edit Dossier' : 'New Dossier'}
                  </h2>
                  <button onClick={() => setIsEditing(false)}><X className="w-6 h-6 text-gray-400" /></button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 px-6 bg-gray-50">
                    <button 
                        className={`py-3 px-4 text-sm font-bold border-b-2 transition-colors ${activeAdminTab === 'basic' ? 'border-navy text-navy' : 'border-transparent text-gray-500 hover:text-navy'}`}
                        onClick={() => setActiveAdminTab('basic')}
                    >
                        Basic Info
                    </button>
                    <button 
                        className={`py-3 px-4 text-sm font-bold border-b-2 transition-colors ${activeAdminTab === 'timeline' ? 'border-navy text-navy' : 'border-transparent text-gray-500 hover:text-navy'}`}
                        onClick={() => setActiveAdminTab('timeline')}
                    >
                        Timeline
                    </button>
                    <button 
                        className={`py-3 px-4 text-sm font-bold border-b-2 transition-colors ${activeAdminTab === 'archive' ? 'border-navy text-navy' : 'border-transparent text-gray-500 hover:text-navy'}`}
                        onClick={() => setActiveAdminTab('archive')}
                    >
                        Archives (Docs)
                    </button>
                    <button 
                        className={`py-3 px-4 text-sm font-bold border-b-2 transition-colors ${activeAdminTab === 'news' ? 'border-navy text-navy' : 'border-transparent text-gray-500 hover:text-navy'}`}
                        onClick={() => setActiveAdminTab('news')}
                    >
                        News
                    </button>
                </div>

                <div className="p-6">
                    {activeAdminTab === 'basic' && (
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
                                <label className="block text-sm font-bold text-gray-700 mb-1">Location</label>
                                <input 
                                    type="text" 
                                    className="w-full border p-2 rounded-sm"
                                    value={editForm.details?.location || ''}
                                    onChange={(e) => setEditForm({
                                        ...editForm, 
                                        details: { ...editForm.details, location: e.target.value }
                                    })}
                                />
                                </div>
                                <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Category</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. Politics, Business, Sports"
                                    className="w-full border p-2 rounded-sm"
                                    value={editForm.category || ''}
                                    onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                                />
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
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Date Start/Born</label>
                                        <input 
                                            type="text" 
                                            placeholder="e.g. 1960"
                                            className="w-full border p-2 rounded-sm"
                                            value={editForm.details?.dateStart || ''}
                                            onChange={(e) => setEditForm({
                                                ...editForm, 
                                                details: { ...editForm.details, dateStart: e.target.value }
                                            })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Date End/Died</label>
                                        <input 
                                            type="text" 
                                            placeholder="e.g. 2020"
                                            className="w-full border p-2 rounded-sm"
                                            value={editForm.details?.dateEnd || ''}
                                            onChange={(e) => setEditForm({
                                                ...editForm, 
                                                details: { ...editForm.details, dateEnd: e.target.value }
                                            })}
                                        />
                                    </div>
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
                                <div>
                                    <label className="flex items-center space-x-2 mt-4 cursor-pointer">
                                        <input 
                                            type="checkbox"
                                            checked={editForm.details?.isOrganization || false}
                                            onChange={(e) => setEditForm({
                                                ...editForm, 
                                                details: { ...editForm.details, isOrganization: e.target.checked }
                                            })}
                                            className="h-4 w-4"
                                        />
                                        <span className="text-sm font-bold text-gray-700">Is Organization/Company?</span>
                                    </label>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Short Bio</label>
                                    <textarea 
                                        className="w-full border p-2 rounded-sm h-20"
                                        value={editForm.bio || ''}
                                        onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                                    />
                                </div>
                            </div>
                            
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-1">Full Biography</label>
                                <textarea 
                                    className="w-full border p-2 rounded-sm h-40 font-serif"
                                    value={editForm.details?.tempFullBio || ''}
                                    onChange={(e) => setEditForm({
                                        ...editForm,
                                        details: { ...editForm.details, tempFullBio: e.target.value }
                                    })}
                                />
                            </div>
                        </div>
                    )}

                    {activeAdminTab === 'timeline' && (
                        <div>
                             <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-lg">Timeline Events</h3>
                                <button onClick={addTimelineEvent} className="text-sm bg-navy text-white px-3 py-1 rounded-sm flex items-center">
                                    <Plus className="w-3 h-3 mr-1" /> Add Event
                                </button>
                            </div>
                            <div className="space-y-4">
                                {editForm.details?.timeline?.map((event: TimelineEvent, idx: number) => (
                                    <div key={idx} className="flex gap-2 items-start border p-3 rounded-sm bg-gray-50">
                                        <input 
                                            placeholder="Year" 
                                            className="w-20 border p-1 rounded-sm"
                                            value={event.year} 
                                            onChange={e => updateTimelineEvent(idx, 'year', e.target.value)}
                                        />
                                        <input 
                                            placeholder="Title" 
                                            className="w-1/3 border p-1 rounded-sm font-bold"
                                            value={event.title} 
                                            onChange={e => updateTimelineEvent(idx, 'title', e.target.value)}
                                        />
                                        <textarea 
                                            placeholder="Description" 
                                            className="flex-1 border p-1 rounded-sm"
                                            value={event.description} 
                                            onChange={e => updateTimelineEvent(idx, 'description', e.target.value)}
                                        />
                                        <button onClick={() => removeTimelineEvent(idx)} className="text-red-500 hover:text-red-700 p-1">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                {(!editForm.details?.timeline || editForm.details.timeline.length === 0) && (
                                    <p className="text-gray-400 italic text-center py-4">No timeline events added.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {activeAdminTab === 'archive' && (
                        <div>
                             <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-lg">Archives & Documents</h3>
                                <button onClick={addArchiveItem} className="text-sm bg-navy text-white px-3 py-1 rounded-sm flex items-center">
                                    <Plus className="w-3 h-3 mr-1" /> Add Document
                                </button>
                            </div>
                            <div className="space-y-4">
                                {editForm.details?.archives?.map((item: ArchiveItem, idx: number) => (
                                    <div key={idx} className="border p-4 rounded-sm bg-gray-50 flex flex-col gap-3">
                                        <div className="flex gap-2">
                                            <select 
                                                className="border p-1 rounded-sm w-24"
                                                value={item.type}
                                                onChange={e => updateArchiveItem(idx, 'type', e.target.value as any)}
                                            >
                                                <option value="PDF">PDF</option>
                                                <option value="IMAGE">IMAGE</option>
                                                <option value="AWARD">AWARD</option>
                                            </select>
                                            <input 
                                                placeholder="Document Title" 
                                                className="flex-1 border p-1 rounded-sm font-bold"
                                                value={item.title} 
                                                onChange={e => updateArchiveItem(idx, 'title', e.target.value)}
                                            />
                                            <input 
                                                placeholder="Date (e.g. 1990)" 
                                                className="w-24 border p-1 rounded-sm"
                                                value={item.date} 
                                                onChange={e => updateArchiveItem(idx, 'date', e.target.value)}
                                            />
                                             <button onClick={() => removeArchiveItem(idx)} className="text-red-500 hover:text-red-700">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm">
                                            {item.url ? (
                                                <a href={item.url} target="_blank" className="text-blue-600 flex items-center hover:underline">
                                                    <LinkIcon className="w-3 h-3 mr-1" /> View Uploaded File
                                                </a>
                                            ) : (
                                                <span className="text-orange-500 flex items-center"><AlertCircle className="w-3 h-3 mr-1"/> No file uploaded</span>
                                            )}
                                            
                                            <label className="cursor-pointer bg-white border border-gray-300 px-2 py-1 rounded-sm hover:bg-gray-50 flex items-center">
                                                <Upload className="w-3 h-3 mr-1" /> 
                                                {uploadingDoc === item.id ? 'Uploading...' : 'Upload File'}
                                                <input 
                                                    type="file" 
                                                    className="hidden" 
                                                    onChange={(e) => handleArchiveUpload(e, idx)} 
                                                />
                                            </label>
                                            <input 
                                                placeholder="Or paste URL here" 
                                                className="flex-1 border p-1 rounded-sm text-gray-500 text-xs"
                                                value={item.url || ''} 
                                                onChange={e => updateArchiveItem(idx, 'url', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                ))}
                                 {(!editForm.details?.archives || editForm.details.archives.length === 0) && (
                                    <p className="text-gray-400 italic text-center py-4">No documents added.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {activeAdminTab === 'news' && (
                        <div>
                             <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-lg">News & Reports</h3>
                                <button onClick={addNewsItem} className="text-sm bg-navy text-white px-3 py-1 rounded-sm flex items-center">
                                    <Plus className="w-3 h-3 mr-1" /> Add Article
                                </button>
                            </div>
                            <div className="space-y-4">
                                {editForm.details?.news?.map((item: NewsItem, idx: number) => (
                                    <div key={idx} className="flex flex-col gap-2 border p-3 rounded-sm bg-gray-50">
                                        <div className="flex gap-2">
                                            <input 
                                                placeholder="Article Title" 
                                                className="flex-1 border p-1 rounded-sm font-bold"
                                                value={item.title} 
                                                onChange={e => updateNewsItem(idx, 'title', e.target.value)}
                                            />
                                            <button onClick={() => removeNewsItem(idx)} className="text-red-500 hover:text-red-700">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="flex gap-2">
                                            <input 
                                                placeholder="Source (e.g. BBC)" 
                                                className="w-1/3 border p-1 rounded-sm"
                                                value={item.source} 
                                                onChange={e => updateNewsItem(idx, 'source', e.target.value)}
                                            />
                                            <input 
                                                placeholder="Date" 
                                                className="w-1/3 border p-1 rounded-sm"
                                                value={item.date} 
                                                onChange={e => updateNewsItem(idx, 'date', e.target.value)}
                                            />
                                            <input 
                                                placeholder="Link URL" 
                                                className="w-1/3 border p-1 rounded-sm text-blue-600"
                                                value={item.url || ''} 
                                                onChange={e => updateNewsItem(idx, 'url', e.target.value)}
                                            />
                                        </div>
                                        <textarea 
                                            placeholder="Summary" 
                                            className="w-full border p-1 rounded-sm h-16"
                                            value={item.summary} 
                                            onChange={e => updateNewsItem(idx, 'summary', e.target.value)}
                                        />
                                    </div>
                                ))}
                                {(!editForm.details?.news || editForm.details.news.length === 0) && (
                                    <p className="text-gray-400 italic text-center py-4">No news items added.</p>
                                )}
                            </div>
                        </div>
                    )}

                </div>

                <div className="p-6 border-t border-gray-100 flex justify-end space-x-4 sticky bottom-0 bg-white">
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
              <BrandPin className="h-8 w-8 text-gold group-hover:text-white transition-colors" />
              <div className="flex flex-col">
                <span className="text-2xl font-serif font-bold tracking-tight">SomaliPin</span>
                <span className="text-[10px] text-gray-400 uppercase tracking-widest">{t.subtitle}</span>
              </div>
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
                     <span className="border border-gold text-gold px-4 py-1.5 rounded-sm hover:bg-gold hover:text-navy transition-all cursor-pointer text-sm font-medium" onClick={() => setView('admin')}>
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
                <>
                    {profiles.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredProfiles.map((profile) => (
                            <ProfileCard 
                            key={profile.id} 
                            profile={profile} 
                            onClick={handleProfileClick} 
                            onVerify={(e) => handleVerifyClick(e, profile)}
                            />
                        ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-white border border-dashed border-gray-300 rounded-sm">
                            <Database className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-serif font-bold text-navy mb-2">The Archive is currently empty</h3>
                            <p className="text-gray-500 max-w-md mx-auto mb-6">
                                We are currently initializing the digital records. Please log in to the Admin Dashboard to start populating the registry.
                            </p>
                            <button 
                                onClick={() => setView('admin')}
                                className="inline-flex items-center text-gold font-bold hover:underline"
                            >
                                Go to Admin Dashboard <ChevronLeft className="w-4 h-4 ml-1 rotate-180" />
                            </button>
                        </div>
                    )}
                </>
              )}
            </section>

            {/* Services */}
            <section className="max-w-6xl mx-auto px-4 py-12">
               <h2 className="text-3xl font-serif font-bold text-navy mb-8">{t.section_what_we_do}</h2>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 <div className="bg-white p-6 rounded-sm shadow-sm border-t-4 border-gold hover:shadow-md transition-all">
                    <div className="mb-4 text-gold"><User className="h-8 w-8" /></div>
                    <h3 className="text-xl font-serif font-bold text-navy mb-3">{t.service_1_title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed font-sans">{t.service_1_desc}</p>
                 </div>
                 <div className="bg-white p-6 rounded-sm shadow-sm border-t-4 border-gold hover:shadow-md transition-all">
                    <div className="mb-4 text-gold"><VerifiedBadge className="h-8 w-8" /></div>
                    <h3 className="text-xl font-serif font-bold text-navy mb-3">{t.service_2_title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed font-sans">{t.service_2_desc}</p>
                 </div>
                 <div className="bg-white p-6 rounded-sm shadow-sm border-t-4 border-gold hover:shadow-md transition-all">
                    <div className="mb-4 text-gold"><BookOpen className="h-8 w-8" /></div>
                    <h3 className="text-xl font-serif font-bold text-navy mb-3">{t.service_3_title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed font-sans">{t.service_3_desc}</p>
                 </div>
                 <div className="bg-white p-6 rounded-sm shadow-sm border-t-4 border-gold hover:shadow-md transition-all">
                    <div className="mb-4 text-gold"><Search className="h-8 w-8" /></div>
                    <h3 className="text-xl font-serif font-bold text-navy mb-3">{t.service_4_title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed font-sans">{t.service_4_desc}</p>
                 </div>
               </div>
            </section>
          </>
        ) : (
          /* Profile Detail View */
          <div className="max-w-5xl mx-auto px-4 py-12 animate-fade-in">
            <button 
              onClick={handleBack}
              className="group flex items-center text-navy font-medium mb-8 hover:text-gold transition-colors rtl:flex-row-reverse"
            >
              <ChevronLeft className="h-5 w-5 mr-1 group-hover:-translate-x-1 transition-transform rtl:rotate-180 rtl:ml-1 rtl:mr-0" />
              {t.back_directory}
            </button>

            {selectedProfile && (
              <div className="bg-white shadow-xl rounded-sm overflow-hidden mb-12">
                <div className={`h-48 relative ${selectedProfile.verificationLevel === VerificationLevel.HERO ? 'bg-red-900' : 'bg-navy'}`}>
                    <div className="absolute inset-0 bg-black/20 pattern-grid-lg"></div>
                </div>

                <div className="px-8 pb-12">
                    <div className="relative flex justify-between items-end -mt-20 mb-8">
                        <div className="relative">
                            <img 
                                src={selectedProfile.imageUrl || 'https://via.placeholder.com/150'} 
                                alt={selectedProfile.name}
                                className={`w-40 h-40 object-cover rounded-sm border-4 border-white shadow-md ${selectedProfile.verificationLevel === VerificationLevel.HERO ? 'grayscale-0' : ''}`}
                            />
                            {selectedProfile.verified && (
                                <div 
                                  className="absolute -bottom-3 -right-3 rtl:-left-3 rtl:right-auto bg-white p-1 rounded-full shadow-sm cursor-pointer hover:scale-110 transition-transform"
                                  onClick={() => setShowCertificate(true)}
                                  title="Click to view Official Certificate"
                                >
                                    {getVerificationIcon(selectedProfile.verificationLevel)}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                        <div className="lg:col-span-2">
                            <div className="mb-8">
                                <div className="flex flex-wrap items-center gap-3 mb-4">
                                     <span className={`text-sm font-bold tracking-widest uppercase
                                        ${selectedProfile.verificationLevel === VerificationLevel.HERO ? 'text-red-700' : 'text-gold'}
                                    `}>
                                        {selectedProfile.categoryLabel || selectedProfile.category}
                                    </span>
                                    
                                    {/* NEW BUTTON */}
                                    {selectedProfile.verified && (
                                         <button 
                                            onClick={() => setShowCertificate(true)}
                                            className={`flex items-center px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider transition-all
                                                ${selectedProfile.verificationLevel === VerificationLevel.HERO ? 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100' : 
                                                  selectedProfile.verificationLevel === VerificationLevel.GOLDEN ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100' : 
                                                  'bg-blue-50 text-navy-light border-blue-100 hover:bg-blue-100'}
                                            `}
                                         >
                                            {selectedProfile.verificationLevel === VerificationLevel.HERO && <HeroBadge className="w-4 h-4 mr-2" />}
                                            {selectedProfile.verificationLevel === VerificationLevel.GOLDEN && <GoldenBadge className="w-4 h-4 mr-2" />}
                                            {selectedProfile.verificationLevel === VerificationLevel.STANDARD && <StandardBadge className="w-4 h-4 mr-2" />}
                                            
                                            {getVerificationLabel(selectedProfile.verificationLevel)}
                                         </button>
                                    )}
                                </div>
                                <h1 className="text-4xl font-serif font-bold text-navy mb-2">
                                    {selectedProfile.name}
                                </h1>
                                <p className="text-xl text-gray-500 font-light">
                                    {selectedProfile.title}
                                </p>
                                {selectedProfile.location && (
                                    <div className="flex items-center text-gray-400 text-sm mt-3">
                                        <MapPin className="h-4 w-4 mr-1 rtl:ml-1 rtl:mr-0" />
                                        {selectedProfile.location}
                                    </div>
                                )}
                            </div>

                            <div className="prose prose-slate max-w-none rtl:text-right">
                                <h3 className="text-navy font-serif text-xl border-b border-gray-200 pb-2 mb-4">{t.about}</h3>
                                <p className="text-gray-700 leading-relaxed text-lg whitespace-pre-line">
                                    {selectedProfile.fullBio || selectedProfile.shortBio}
                                </p>
                            </div>

                            <div className="mt-12">
                                <h3 className="text-navy font-serif text-xl border-b border-gray-200 pb-2 mb-4">{t.timeline}</h3>
                                {selectedProfile.timeline && selectedProfile.timeline.length > 0 ? (
                                    <Timeline events={selectedProfile.timeline} />
                                ) : (
                                    <p className="text-gray-400 italic">No timeline events recorded.</p>
                                )}
                            </div>
                        </div>

                        {/* Sidebar Stats */}
                        <div className="space-y-6">
                            <div className="bg-slate p-6 rounded-sm border border-gray-200">
                                <h4 className="font-serif font-bold text-navy mb-4">{t.key_info}</h4>
                                <div className="space-y-4 text-sm">
                                    
                                    {/* Lifecycle Dates */}
                                    <div className="flex items-center">
                                        <Calendar className={`h-5 w-5 mr-3 rtl:ml-3 rtl:mr-0 ${selectedProfile.verificationLevel === VerificationLevel.HERO ? 'text-red-700' : 'text-gold'}`} />
                                        <div>
                                            <span className="block text-gray-400 text-xs uppercase">{selectedProfile.isOrganization ? t.lbl_est : t.lbl_born}</span>
                                            <span className="font-medium text-gray-800">{selectedProfile.dateStart}</span>
                                        </div>
                                    </div>

                                    {selectedProfile.dateEnd && (
                                        <div className="flex items-center">
                                            <Clock className={`h-5 w-5 mr-3 rtl:ml-3 rtl:mr-0 ${selectedProfile.verificationLevel === VerificationLevel.HERO ? 'text-red-700' : 'text-gold'}`} />
                                            <div>
                                                <span className="block text-gray-400 text-xs uppercase">{selectedProfile.isOrganization ? t.lbl_closed : t.lbl_died}</span>
                                                <span className="font-medium text-gray-800">{selectedProfile.dateEnd}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Status */}
                                    <div className="flex items-center">
                                        <Activity className={`h-5 w-5 mr-3 rtl:ml-3 rtl:mr-0 ${selectedProfile.verificationLevel === VerificationLevel.HERO ? 'text-red-700' : 'text-gold'}`} />
                                        <div>
                                            <span className="block text-gray-400 text-xs uppercase">{t.lbl_status}</span>
                                            <span className={`font-medium px-2 py-0.5 rounded text-xs inline-block mt-0.5 ${
                                                selectedProfile.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                                selectedProfile.status === 'DECEASED' ? 'bg-gray-200 text-gray-800' :
                                                selectedProfile.status === 'RETIRED' ? 'bg-orange-100 text-orange-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                                {getStatusLabel(selectedProfile)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="w-full h-px bg-gray-200 my-2"></div>

                                    <div className="flex items-center cursor-pointer hover:bg-gray-100 p-1 rounded transition-colors" onClick={() => setShowCertificate(true)}>
                                        <Building2 className={`h-5 w-5 mr-3 rtl:ml-3 rtl:mr-0 ${selectedProfile.verificationLevel === VerificationLevel.HERO ? 'text-red-700' : 'text-gold'}`} />
                                        <div>
                                            <span className="block text-gray-400 text-xs uppercase">{t.label_affiliation}</span>
                                            <span className="font-medium text-gray-800 underline decoration-dotted">{getVerificationLabel(selectedProfile.verificationLevel)}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <User className={`h-5 w-5 mr-3 rtl:ml-3 rtl:mr-0 ${selectedProfile.verificationLevel === VerificationLevel.HERO ? 'text-red-700' : 'text-gold'}`} />
                                        <div>
                                            <span className="block text-gray-400 text-xs uppercase">{t.label_role}</span>
                                            <span className="font-medium text-gray-800">{selectedProfile.categoryLabel || selectedProfile.category}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabbed Section (Archive, News, Influence) */}
                <div className="bg-slate/30 border-t border-gray-200 px-8 py-8">
                    <div className="flex space-x-8 rtl:space-x-reverse border-b border-gray-300 mb-8 overflow-x-auto">
                        {['archive', 'news', 'influence'].map((tab) => (
                           <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`pb-4 text-sm font-bold tracking-widest transition-colors relative whitespace-nowrap ${
                                    activeTab === tab ? 'text-navy' : 'text-gray-400 hover:text-gray-600'
                                }`}
                            >
                                {tab === 'archive' ? t.tab_archive : tab === 'news' ? t.tab_news : t.tab_influence}
                                {activeTab === tab && <span className="absolute bottom-0 left-0 w-full h-1 bg-gold rounded-t-sm"></span>}
                            </button> 
                        ))}
                    </div>

                    {activeTab === 'archive' && (
                        <div className="animate-fade-in">
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {(selectedProfile.archives && selectedProfile.archives.length > 0) ? (
                                    selectedProfile.archives.map((file) => (
                                        <a 
                                            key={file.id} 
                                            href={file.url || '#'}
                                            target="_blank"
                                            className="bg-white p-4 rounded-sm border border-gray-100 flex items-start space-x-3 rtl:space-x-reverse hover:shadow-md transition-shadow cursor-pointer"
                                        >
                                            <div className="bg-slate p-2 rounded-sm text-navy">
                                                {file.type === 'PDF' && <FileText className="h-5 w-5" />}
                                                {file.type === 'IMAGE' && <ImageIcon className="h-5 w-5" />}
                                                {file.type === 'AWARD' && <Award className="h-5 w-5 text-gold" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-gray-800 truncate">{file.title}</p>
                                                <div className="flex justify-between items-center mt-1">
                                                    <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 rounded">{file.type}</span>
                                                    <span className="text-[10px] text-gray-400">{file.date}</span>
                                                </div>
                                            </div>
                                        </a>
                                    ))
                                ) : (
                                    <p className="col-span-3 text-center text-gray-400 italic text-sm py-4">{t.no_docs}</p>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'news' && (
                        <div className="animate-fade-in space-y-4">
                            {(selectedProfile.news && selectedProfile.news.length > 0) ? (
                                selectedProfile.news.map((news) => (
                                    <a key={news.id} href={news.url || '#'} target="_blank" className="block bg-white p-5 rounded-sm border-l-4 rtl:border-l-0 rtl:border-r-4 border-gold shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-navy text-base">{news.title}</h4>
                                            <span className="text-xs text-gray-400 whitespace-nowrap ml-4">{news.date}</span>
                                        </div>
                                        <div className="flex items-center text-xs text-gold font-bold uppercase tracking-wider mb-3">
                                            <Newspaper className="h-3 w-3 mr-1 rtl:ml-1 rtl:mr-0" /> {news.source}
                                        </div>
                                        <p className="text-sm text-gray-600 leading-relaxed">{news.summary}</p>
                                    </a>
                                ))
                            ) : (
                                <p className="text-center text-gray-400 italic text-sm py-4">{t.no_news}</p>
                            )}
                        </div>
                    )}
                    
                    {activeTab === 'influence' && (
                         <div className="animate-fade-in max-w-2xl mx-auto bg-white p-8 rounded-sm shadow-sm border border-gray-100">
                             {/* ... existing influence chart code ... */}
                             {selectedProfile.influence ? (
                                <>
                                    <div className="flex items-center justify-between mb-2"><span className="text-sm font-bold text-navy">{t.sentiment_support}</span><span>{selectedProfile.influence.support}%</span></div>
                                    <div className="w-full bg-gray-100 rounded-full h-3 mb-6"><div className="bg-navy h-3 rounded-full" style={{ width: `${selectedProfile.influence.support}%` }}></div></div>
                                    
                                    <div className="flex items-center justify-between mb-2"><span className="text-sm font-bold text-gold-dark">{t.sentiment_neutral}</span><span>{selectedProfile.influence.neutral}%</span></div>
                                    <div className="w-full bg-gray-100 rounded-full h-3 mb-6"><div className="bg-gold h-3 rounded-full" style={{ width: `${selectedProfile.influence.neutral}%` }}></div></div>

                                    <div className="flex items-center justify-between mb-2"><span className="text-sm font-bold text-red-900">{t.sentiment_oppose}</span><span>{selectedProfile.influence.opposition}%</span></div>
                                    <div className="w-full bg-gray-100 rounded-full h-3 mb-2"><div className="bg-red-900 h-3 rounded-full" style={{ width: `${selectedProfile.influence.opposition}%` }}></div></div>
                                </>
                             ) : <p className="text-center text-gray-400">No data available.</p>}
                         </div>
                    )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-navy text-white pt-16 pb-8 border-t border-gold relative">
        <div className="max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                <div className="space-y-4">
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                         <BrandPin className="h-6 w-6 text-gold" />
                         <span className="text-xl font-serif font-bold">SomaliPin</span>
                    </div>
                    <p className="text-gray-400 text-sm leading-relaxed">{t.footer_desc}</p>
                </div>
                {/* ... other footer columns ... */}
                <div>
                     {/* Secret Admin Entry */}
                     <h5 
                        className="font-serif font-bold mb-4 text-gold cursor-pointer hover:text-white"
                        onClick={() => setView('admin')}
                    >
                        {t.footer_platform}
                     </h5>
                     {/* ... links ... */}
                </div>
            </div>
            <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
                <p>&copy; {new Date().getFullYear()} {t.rights}</p>
            </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
