
import * as React from 'react';
import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, ChevronLeft, Building2, User, FileText, 
  ImageIcon, Newspaper, Globe, Calendar, Clock, Activity, Lock, 
  Plus, Trash2, Save, X, Database, Sun, Moon, Headphones, 
  Unlock, Shield, Loader2, Briefcase, Landmark, Gavel, 
  ShieldCheck, ChevronUp, ChevronDown, Palette, Settings, Layers, RefreshCw, 
  ExternalLink, Play, ArrowRight, Upload, Edit3, Check, Link as LinkIcon, Monitor, UserPlus, UserMinus
} from 'lucide-react';
import ProfileCard from './components/ProfileCard';
import Timeline from './components/Timeline';
import VerificationCertificate from './components/VerificationCertificate';
import { BrandPin, GoldenBadge, HeroBadge, StandardBadge, NobelBadge, VerifiedBadge } from './components/Icons';
import { UI_TEXT } from './constants';
import { Profile, VerificationLevel, Language, DossierDB, ProfileStatus, SectionType, ArchiveCategory, ArchiveAssignment, Partner } from './types';
import { supabase, isSupabaseConfigured } from './services/supabaseClient';

const App = () => {
  const [view, setView] = useState<'home' | 'profile' | 'admin' | 'archive-explorer' | 'business-archive' | 'arts-culture-archive'>('home');
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'archive' | 'news' | 'podcast'>('archive');
  const [language, setLanguage] = useState<Language>('en');
  const [darkMode, setDarkMode] = useState(false);
  
  const [showCertificate, setShowCertificate] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [allCategories, setAllCategories] = useState<ArchiveCategory[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [sectorConfigs, setSectorConfigs] = useState<Record<string, {title: string, desc: string}>>({
    business: { title: 'Business (Ganacsiga)', desc: 'Tracking Somali entrepreneurship and corporate pioneers.' },
    arts_culture: { title: 'Arts & Culture', desc: 'Preserving the legacy of Somali artists and custodians.' }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [displayLimit, setDisplayLimit] = useState(12);

  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminSubView, setAdminSubView] = useState<'dossiers' | 'categories' | 'partners' | 'sectors'>('dossiers');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Profile>>({});
  const [activeAdminTab, setActiveAdminTab] = useState<'basic' | 'timeline' | 'positions' | 'archive' | 'news' | 'podcast'>('basic');
  const [isLocking, setIsLocking] = useState(false); 
  const [isUploadingImage, setIsUploadingImage] = useState(false); 
  const [isUploadingPartnerLogo, setIsUploadingPartnerLogo] = useState(false);

  const [newCatName, setNewCatName] = useState('');
  const [newCatSection, setNewCatSection] = useState<SectionType>(SectionType.BUSINESS);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingCatId, setEditingCatId] = useState<number | null>(null);
  const [editingCatName, setEditingCatName] = useState('');

  const [newPartnerName, setNewPartnerName] = useState('');
  const [newPartnerLogoUrl, setNewPartnerLogoUrl] = useState('');
  const [isAddingPartner, setIsAddingPartner] = useState(false);

  const [isSavingSectors, setIsSavingSectors] = useState(false);
  const [sectorAssignForm, setSectorAssignForm] = useState<Record<string, { dossierId: string, categoryId: number }>>({
    business: { dossierId: '', categoryId: 0 },
    arts_culture: { dossierId: '', categoryId: 0 }
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const partnerLogoInputRef = useRef<HTMLInputElement>(null);

  const t = UI_TEXT[language] || UI_TEXT.en;

  useEffect(() => {
    const handleRouteChange = () => {
      const path = window.location.pathname;
      if (path === '/admin') {
        setView('admin');
      } else if (path === '/') {
        if (view === 'admin') setView('home');
      }
    };

    window.addEventListener('popstate', handleRouteChange);
    handleRouteChange();
    return () => window.removeEventListener('popstate', handleRouteChange);
  }, [view]);

  const navigateTo = (newView: typeof view, path: string = '/') => {
    setView(newView);
    window.scrollTo(0, 0);
  };

  const handleBack = () => {
    setSelectedProfile(null);
    navigateTo('home', '/');
  };

  const handleProfileClick = (profile: Profile) => {
    if (!profile) return;
    setSelectedProfile(profile);
    setView('profile');
    setActiveTab('archive');
    window.scrollTo(0, 0);
  };

  const groupedArchive = useMemo(() => {
    const sections: Record<SectionType, Record<string, ArchiveAssignment[]>> = {
      [SectionType.POLITICS]: {},
      [SectionType.JUDICIARY]: {},
      [SectionType.SECURITY]: {},
      [SectionType.BUSINESS]: {},
      [SectionType.ARTS_CULTURE]: {}
    };

    (profiles || []).filter(Boolean).forEach(p => {
      (p.archiveAssignments || []).filter(Boolean).forEach(assignment => {
        if (assignment && assignment.category) {
          const sType = assignment.category.section_type;
          const cName = assignment.category.category_name;
          
          if (sType && sections[sType]) {
            if (!sections[sType][cName]) sections[sType][cName] = [];
            sections[sType][cName].push({ ...assignment, user: p } as any);
          }
        }
      });
    });

    return sections;
  }, [profiles]);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  const fetchDossiers = async () => {
    try {
      setIsLoading(true);
      if (!isSupabaseConfigured) return;

      const { data: dossiersData, error: dossiersError } = await supabase.from('dossiers').select('*').order('created_at', { ascending: false });
      if (dossiersError) throw dossiersError;

      const { data: categoriesData, error: categoriesError } = await supabase.from('archive_categories').select('*').order('section_type', { ascending: true }).order('category_name', { ascending: true });
      if (!categoriesError && categoriesData) setAllCategories(categoriesData);

      const { data: partnersData, error: partnersError } = await supabase.from('partners').select('*').order('created_at', { ascending: false });
      if (!partnersError && partnersData) setPartners(partnersData);

      // Silently fetch sectors to avoid popup crash if table is missing
      const { data: sectorsData, error: sectorsError } = await supabase.from('archive_sectors').select('*');
      if (!sectorsError && sectorsData) {
        const configs = sectorsData.reduce((acc: any, s: any) => ({ ...acc, [s.id]: { title: s.title, desc: s.description } }), {});
        setSectorConfigs(prev => ({ ...prev, ...configs }));
      }

      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('archive_assignments')
        .select(`
          id, user_id, category_id, start_date, end_date, title_note,
          archive_categories ( id, category_name, section_type )
        `);

      const profileAssignmentsMap = new Map<string, ArchiveAssignment[]>();
      (assignmentsData || []).forEach((assignment: any) => {
        if (!assignment || !assignment.user_id) return;
        
        const mappedAssignment: ArchiveAssignment = {
          id: assignment.id,
          user_id: assignment.user_id,
          category_id: assignment.category_id,
          start_date: assignment.start_date || '',
          end_date: assignment.end_date || '',
          title_note: assignment.title_note || '',
          category: assignment.archive_categories ? {
            id: assignment.archive_categories.id,
            category_name: assignment.archive_categories.category_name,
            section_type: assignment.archive_categories.section_type
          } : undefined,
        };
        if (!profileAssignmentsMap.has(assignment.user_id)) profileAssignmentsMap.set(assignment.user_id, []);
        profileAssignmentsMap.get(assignment.user_id)?.push(mappedAssignment);
      });

      const mappedProfiles: Profile[] = (dossiersData || []).filter(Boolean).map((d: DossierDB) => {
        const details = d.details && typeof d.details === 'object' ? d.details : {};
        
        let bioStr = '';
        if (typeof details.fullBio === 'string') {
          bioStr = details.fullBio;
        } else if (details.fullBio && typeof details.fullBio === 'object') {
          bioStr = details.fullBio[language] || details.fullBio.en || details.fullBio.so || '';
        }
        if (!bioStr) bioStr = d.bio || '';

        return {
          id: d.id,
          name: d.full_name || 'Unnamed',
          title: d.role || 'No Title',
          category: d.category || 'Uncategorized',
          categoryLabel: d.category,
          verified: d.status === 'Verified',
          verificationLevel: (d.verification_level as VerificationLevel) || VerificationLevel.STANDARD,
          imageUrl: d.image_url || 'https://via.placeholder.com/150',
          shortBio: d.bio || '',
          fullBio: bioStr,
          timeline: Array.isArray(details.timeline) ? details.timeline : [],
          location: details.location || '',
          archives: Array.isArray(details.archives) ? details.archives : [],
          news: Array.isArray(details.news) ? details.news : [],
          podcasts: Array.isArray(details.podcasts) ? details.podcasts : [],
          influence: { support: d.reputation_score || 0, neutral: 100 - (d.reputation_score || 0), opposition: 0 },
          isOrganization: !!details.isOrganization,
          status: (details.status as ProfileStatus) || 'ACTIVE',
          dateStart: details.dateStart || 'Unknown',
          dateEnd: details.dateEnd || '',
          locked: !!details.locked,
          archiveAssignments: profileAssignmentsMap.get(d.id) || [],
        };
      });
      setProfiles(mappedProfiles);
    } catch (err) {
      console.error('fetchDossiers error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchDossiers(); }, [language]);

  const filteredProfiles = useMemo(() => {
    if (!searchQuery.trim()) return (profiles || []).filter(Boolean);
    const query = searchQuery.toLowerCase();
    return (profiles || []).filter(p => 
      p && (
        (p.name || '').toLowerCase().includes(query) ||
        (p.category || '').toLowerCase().includes(query) ||
        (p.title || '').toLowerCase().includes(query)
      )
    );
  }, [profiles, searchQuery]);

  const displayedProfiles = useMemo(() => {
    return filteredProfiles.slice(0, displayLimit);
  }, [filteredProfiles, displayLimit]);

  const handleAdminLogin = () => {
    if (adminPassword === 'NPipin1123@@') {
      setIsAdminLoggedIn(true);
      setAdminPassword('');
    } else alert('Invalid password');
  };

  const handleLockToggle = async (profile: Profile) => {
    try {
      if (!profile) return;
      const newLockedState = !profile.locked;
      const { data, error } = await supabase.from('dossiers').select('details').eq('id', profile.id).single();
      if (error || !data) throw new Error('Could not fetch latest details');
      const updatedDetails = { ...data.details, locked: newLockedState };
      const { error: updateError } = await supabase.from('dossiers').update({ details: updatedDetails }).eq('id', profile.id);
      if (updateError) throw updateError;
      setProfiles(profiles.map(p => p.id === profile.id ? { ...p, locked: newLockedState } : p));
    } catch (err: any) {
      alert('Failed to toggle lock: ' + (err.message || 'Error'));
    }
  };

  const handleGlobalLock = async (shouldLock: boolean) => {
    const action = shouldLock ? 'LOCK' : 'UNLOCK';
    if (!window.confirm(`⚠️ WARNING: This will ${action} ALL dossiers.`)) return;
    setIsLocking(true);
    try {
      const { data: allDossiers, error: fetchError } = await supabase.from('dossiers').select('id, details');
      if (fetchError || !allDossiers) throw new Error('Failed to fetch dossier details');
      const updatePromises = allDossiers.filter(Boolean).map(dossier => 
        supabase.from('dossiers').update({ details: { ...(dossier.details || {}), locked: shouldLock } }).eq('id', dossier.id)
      );
      await Promise.all(updatePromises);
      await fetchDossiers();
      alert(`Success: All dossiers have been ${shouldLock ? 'LOCKED' : 'UNLOCKED'}.`);
    } catch (err: any) {
        alert('Global lock failed: ' + err.message);
    } finally {
        setIsLocking(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    setIsAddingCategory(true);
    try {
      const { error } = await supabase.from('archive_categories').insert([{ category_name: newCatName.trim(), section_type: newCatSection }]);
      if (error) alert(error.message);
      else {
        setNewCatName('');
        await fetchDossiers();
      }
    } finally {
      setIsAddingCategory(false);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!window.confirm('Delete this category?')) return;
    const { error } = await supabase.from('archive_categories').delete().eq('id', id);
    if (error) alert(error.message);
    else await fetchDossiers();
  };

  const handleStartEditCategory = (cat: ArchiveCategory) => {
    setEditingCatId(cat.id);
    setEditingCatName(cat.category_name);
  };

  const handleUpdateCategory = async () => {
    if (!editingCatId || !editingCatName.trim()) return;
    try {
      const { error } = await supabase.from('archive_categories').update({ category_name: editingCatName.trim() }).eq('id', editingCatId);
      if (error) throw error;
      setEditingCatId(null);
      await fetchDossiers();
    } catch (err: any) {
      alert('Update failed: ' + err.message);
    }
  };

  const handlePartnerLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingPartnerLogo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `partner_${Date.now()}.${fileExt}`;
      const filePath = fileName;

      const { data, error } = await supabase.storage.from('profile-pictures').upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage.from('profile-pictures').getPublicUrl(filePath);
      setNewPartnerLogoUrl(publicUrlData.publicUrl);
    } catch (error: any) {
      alert('Logo upload-ka waa fashilmay: ' + error.message);
    } finally {
      setIsUploadingPartnerLogo(false);
    }
  };

  const handleAddPartner = async () => {
    if (!newPartnerName.trim()) {
      alert("Fadlan geli magaca shirkadda.");
      return;
    }
    if (!newPartnerLogoUrl) {
      alert("Fadlan upload-garee Logo-da shirkadda.");
      return;
    }

    setIsAddingPartner(true);
    try {
      const { error } = await supabase.from('partners').insert([
        { name: newPartnerName.trim(), logo_url: newPartnerLogoUrl }
      ]);
      
      if (error) throw error;
      
      setNewPartnerName('');
      setNewPartnerLogoUrl('');
      await fetchDossiers();
      alert('Bahwadaaga (Partner) waa lagu daray!');
    } catch (err: any) {
      alert('Cillad aya dhacday: ' + err.message);
    } finally {
      setIsAddingPartner(false);
    }
  };

  const handleDeletePartner = async (id: string) => {
    if (!window.confirm('Ma hubtaa inaad tirtirto bahwadaaga?')) return;
    const { error = null } = await supabase.from('partners').delete().eq('id', id);
    if (error) alert(error.message);
    else await fetchDossiers();
  };

  const handleSaveSector = async (id: string) => {
    const config = sectorConfigs[id];
    if (!config) return;
    setIsSavingSectors(true);
    try {
      const { error } = await supabase.from('archive_sectors').upsert({ id, title: config.title, description: config.desc });
      if (error) throw error;
      alert(`Sector-ka ${config.title} waa la keydiyay!`);
    } catch (err: any) {
      alert('Cillad: ' + err.message);
    } finally {
      setIsSavingSectors(false);
    }
  };

  const handleAddAssignmentToSector = async (sid: string) => {
    const form = sectorAssignForm[sid];
    if (!form.dossierId || !form.categoryId) return alert("Fadlan dooro Profile iyo Category.");
    
    setIsSavingSectors(true);
    try {
        const profile = profiles.find(p => p.id === form.dossierId);
        const { error } = await supabase.from('archive_assignments').insert([{
            user_id: form.dossierId,
            category_id: form.categoryId,
            title_note: profile?.title || 'Archive Record',
            start_date: profile?.dateStart || ''
        }]);
        if (error) throw error;
        setSectorAssignForm(prev => ({ ...prev, [sid]: { ...prev[sid], dossierId: '' } }));
        await fetchDossiers();
        alert('Profile-ka waa lagu daray sector-ka!');
    } catch (err: any) {
        alert('Add failed: ' + err.message);
    } finally {
        setIsSavingSectors(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId: number) => {
    if (!window.confirm('Ma hubtaa inaad profile-kan ka saarto sector-ka?')) return;
    try {
        const { error } = await supabase.from('archive_assignments').delete().eq('id', assignmentId);
        if (error) throw error;
        await fetchDossiers();
    } catch (err: any) {
        alert('Remove failed: ' + err.message);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAdminLoggedIn) {
      alert('Kaliya Admin-ka ayaa sawir soo gelin kara.');
      return;
    }

    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `profile_${Date.now()}.${fileExt}`;
      const filePath = fileName; 

      const { data, error } = await supabase.storage.from('profile-pictures').upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage.from('profile-pictures').getPublicUrl(filePath);
      setEditForm(prev => ({ ...prev, imageUrl: publicUrlData.publicUrl }));
      alert('Sawirka waa la soo geliyay!');
    } catch (error: any) {
      alert('Upload-ka waa fashilmay: ' + error.message);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSaveDossier = async () => {
    try {
      if (!editForm.name || !editForm.category) return alert('Name and Category are required');
      
      const dossierData = {
        full_name: editForm.name,
        role: editForm.title || '',
        bio: editForm.shortBio || '', 
        status: editForm.verified ? 'Verified' : 'Unverified',
        reputation_score: Number(editForm.influence?.support) || 0,
        image_url: editForm.imageUrl || '',
        category: editForm.category,
        verification_level: editForm.verificationLevel || 'Standard',
        details: { 
            fullBio: editForm.fullBio,
            location: editForm.location,
            status: editForm.status,
            dateStart: editForm.dateStart,
            dateEnd: editForm.dateEnd,
            isOrganization: !!editForm.isOrganization,
            locked: !!editForm.locked,
            timeline: editForm.timeline || [],
            archives: editForm.archives || [],
            news: editForm.news || [],
            podcasts: editForm.podcasts || []
        }
      };
      
      let savedDossierId = editForm.id;
      if (editForm.id) {
        await supabase.from('dossiers').update(dossierData).eq('id', editForm.id);
      } else {
        const { data } = await supabase.from('dossiers').insert([dossierData]).select();
        savedDossierId = data?.[0]?.id;
      }

      if (savedDossierId) {
        await supabase.from('archive_assignments').delete().eq('user_id', savedDossierId);
        const assignmentsToSave = (editForm.archiveAssignments || []).filter(Boolean).map(a => ({
          user_id: savedDossierId,
          category_id: Number(a.category_id),
          start_date: String(a.start_date || '').trim(),
          end_date: String(a.end_date || '').trim(),
          title_note: String(a.title_note || '').trim()
        }));
        if (assignmentsToSave.length > 0) await supabase.from('archive_assignments').insert(assignmentsToSave);
      }
      await fetchDossiers();
      setIsEditing(false);
      alert('Profile saved successfully!');
    } catch (err: any) { alert(err.message); }
  };

  const getStatusLabel = (status: ProfileStatus) => {
    switch (status) {
        case 'ACTIVE': return t.status_active;
        case 'DECEASED': return t.status_deceased;
        case 'RETIRED': return t.status_retired;
        case 'CLOSED': return t.status_closed;
        default: return status;
    }
  };

  const getVerificationIcon = (level?: VerificationLevel) => {
    switch (level) {
      case VerificationLevel.NOBEL: return <NobelBadge className="h-8 w-8 text-purple-700" />;
      case VerificationLevel.HERO: return <HeroBadge className="h-8 w-8 text-red-700" />;
      case VerificationLevel.GOLDEN: return <GoldenBadge className="h-8 w-8 text-gold" />;
      case VerificationLevel.STANDARD: return <StandardBadge className="h-8 w-8 text-navy-light" />;
      default: return <VerifiedBadge className="h-8 w-8 text-gray-400" />;
    }
  };

  const getVerificationLabel = (level?: VerificationLevel) => {
    if (!selectedProfile?.verified) return t.lvl_unverified;
    switch (level) {
      case VerificationLevel.NOBEL: return t.lvl_nobel;
      case VerificationLevel.HERO: return t.lvl_hero;
      case VerificationLevel.GOLDEN: return t.lvl_golden;
      case VerificationLevel.STANDARD: return t.lvl_standard;
      default: return t.lvl_standard;
    }
  };

  const ArchivistWorkDesk = () => (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-slate dark:bg-navy p-8 text-center animate-fade-in">
          <div className="bg-white dark:bg-navy-light p-12 rounded-sm shadow-2xl max-w-2xl w-full border-t-8 border-navy dark:border-gold relative overflow-hidden">
              <div className="absolute top-4 right-4 text-navy/10 dark:text-white/5">
                  <Shield className="w-32 h-32" />
              </div>
              <div className="relative z-10">
                  <div className="inline-block p-4 bg-navy dark:bg-gold rounded-full mb-6 shadow-lg">
                      <Lock className="w-8 h-8 text-white dark:text-navy" />
                  </div>
                  <h1 className="text-3xl md:text-4xl font-serif font-bold text-navy dark:text-white mb-2 tracking-tight">Somalipin</h1>
                  <h2 className="text-xl md:text-2xl font-sans font-medium text-gold dark:text-gray-300 uppercase tracking-widest mb-8">Archivist Work Desk Edition</h2>
                  <div className="h-px w-24 bg-gray-300 dark:bg-gray-600 mx-auto mb-8"></div>
                  <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed mb-8">
                      This dossier is currently secured for archival processing, verification updates, or sensitivity classification. Access is temporarily restricted to authorized archivists only.
                  </p>
                  <div className="inline-flex items-center space-x-2 text-xs font-bold text-gray-400 uppercase tracking-widest border border-gray-200 dark:border-gray-600 px-4 py-2 rounded-sm">
                      <Activity className="w-3 h-3" />
                      <span>Status: Locked / Maintenance</span>
                  </div>
              </div>
          </div>
      </div>
  );

  const ArchiveExplorer = ({ sectionsToShow, title, description }: { sectionsToShow: SectionType[], title: string, description: string }) => {
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(
        (sectionsToShow || []).reduce((acc, s) => ({ ...acc, [s]: true }), {})
    );
    const toggleSection = (s: SectionType) => setExpandedSections(prev => ({ ...prev, [s]: !prev[s] }));

    return (
      <div className="max-w-6xl mx-auto px-4 py-12 animate-fade-in">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-serif font-bold text-navy dark:text-white mb-4">{title}</h1>
          <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">{description}</p>
        </div>
        <div className="space-y-6">
          {(sectionsToShow || []).map((section) => {
            const categories = groupedArchive[section] || {};
            const hasData = Object.keys(categories).length > 0;
            const label = 
              section === SectionType.POLITICS ? t.sec_politics : 
              section === SectionType.JUDICIARY ? t.sec_judiciary : 
              section === SectionType.SECURITY ? t.sec_security : 
              section === SectionType.BUSINESS ? t.sec_business : t.sec_arts_culture;
              
            const icon = 
              section === SectionType.POLITICS ? <Landmark className="w-6 h-6" /> : 
              section === SectionType.JUDICIARY ? <Gavel className="w-6 h-6" /> : 
              section === SectionType.SECURITY ? <ShieldCheck className="w-6 h-6" /> : 
              section === SectionType.BUSINESS ? <Briefcase className="w-6 h-6" /> : <Palette className="w-6 h-6" />;

            return (
              <div key={section} className="bg-white dark:bg-navy shadow-sm rounded-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                <button onClick={() => toggleSection(section)} className="w-full flex items-center justify-between p-6 bg-slate dark:bg-navy-light hover:bg-gray-100 dark:hover:bg-navy transition-colors border-l-8 border-navy dark:border-gold">
                  <div className="flex items-center space-x-4 rtl:space-x-reverse">
                    <div className="text-gold">{icon}</div>
                    <h2 className="text-xl font-serif font-bold text-navy dark:text-white">{label}</h2>
                  </div>
                  {expandedSections[section] ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                </button>
                {expandedSections[section] && (
                  <div className="p-8 space-y-12">
                    {hasData ? Object.entries(categories).map(([catName, assignments]) => (
                      <div key={catName} className="border-b border-gray-100 dark:border-gray-800 pb-8 last:border-0 last:pb-0">
                        <h3 className="text-lg font-serif font-bold text-navy dark:text-gold mb-6 flex items-center">
                          <Plus className="w-4 h-4 mr-2 text-gold-dark" /> {catName}
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {(assignments as any[] || []).filter(Boolean).map((assign: any, idx) => (
                            <div key={idx} onClick={() => handleProfileClick(assign.user)} className="group flex items-center p-4 bg-slate dark:bg-navy-light rounded-sm hover:shadow-lg transition-all cursor-pointer border-l-2 border-transparent hover:border-gold">
                              <img src={assign.user?.imageUrl || 'https://via.placeholder.com/150'} className="w-14 h-14 object-cover rounded-full border-2 border-white dark:border-navy group-hover:scale-105 transition-transform" />
                              <div className="ml-4 rtl:mr-4 rtl:ml-0 min-w-0">
                                <h4 className="text-sm font-bold text-navy dark:text-white truncate group-hover:text-gold transition-colors">{assign.user?.name}</h4>
                                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider truncate mb-1">{assign.title_note}</p>
                                <div className="inline-flex items-center text-[10px] bg-white dark:bg-navy px-1.5 py-0.5 rounded border border-gray-100 dark:border-gray-800 text-gray-500 font-mono">
                                  {assign.start_date && (
                                    <>
                                      <Calendar className="w-2.5 h-2.5 mr-1" /> {assign.start_date} - {assign.end_date || 'Present'}
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )) : <div className="text-center py-12"><Database className="w-12 h-12 text-gray-200 mx-auto mb-3" /><p className="text-gray-400 italic">{t.empty_archive}</p></div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (view === 'admin') {
    return (
      <div className="min-h-screen bg-slate dark:bg-navy-light dark:text-gray-100 p-8 font-sans text-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-serif font-bold text-navy dark:text-white">Admin Dashboard</h1>
            <button onClick={handleBack} className="text-navy dark:text-gold hover:text-gold flex items-center">
              <ChevronLeft className="w-4 h-4 mr-2" /> Back to Site
            </button>
          </div>

          {!isAdminLoggedIn ? (
            <div className="max-w-md mx-auto bg-white dark:bg-navy p-8 rounded-sm shadow-md text-center">
              <BrandPin className="h-12 w-12 text-gold mx-auto mb-6" />
              <h2 className="text-xl font-bold mb-4 dark:text-white uppercase tracking-widest">Archivist Access</h2>
              <input type="password" placeholder="Passkey" className="w-full border p-2 mb-4 rounded-sm dark:bg-navy-light dark:border-gray-600 dark:text-white text-center" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} />
              <button onClick={handleAdminLogin} className="w-full bg-navy text-white py-2 rounded-sm hover:bg-navy-light dark:bg-gold dark:text-navy font-bold">UNFOLD ARCHIVES</button>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row gap-8">
              <div className="w-full md:w-64 space-y-2">
                <button onClick={() => setAdminSubView('dossiers')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-sm font-bold transition-all ${adminSubView === 'dossiers' ? 'bg-navy text-white dark:bg-gold dark:text-navy' : 'bg-white dark:bg-navy text-gray-500 hover:bg-gray-50'}`}>
                  <User className="w-5 h-5" /> <span>Dossiers</span>
                </button>
                <button onClick={() => setAdminSubView('categories')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-sm font-bold transition-all ${adminSubView === 'categories' ? 'bg-navy text-white dark:bg-gold dark:text-navy' : 'bg-white dark:bg-navy text-gray-500 hover:bg-gray-50'}`}>
                  <Layers className="w-5 h-5" /> <span>Registry Structure</span>
                </button>
                <button onClick={() => setAdminSubView('sectors')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-sm font-bold transition-all ${adminSubView === 'sectors' ? 'bg-navy text-white dark:bg-gold dark:text-navy' : 'bg-white dark:bg-navy text-gray-500 hover:bg-gray-50'}`}>
                  <Monitor className="w-5 h-5" /> <span>Home Sectors</span>
                </button>
                <button onClick={() => setAdminSubView('partners')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-sm font-bold transition-all ${adminSubView === 'partners' ? 'bg-navy text-white dark:bg-gold dark:text-navy' : 'bg-white dark:bg-navy text-gray-500 hover:bg-gray-50'}`}>
                  <LinkIcon className="w-5 h-5" /> <span>Partners</span>
                </button>
              </div>

              <div className="flex-1 bg-white dark:bg-navy rounded-sm shadow-sm p-6 overflow-hidden min-h-[60vh]">
                {adminSubView === 'dossiers' ? (
                  <>
                    <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                      <div className="flex items-center gap-4">
                        <h2 className="text-xl font-bold text-gray-700 dark:text-gray-200">Dossier Management</h2>
                        {isLocking && <span className="text-xs text-gold animate-pulse flex items-center"><Loader2 className="w-3 h-3 mr-1 animate-spin"/> Processing...</span>}
                      </div>
                      <div className="flex space-x-4 items-center">
                        <div className="flex items-center bg-slate dark:bg-navy-light p-1 rounded-sm border border-gray-200 dark:border-gray-600 mr-4">
                             <button onClick={() => handleGlobalLock(true)} disabled={isLocking} className={`flex items-center px-3 py-1 text-xs font-bold rounded-sm transition-all ${isLocking ? 'opacity-50 cursor-not-allowed' : 'text-gray-600 dark:text-gray-300 hover:text-red-600 hover:bg-white dark:hover:bg-navy'}`}>
                                 <Lock className="w-3 h-3 mr-1" /> Lock All
                             </button>
                             <div className="w-px h-4 bg-gray-300 mx-1"></div>
                             <button onClick={() => handleGlobalLock(false)} disabled={isLocking} className={`flex items-center px-3 py-1 text-xs font-bold rounded-sm transition-all ${isLocking ? 'opacity-50 cursor-not-allowed' : 'text-gray-600 dark:text-gray-300 hover:text-green-600 hover:bg-white dark:hover:bg-navy'}`}>
                                 <Unlock className="w-3 h-3 mr-1" /> Unlock All
                             </button>
                        </div>
                        <button onClick={() => { setEditForm({ name: '', title: '', category: '', shortBio: '', fullBio: '', verified: false, verificationLevel: VerificationLevel.STANDARD, status: 'ACTIVE', timeline: [], archives: [], news: [], podcasts: [], archiveAssignments: [], isOrganization: false, dateStart: '', dateEnd: '', imageUrl: '' }); setIsEditing(true); }} className="bg-green-600 text-white px-4 py-2 rounded-sm flex items-center hover:bg-green-700 shadow-sm"><Plus className="w-4 h-4 mr-2" /> Add New</button>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 dark:bg-navy-light text-xs uppercase text-gray-400 font-bold">
                          <tr><th className="p-3">Lock</th><th className="p-3">Name</th><th className="p-3">Category</th><th className="p-3">Status</th><th className="p-3 text-right">Actions</th></tr>
                        </thead>
                        <tbody className="text-sm">
                          {(profiles || []).filter(Boolean).map(p => (
                            <tr key={p.id} className="border-b dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-navy-light/50">
                              <td className="p-3">
                                <button onClick={() => handleLockToggle(p)} className={`p-1.5 rounded-full transition-colors ${p.locked ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400'}`}>
                                  {p.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                                </button>
                              </td>
                              <td className="p-3 font-bold">{p.name}</td>
                              <td className="p-3 text-gray-500">{p.category}</td>
                              <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${p.verified ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{p.verified ? 'VERIFIED' : 'UNVERIFIED'}</span></td>
                              <td className="p-3 text-right space-x-2">
                                <button onClick={() => { setEditForm({ ...p }); setIsEditing(true); }} className="text-navy dark:text-gold hover:underline font-bold">Edit</button>
                                <button onClick={async () => { if(window.confirm('Delete dossier?')) { await supabase.from('dossiers').delete().eq('id', p.id); fetchDossiers(); } }} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : adminSubView === 'categories' ? (
                  <div className="space-y-8 text-gray-800">
                    <div className="flex justify-between items-center mb-2">
                      <h2 className="text-xl font-bold text-gray-800 dark:text-white">Archive Categories Manager</h2>
                      <button onClick={fetchDossiers} className="p-2 text-gray-400 hover:text-navy dark:hover:text-gold" title="Refresh Structure">
                        <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                    
                    <div className="bg-slate dark:bg-navy-light p-6 rounded-sm border border-gray-200 dark:border-gray-800 shadow-inner">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex-1">
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Sector</label>
                          <select className="w-full border p-2.5 rounded-sm dark:bg-navy dark:border-gray-600 text-sm focus:ring-2 focus:ring-gold outline-none" value={newCatSection} onChange={e => setNewCatSection(e.target.value as SectionType)}>
                            {Object.values(SectionType).map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                        <div className="flex-1">
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Category Name</label>
                          <input className="w-full border p-2.5 rounded-sm dark:bg-navy dark:border-gray-600 text-sm focus:ring-2 focus:ring-gold outline-none" value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="e.g. Banks, Hospitals..." />
                        </div>
                        <button onClick={handleAddCategory} disabled={isAddingCategory} className="self-end bg-navy dark:bg-gold text-white dark:text-navy h-[42px] px-6 rounded-sm font-bold flex items-center justify-center shadow-md hover:bg-navy-light transition-all disabled:opacity-50">
                          {isAddingCategory ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />} 
                          Add Category
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {Object.values(SectionType).map(section => {
                        const cats = (allCategories || []).filter(c => c && c.section_type === section);
                        return (
                          <div key={section} className="bg-white dark:bg-navy-light/30 border border-gray-100 dark:border-gray-800 p-5 rounded-sm flex flex-col h-full shadow-sm">
                            <h3 className="text-[11px] font-bold text-gold uppercase tracking-[0.2em] border-b border-gray-100 dark:border-gray-800 pb-3 mb-4 flex justify-between items-center">{section} <span className="bg-gray-50 dark:bg-navy px-2 py-0.5 rounded text-[10px] text-gray-400">({cats.length})</span></h3>
                            <div className="space-y-1.5 overflow-y-auto max-h-[400px] flex-grow pr-1">
                              {cats.length === 0 ? <p className="text-[11px] text-gray-300 italic py-4 text-center">No categories.</p> : cats.map(c => (
                                <div key={c.id} className="flex items-center justify-between text-xs bg-slate/50 dark:bg-navy-light/40 px-3 py-2.5 rounded-sm group hover:bg-white dark:hover:bg-navy transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-700">
                                  {editingCatId === c.id ? (
                                    <div className="flex items-center space-x-2 w-full">
                                      <input 
                                        className="flex-1 border p-1 rounded-sm text-xs dark:bg-navy dark:border-gray-600 dark:text-white"
                                        value={editingCatName}
                                        onChange={e => setEditingCatName(e.target.value)}
                                        autoFocus
                                        onKeyDown={e => e.key === 'Enter' && handleUpdateCategory()}
                                      />
                                      <button onClick={handleUpdateCategory} className="text-green-600 hover:text-green-700 p-1"><Check className="w-3.5 h-3.5" /></button>
                                      <button onClick={() => setEditingCatId(null)} className="text-gray-400 hover:text-gray-600 p-1"><X className="w-3.5 h-3.5" /></button>
                                    </div>
                                  ) : (
                                    <>
                                      <span className="font-semibold text-navy-light dark:text-gray-200">{c.category_name}</span>
                                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleStartEditCategory(c)} className="text-navy dark:text-gold hover:underline p-1"><Edit3 className="w-3.5 h-3.5" /></button>
                                        <button onClick={() => handleDeleteCategory(c.id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : adminSubView === 'sectors' ? (
                  <div className="space-y-8 text-gray-800 animate-fade-in">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Home Sectors Management</h2>
                    <div className="grid grid-cols-1 gap-8">
                      {['business', 'arts_culture'].map((sid) => {
                        const sectionType = sid === 'business' ? SectionType.BUSINESS : SectionType.ARTS_CULTURE;
                        const sectorCategories = allCategories.filter(c => c && c.section_type === sectionType);
                        
                        const assignedProfiles = profiles.filter(p => 
                          p.archiveAssignments?.some(a => a.category?.section_type === sectionType)
                        );

                        return (
                          <div key={sid} className="bg-white dark:bg-navy-light p-8 rounded-sm border border-gray-100 dark:border-gray-800 shadow-md space-y-6">
                            <div className="flex justify-between items-start border-b border-gray-100 dark:border-gray-700 pb-4">
                                <h3 className="text-lg font-serif font-bold uppercase tracking-widest text-navy dark:text-gold">{sid === 'business' ? 'Business Sector' : 'Arts & Culture Sector'}</h3>
                                <button 
                                    onClick={() => handleSaveSector(sid)} 
                                    disabled={isSavingSectors}
                                    className="bg-navy dark:bg-gold text-white dark:text-navy px-6 py-2 rounded-sm font-bold text-xs flex items-center shadow-sm"
                                >
                                    {isSavingSectors ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Save className="w-3 h-3 mr-2" />} Save Core Info
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <div className="space-y-4">
                                  <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Display Title</label>
                                    <input 
                                      className="w-full border p-2.5 rounded-sm dark:bg-navy dark:border-gray-600 text-sm font-bold focus:ring-1 focus:ring-gold outline-none" 
                                      value={sectorConfigs[sid]?.title || ''} 
                                      onChange={e => setSectorConfigs(prev => ({ ...prev, [sid]: { ...prev[sid], title: e.target.value } }))} 
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Display Description</label>
                                    <textarea 
                                      className="w-full border p-2.5 rounded-sm dark:bg-navy dark:border-gray-600 text-sm h-24 resize-none focus:ring-1 focus:ring-gold outline-none" 
                                      value={sectorConfigs[sid]?.desc || ''} 
                                      onChange={e => setSectorConfigs(prev => ({ ...prev, [sid]: { ...prev[sid], desc: e.target.value } }))} 
                                    />
                                  </div>
                              </div>

                              <div className="bg-slate dark:bg-navy p-6 rounded-sm border border-gray-200 dark:border-gray-700">
                                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4 flex items-center"><UserPlus className="w-3 h-3 mr-1.5" /> Quick Assign Profile</h4>
                                  <div className="space-y-4">
                                      <select 
                                        className="w-full border p-2.5 rounded-sm dark:bg-navy-light dark:border-gray-600 text-xs focus:ring-1 focus:ring-gold outline-none"
                                        value={sectorAssignForm[sid].dossierId}
                                        onChange={e => setSectorAssignForm(prev => ({ ...prev, [sid]: { ...prev[sid], dossierId: e.target.value } }))}
                                      >
                                          <option value="">Select Profile...</option>
                                          {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                      </select>
                                      <select 
                                        className="w-full border p-2.5 rounded-sm dark:bg-navy-light dark:border-gray-600 text-xs focus:ring-1 focus:ring-gold outline-none"
                                        value={sectorAssignForm[sid].categoryId}
                                        onChange={e => setSectorAssignForm(prev => ({ ...prev, [sid]: { ...prev[sid], categoryId: parseInt(e.target.value) } }))}
                                      >
                                          <option value={0}>Select Category...</option>
                                          {sectorCategories.map(c => <option key={c.id} value={c.id}>{c.category_name}</option>)}
                                      </select>
                                      <button 
                                        onClick={() => handleAddAssignmentToSector(sid)}
                                        className="w-full bg-navy-light dark:bg-gold-dark text-white py-2.5 rounded-sm font-bold text-xs hover:brightness-110 transition-all flex items-center justify-center"
                                      >
                                          <Plus className="w-3 h-3 mr-2" /> Add to Sector
                                      </button>
                                  </div>
                              </div>
                            </div>

                            <div className="mt-8">
                                <h4 className="text-xs font-bold uppercase text-navy dark:text-gray-300 mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">Profiles in this Sector ({assignedProfiles.length})</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {assignedProfiles.length === 0 ? (
                                        <p className="text-xs text-gray-400 italic">No profiles assigned yet.</p>
                                    ) : assignedProfiles.map(p => {
                                        // Find the specific assignment for this profile in this section
                                        const assignment = p.archiveAssignments?.find(a => a.category?.section_type === sectionType);
                                        return (
                                            <div key={p.id} className="flex items-center justify-between p-3 bg-white dark:bg-navy border border-gray-100 dark:border-gray-800 rounded-sm group hover:shadow-sm transition-all">
                                                <div className="flex items-center space-x-3">
                                                    <img src={p.imageUrl} className="w-8 h-8 rounded-full object-cover" />
                                                    <div>
                                                        <p className="text-xs font-bold truncate max-w-[120px]">{p.name}</p>
                                                        <p className="text-[10px] text-gray-400">{assignment?.category?.category_name}</p>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => assignment && handleRemoveAssignment(assignment.id)}
                                                    className="p-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="Remove from Sector"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8 text-gray-800">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Partner Management</h2>
                    <div className="bg-slate dark:bg-navy-light p-6 rounded-sm border border-gray-200 dark:border-gray-800 shadow-inner">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                        <div className="flex-1">
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">PARTNER NAME</label>
                          <input className="w-full border border-gray-200 p-3 rounded-sm dark:bg-navy dark:border-gray-600 text-sm focus:ring-1 focus:ring-blue-400 outline-none" value={newPartnerName} onChange={e => setNewPartnerName(e.target.value)} placeholder="e.g. Hormuud Telecom" />
                        </div>
                        <div className="flex-1">
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">LOGO UPLOAD</label>
                          <div className="flex items-center space-x-4">
                            <input type="file" accept="image/*" onChange={handlePartnerLogoUpload} ref={partnerLogoInputRef} className="hidden" />
                            <button onClick={() => partnerLogoInputRef.current?.click()} className="flex items-center justify-center space-x-2 border border-dashed border-gray-300 p-3 rounded-sm w-full hover:bg-white dark:hover:bg-navy transition-colors text-xs font-bold text-gray-400">
                              {isUploadingPartnerLogo ? <Loader2 className="w-4 h-4 animate-spin text-gold" /> : (newPartnerLogoUrl ? <><Check className="w-4 h-4 text-green-500" /> <span>Logo Ready</span></> : <><Upload className="w-4 h-4" /> <span>Choose Logo</span></>)}
                            </button>
                            <button onClick={handleAddPartner} disabled={isAddingPartner || !newPartnerLogoUrl} className="bg-[#0A2647] dark:bg-gold text-white dark:text-navy h-[42px] px-8 rounded-sm font-bold flex items-center justify-center transition-all disabled:opacity-50">
                              {isAddingPartner ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Add Partner'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {partners.map(p => (
                        <div key={p.id} className="bg-white dark:bg-navy-light/30 border border-gray-100 dark:border-gray-800 p-4 rounded-sm relative group">
                          <img src={p.logo_url} alt={p.name} className="h-12 w-full object-contain mb-2 filter dark:brightness-200" />
                          <p className="text-xs font-bold text-center text-navy dark:text-white truncate">{p.name}</p>
                          <button onClick={() => handleDeletePartner(p.id)} className="absolute top-2 right-2 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-white/80 rounded-full shadow-sm"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {isEditing && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
              <div className="bg-white dark:bg-navy w-full max-w-5xl max-h-[95vh] overflow-hidden rounded-sm flex flex-col shadow-2xl animate-fade-in border border-gray-200 dark:border-gray-700 text-gray-800">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-navy shrink-0">
                  <h2 className="text-2xl font-serif font-bold text-navy dark:text-white">Dossier Workspace</h2>
                  <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-slate dark:hover:bg-navy-light rounded-full transition-colors"><X className="w-6 h-6 text-gray-400" /></button>
                </div>
                
                {/* Tabs */}
                <div className="flex border-b border-gray-200 dark:border-gray-700 px-6 bg-gray-50 dark:bg-navy-light overflow-x-auto shrink-0">
                    {[
                      { id: 'basic', label: 'Basic' },
                      { id: 'timeline', label: 'Timeline' },
                      { id: 'positions', label: 'Registry Positions' },
                      { id: 'archive', label: 'Archive' },
                      { id: 'news', label: 'News' },
                      { id: 'podcast', label: 'Podcast' }
                    ].map((tab) => (
                         <button 
                            key={tab.id} 
                            className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeAdminTab === tab.id ? 'border-navy text-navy dark:border-gold dark:text-gold' : 'border-transparent text-gray-500 hover:text-navy dark:text-gray-400 dark:hover:text-white'}`} 
                            onClick={() => setActiveAdminTab(tab.id as any)}
                         >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content Area - Scrollable */}
                <div className="p-8 flex-1 overflow-y-auto">
                    {activeAdminTab === 'basic' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-fade-in">
                            <div className="space-y-6">
                                <div><label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">FULL NAME</label><input type="text" className="w-full border border-gray-200 p-3 rounded-sm dark:bg-navy-light dark:border-gray-600 dark:text-white focus:ring-1 focus:ring-blue-400 outline-none" value={editForm.name || ''} onChange={(e) => setEditForm({...editForm, name: e.target.value})} /></div>
                                <div><label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">HEADLINE ROLE</label><input type="text" className="w-full border border-gray-200 p-3 rounded-sm dark:bg-navy-light dark:border-gray-600 dark:text-white focus:ring-1 focus:ring-blue-400 outline-none" value={editForm.title || ''} onChange={(e) => setEditForm({...editForm, title: e.target.value})} /></div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div><label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">START DATE (BIRTH/EST)</label><input type="text" className="w-full border border-gray-200 p-3 rounded-sm dark:bg-navy-light dark:border-gray-600 dark:text-white focus:ring-1 focus:ring-blue-400 outline-none" value={editForm.dateStart || ''} onChange={(e) => setEditForm({...editForm, dateStart: e.target.value})} placeholder="e.g. 1970" /></div>
                                  <div><label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">END DATE (DEATH/CLOSED)</label><input type="text" className="w-full border border-gray-200 p-3 rounded-sm dark:bg-navy-light dark:border-gray-600 dark:text-white focus:ring-1 focus:ring-blue-400 outline-none" value={editForm.dateEnd || ''} onChange={(e) => setEditForm({...editForm, dateEnd: e.target.value})} placeholder="e.g. 2021" /></div>
                                </div>
                                <div className="flex items-center space-x-6 py-4 bg-slate/30 dark:bg-navy-light/20 p-4 rounded-sm">
                                  <div className="flex items-center space-x-2">
                                    <input type="checkbox" id="isVerified" className="w-4 h-4 accent-gold" checked={!!editForm.verified} onChange={(e) => setEditForm({...editForm, verified: e.target.checked})} />
                                    <label htmlFor="isVerified" className="text-[11px] font-bold text-navy dark:text-gold uppercase tracking-wider">VERIFY PROFILE</label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <input type="checkbox" id="isOrg" className="w-4 h-4 accent-gold" checked={!!editForm.isOrganization} onChange={(e) => setEditForm({...editForm, isOrganization: e.target.checked})} />
                                    <label htmlFor="isOrg" className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Is Organization?</label>
                                  </div>
                                </div>
                                <div><label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">LIFECYCLE STATUS</label><select className="w-full border border-gray-200 p-3 rounded-sm dark:bg-navy-light dark:border-gray-600 dark:text-white focus:ring-1 focus:ring-blue-400 outline-none" value={editForm.status || 'ACTIVE'} onChange={(e) => setEditForm({...editForm, status: e.target.value as ProfileStatus})}><option value="ACTIVE">Active</option><option value="DECEASED">Deceased</option><option value="RETIRED">Retired</option><option value="CLOSED">Closed</option></select></div>
                            </div>
                            <div className="space-y-6">
                                <div><label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">DISPLAY CATEGORY</label><input type="text" className="w-full border border-gray-200 p-3 rounded-sm dark:bg-navy-light dark:border-gray-600 dark:text-white focus:ring-1 focus:ring-gold outline-none" value={editForm.category || ''} onChange={(e) => setEditForm({...editForm, category: e.target.value})} /></div>
                                <div><label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">HONORS TIER</label><select className="w-full border border-gray-200 p-3 rounded-sm dark:bg-navy-light dark:border-gray-600 dark:text-white focus:ring-1 focus:ring-blue-400 outline-none" value={editForm.verificationLevel || 'Standard'} onChange={(e) => setEditForm({...editForm, verificationLevel: e.target.value as VerificationLevel})}><option value="Standard">Standard</option><option value="Golden">Golden</option><option value="Hero">Hero</option><option value="Nobel">Nobel</option></select></div>
                                
                                <div className="p-4 border border-gray-100 dark:border-gray-700 bg-slate/20 dark:bg-navy/30 rounded-sm">
                                  <div className="mb-4"><label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">IMAGE URL</label><input type="text" className="w-full border border-gray-200 p-2 text-xs font-mono rounded-sm dark:bg-navy-light dark:border-gray-600 dark:text-white" value={editForm.imageUrl || ''} onChange={(e) => setEditForm({...editForm, imageUrl: e.target.value})} /></div>
                                  <div className="relative">
                                    <input type="file" accept="image/*" onChange={handleImageUpload} ref={fileInputRef} className="hidden" />
                                    <div className="w-full h-20 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-sm flex flex-col items-center justify-center cursor-pointer hover:bg-white dark:hover:bg-navy transition-colors" onClick={() => fileInputRef.current?.click()}>
                                      {isUploadingImage ? <Loader2 className="w-5 h-5 animate-spin text-gold" /> : <><Upload className="w-5 h-5 mb-1 text-gray-400" /><span className="text-[10px] font-bold uppercase text-gray-400">Upload Photo</span></>}
                                    </div>
                                  </div>
                                </div>
                                <div><label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">SHORT BIO</label><textarea className="w-full border border-gray-200 p-3 rounded-sm h-24 dark:bg-navy-light dark:border-gray-600 dark:text-white focus:ring-1 focus:ring-blue-400 outline-none resize-none" value={editForm.shortBio || ''} onChange={(e) => setEditForm({...editForm, shortBio: e.target.value})} /></div>
                            </div>
                            <div className="md:col-span-2"><label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">FULL BIOGRAPHY</label><textarea className="w-full border border-gray-200 p-4 rounded-sm h-60 font-serif text-lg dark:bg-navy-light dark:border-gray-600 dark:text-white focus:ring-1 focus:ring-blue-400 outline-none" value={editForm.fullBio || ''} onChange={(e) => setEditForm({ ...editForm, fullBio: e.target.value })} /></div>
                        </div>
                    )}

                    {activeAdminTab === 'timeline' && (
                        <div className="space-y-8 animate-fade-in">
                            <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-gray-800">
                                <h3 className="font-bold text-lg text-navy dark:text-white flex items-center"><Activity className="w-5 h-5 mr-2 text-gold"/> Historical Timeline</h3>
                                <button onClick={() => setEditForm(prev => ({ ...prev, timeline: [...(prev.timeline || []), { year: '', title: '', description: '' }] }))} className="text-xs bg-navy text-gold px-4 py-2 rounded-sm font-bold flex items-center shadow-md hover:bg-navy-light transition-all"><Plus className="w-4 h-4 mr-1.5" /> Add Entry</button>
                            </div>
                            <div className="space-y-4">
                                {(editForm.timeline || []).map((event, idx) => (
                                    <div key={idx} className="flex gap-6 items-start border border-gray-100 p-6 rounded-sm bg-[#F9FAFB] dark:bg-navy-light/20 relative group">
                                      <input placeholder="Year" className="w-24 border border-gray-200 p-3 rounded-sm dark:bg-navy dark:border-gray-600 dark:text-white font-mono text-sm" value={event.year || ''} onChange={e => { const t = [...(editForm.timeline || [])]; t[idx].year = e.target.value; setEditForm({...editForm, timeline: t}); }} />
                                      <div className="flex-1 space-y-4">
                                        <input placeholder="Entry Title" className="w-full border border-gray-200 p-3 rounded-sm font-bold dark:bg-navy dark:border-gray-600 dark:text-white" value={event.title || ''} onChange={e => { const t = [...(editForm.timeline || [])]; t[idx].title = e.target.value; setEditForm({...editForm, timeline: t}); }} />
                                        <textarea placeholder="Event description..." className="w-full border border-gray-200 p-3 rounded-sm dark:bg-navy dark:border-gray-600 dark:text-white text-sm resize-none h-24" value={event.description || ''} onChange={e => { const t = [...(editForm.timeline || [])]; t[idx].description = e.target.value; setEditForm({...editForm, timeline: t}); }} />
                                      </div>
                                      <button onClick={() => { const t = [...(editForm.timeline || [])]; t.splice(idx,1); setEditForm({...editForm, timeline: t}); }} className="absolute top-6 right-6 text-red-400 hover:text-red-600 transition-colors"><Trash2 className="w-5 h-5"/></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeAdminTab === 'positions' && (
                        <div className="space-y-8 animate-fade-in">
                             <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-gray-800">
                                <h3 className="font-bold text-lg text-navy dark:text-white flex items-center"><Layers className="w-5 h-5 mr-2 text-gold"/> Official Archive Roles</h3>
                                <button onClick={() => setEditForm(prev => ({ ...prev, archiveAssignments: [...(prev.archiveAssignments || []), { id: Date.now(), user_id: editForm.id || '', category_id: 0, start_date: '', end_date: '', title_note: '' }] }))} className="text-xs bg-[#0A2647] text-white px-5 py-2.5 rounded-sm font-bold flex items-center shadow-md hover:bg-navy-light transition-all"><Plus className="w-4 h-4 mr-1.5 text-gold" /> Assign Role</button>
                             </div>
                            <div className="space-y-6">
                              {(editForm.archiveAssignments || []).map((assign, idx) => {
                                return (
                                  <div key={idx} className="border border-gray-100 dark:border-gray-800 p-8 rounded-sm bg-[#F9FAFB] dark:bg-navy-light/10 relative shadow-sm">
                                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end pr-12">
                                          <div>
                                              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">CATEGORY</label>
                                              <select className="w-full border border-gray-200 p-3.5 rounded-sm dark:bg-navy dark:border-gray-600 dark:text-white text-sm focus:ring-1 focus:ring-blue-400 outline-none bg-white" value={assign.category_id} onChange={e => { const updated = [...(editForm.archiveAssignments || [])]; updated[idx].category_id = parseInt(e.target.value); setEditForm({...editForm, archiveAssignments: updated}); }}>
                                                  <option value={0}>Select Category...</option>
                                                  {Object.values(SectionType).map(sect => (
                                                      <optgroup label={sect} key={sect}>
                                                          {(allCategories || []).filter(c => c && c.section_type === sect).map(cat => (
                                                              <option key={cat.id} value={cat.id}>{cat.category_name}</option>
                                                          ))}
                                                      </optgroup>
                                                  ))}
                                              </select>
                                          </div>
                                          <div>
                                              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">SPECIFIC TITLE</label>
                                              <input placeholder="e.g. Chairman" className="w-full border border-gray-200 p-3.5 rounded-sm dark:bg-navy dark:border-gray-600 dark:text-white text-sm focus:ring-1 focus:ring-blue-400 outline-none bg-white" value={assign.title_note || ''} onChange={e => { const updated = [...(editForm.archiveAssignments || [])]; updated[idx].title_note = e.target.value; setEditForm({...editForm, archiveAssignments: updated}); }} />
                                          </div>
                                          <div>
                                              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">START DATE</label>
                                              <input placeholder="e.g. 2010" className="w-full border border-gray-200 p-3.5 rounded-sm dark:bg-navy dark:border-gray-600 dark:text-white text-sm focus:ring-1 focus:ring-blue-400 outline-none bg-white" value={assign.start_date || ''} onChange={e => { const updated = [...(editForm.archiveAssignments || [])]; updated[idx].start_date = e.target.value; setEditForm({...editForm, archiveAssignments: updated}); }} />
                                          </div>
                                          <div>
                                              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">END DATE</label>
                                              <input placeholder="e.g. 2014" className="w-full border border-gray-200 p-3.5 rounded-sm dark:bg-navy dark:border-gray-600 dark:text-white text-sm focus:ring-1 focus:ring-blue-400 outline-none bg-white" value={assign.end_date || ''} onChange={e => { const updated = [...(editForm.archiveAssignments || [])]; updated[idx].end_date = e.target.value; setEditForm({...editForm, archiveAssignments: updated}); }} />
                                          </div>
                                      </div>
                                      <button onClick={() => { const updated = [...(editForm.archiveAssignments || [])]; updated.splice(idx, 1); setEditForm({...editForm, archiveAssignments: updated}); }} className="absolute top-1/2 -translate-y-1/2 right-6 p-2 text-red-400 hover:text-red-600 transition-colors"><Trash2 className="w-5 h-5"/></button>
                                  </div>
                                );
                              })}
                            </div>
                        </div>
                    )}

                    {activeAdminTab === 'archive' && (
                        <div className="space-y-8 animate-fade-in">
                            <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-gray-800">
                                <h3 className="font-bold text-lg text-navy dark:text-white flex items-center"><FileText className="w-5 h-5 mr-2 text-gold"/> Archive Documents</h3>
                                <button onClick={() => setEditForm(prev => ({ ...prev, archives: [...(prev.archives || []), { id: Date.now().toString(), type: 'PDF', title: '', date: '', url: '' }] }))} className="text-xs bg-navy text-gold px-4 py-2 rounded-sm font-bold flex items-center shadow-md hover:bg-navy-light transition-all"><Plus className="w-4 h-4 mr-1.5" /> Add Doc</button>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                {(editForm.archives || []).map((item, idx) => (
                                    <div key={idx} className="flex gap-4 items-center border border-gray-200 p-5 rounded-sm bg-[#F9FAFB] dark:bg-navy-light/20 relative pr-14">
                                        <select className="w-32 border border-gray-200 p-2.5 rounded-sm dark:bg-navy dark:border-gray-600 dark:text-white text-xs" value={item.type} onChange={e => { const a = [...(editForm.archives || [])]; a[idx].type = e.target.value as any; setEditForm({...editForm, archives: a}); }}><option value="PDF">PDF</option><option value="IMAGE">IMAGE</option><option value="AWARD">AWARD</option></select>
                                        <input placeholder="Document Title" className="flex-1 border border-gray-200 p-2.5 rounded-sm dark:bg-navy dark:border-gray-600 dark:text-white text-sm" value={item.title || ''} onChange={e => { const a = [...(editForm.archives || [])]; a[idx].title = e.target.value; setEditForm({...editForm, archives: a}); }} />
                                        <input placeholder="https://..." className="flex-1 border border-gray-200 p-2.5 rounded-sm dark:bg-navy dark:border-gray-600 dark:text-white font-mono text-xs" value={item.url || ''} onChange={e => { const a = [...(editForm.archives || [])]; a[idx].url = e.target.value; setEditForm({...editForm, archives: a}); }} />
                                        <button onClick={() => { const a = [...(editForm.archives || [])]; a.splice(idx,1); setEditForm({...editForm, archives: a}); }} className="absolute top-1/2 -translate-y-1/2 right-4 text-red-400 hover:text-red-600 p-2"><Trash2 className="w-5 h-5"/></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeAdminTab === 'news' && (
                        <div className="space-y-8 animate-fade-in">
                            <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-gray-800">
                                <h3 className="font-bold text-lg text-navy dark:text-white flex items-center"><Newspaper className="w-5 h-5 mr-2 text-gold"/> Related News</h3>
                                <button onClick={() => setEditForm(prev => ({ ...prev, news: [...(prev.news || []), { id: Date.now().toString(), title: '', source: '', date: '', summary: '', url: '' }] }))} className="text-xs bg-navy text-gold px-4 py-2 rounded-sm font-bold flex items-center shadow-md hover:bg-navy-light transition-all"><Plus className="w-4 h-4 mr-1.5" /> Add News</button>
                            </div>
                            <div className="space-y-4">
                                {(editForm.news || []).map((item, idx) => (
                                    <div key={idx} className="border border-gray-200 p-6 rounded-sm bg-[#F9FAFB] dark:bg-navy-light/20 space-y-4 relative pr-14">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div><label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">HEADLINE</label><input className="w-full border border-gray-200 p-2.5 rounded-sm dark:bg-navy dark:border-gray-600 dark:text-white text-sm font-bold" value={item.title || ''} onChange={e => { const n = [...(editForm.news || [])]; n[idx].title = e.target.value; setEditForm({...editForm, news: n}); }} /></div>
                                            <div><label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">SOURCE</label><input className="w-full border border-gray-200 p-2.5 rounded-sm dark:bg-navy dark:border-gray-600 dark:text-white text-sm" value={item.source || ''} onChange={e => { const n = [...(editForm.news || [])]; n[idx].source = e.target.value; setEditForm({...editForm, news: n}); }} /></div>
                                        </div>
                                        <div><label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">SUMMARY</label><textarea className="w-full border border-gray-200 p-2.5 rounded-sm dark:bg-navy dark:border-gray-600 dark:text-white text-xs resize-none h-16" value={item.summary || ''} onChange={e => { const n = [...(editForm.news || [])]; n[idx].summary = e.target.value; setEditForm({...editForm, news: n}); }} /></div>
                                        <button onClick={() => { const n = [...(editForm.news || [])]; n.splice(idx,1); setEditForm({...editForm, news: n}); }} className="absolute top-6 right-4 text-red-400 hover:text-red-600 p-2"><Trash2 className="w-5 h-5"/></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeAdminTab === 'podcast' && (
                        <div className="space-y-8 animate-fade-in">
                            <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-gray-800">
                                <h3 className="font-bold text-lg text-navy dark:text-white flex items-center"><Headphones className="w-5 h-5 mr-2 text-gold"/> Podcast Media</h3>
                                <button onClick={() => setEditForm(prev => ({ ...prev, podcasts: [...(prev.podcasts || []), { id: Date.now().toString(), title: '', date: '', duration: '', source: '', url: '' }] }))} className="text-xs bg-navy text-gold px-4 py-2 rounded-sm font-bold flex items-center shadow-md hover:bg-navy-light transition-all"><Plus className="w-4 h-4 mr-1.5" /> Add Clip</button>
                            </div>
                            <div className="space-y-4">
                                {(editForm.podcasts || []).map((item, idx) => (
                                    <div key={idx} className="flex gap-4 items-center border border-gray-200 p-5 rounded-sm bg-[#F9FAFB] dark:bg-navy-light/20 relative pr-14">
                                        <div className="flex-1 space-y-2">
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">EPISODE TITLE</label>
                                            <input className="w-full border border-gray-200 p-2.5 rounded-sm dark:bg-navy dark:border-gray-600 dark:text-white text-sm font-bold" value={item.title || ''} onChange={e => { const p = [...(editForm.podcasts || [])]; p[idx].title = e.target.value; setEditForm({...editForm, podcasts: p}); }} />
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">AUDIO URL</label>
                                            <input className="w-full border border-gray-200 p-2.5 rounded-sm dark:bg-navy dark:border-gray-600 dark:text-white text-sm font-mono" value={item.url || ''} onChange={e => { const p = [...(editForm.podcasts || [])]; p[idx].url = e.target.value; setEditForm({...editForm, podcasts: p}); }} />
                                        </div>
                                        <button onClick={() => { const p = [...(editForm.podcasts || [])]; p.splice(idx,1); setEditForm({...editForm, podcasts: p}); }} className="absolute top-1/2 -translate-y-1/2 right-4 text-red-400 hover:text-red-600 p-2"><Trash2 className="w-5 h-5"/></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end items-center space-x-12 shrink-0 bg-white dark:bg-navy">
                    <button onClick={() => setIsEditing(false)} className="text-sm font-bold text-gray-400 hover:text-navy transition-colors tracking-widest uppercase">Discard</button>
                    <button onClick={handleSaveDossier} className="bg-[#0A2647] dark:bg-gold text-white dark:text-navy px-12 py-3 rounded-sm font-bold flex items-center shadow-lg transform active:scale-95 transition-all">
                        <Save className="w-4 h-4 mr-2.5" /> Save Dossier
                    </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-slate dark:bg-navy-light dark:text-gray-100 flex flex-col font-sans text-gray-800 ${language === 'ar' ? 'font-arabic' : ''}`}>
      {showCertificate && selectedProfile && (<VerificationCertificate profile={selectedProfile} lang={language} onClose={() => setShowCertificate(false)} />)}
      <nav className="sticky top-0 z-50 bg-navy text-white shadow-lg border-b border-navy-light">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-3 rtl:space-x-reverse cursor-pointer group" onClick={handleBack}><BrandPin className="h-8 w-8 text-gold group-hover:text-white transition-colors" /><div className="flex flex-col"><span className="text-2xl font-serif font-bold tracking-tight">SomaliPin</span><span className="text-[10px] text-gray-400 uppercase tracking-widest">{t.subtitle}</span></div></div>
            <div className="flex items-center space-x-6 rtl:space-x-reverse">
                <div className="hidden md:flex space-x-8 rtl:space-x-reverse text-sm font-medium text-gray-300">
                  <span onClick={() => navigateTo('archive-explorer', '/archive')} className={`hover:text-gold cursor-pointer transition-colors flex items-center ${view === 'archive-explorer' ? 'text-gold' : ''}`}><Landmark className="w-4 h-4 mr-2" /> {t.nav_archive}</span>
                  <span onClick={() => navigateTo('business-archive', '/business')} className={`hover:text-gold cursor-pointer transition-colors flex items-center ${view === 'business-archive' ? 'text-gold' : ''}`}><Briefcase className="w-4 h-4 mr-2" /> {t.nav_business}</span>
                  <span onClick={() => navigateTo('arts-culture-archive', '/culture')} className={`hover:text-gold cursor-pointer transition-colors flex items-center ${view === 'arts-culture-archive' ? 'text-gold' : ''}`}><Palette className="w-4 h-4 mr-2" /> {t.nav_arts}</span>
                </div>
                <div className="flex items-center bg-navy-light/50 rounded-full px-1 py-1 border border-navy-light"><button onClick={() => setLanguage('en')} className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${language === 'en' ? 'bg-gold text-navy shadow-sm' : 'text-gray-400 hover:text-white'}`}>EN</button><button onClick={() => setLanguage('so')} className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${language === 'so' ? 'bg-gold text-navy shadow-sm' : 'text-gray-400 hover:text-white'}`}>SO</button><button onClick={() => setLanguage('ar')} className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${language === 'ar' ? 'bg-gold text-navy shadow-sm' : 'text-gray-400 hover:text-white'}`}>AR</button></div>
                <button onClick={() => setDarkMode(!darkMode)} className="p-2 text-gray-400 hover:text-gold transition-colors" title="Toggle Dark Mode">{darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}</button>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow">
        {view === 'archive-explorer' ? (
          <ArchiveExplorer sectionsToShow={[SectionType.POLITICS, SectionType.JUDICIARY, SectionType.SECURITY]} title={t.archive_explorer_title} description={t.archive_explorer_desc} />
        ) : view === 'business-archive' ? (
          <ArchiveExplorer sectionsToShow={[SectionType.BUSINESS]} title={`🏛️ ${sectorConfigs.business.title} Archive`} description={sectorConfigs.business.desc} />
        ) : view === 'arts-culture-archive' ? (
          <ArchiveExplorer sectionsToShow={[SectionType.ARTS_CULTURE]} title={`🏛️ ${sectorConfigs.arts_culture.title} Archive`} description={sectorConfigs.arts_culture.desc} />
        ) : view === 'home' ? (
          <>
            <section className="bg-navy pb-16 pt-10 px-4 text-center border-b border-gold/20">
              <div className="max-w-3xl mx-auto space-y-6">
                <h1 className="text-4xl md:text-6xl font-serif font-bold text-white leading-tight">{t.hero_title_1} <br /><span className="text-gold italic">{t.hero_title_2}</span></h1>
                <p className="text-gray-300 text-lg md:text-xl font-light max-w-2xl mx-auto">{t.hero_desc}</p>
                <div className="flex flex-wrap justify-center gap-4 mt-8">
                  <div className="relative w-full max-w-xl group"><div className="absolute inset-y-0 left-0 pl-4 rtl:pl-0 rtl:right-0 rtl:pr-4 flex items-center pointer-events-none"><Search className="h-5 w-5 text-gray-400 group-focus-within:text-navy transition-colors" /></div><input type="text" className="block w-full pl-11 pr-4 rtl:pl-4 rtl:pr-11 py-4 bg-white dark:bg-navy dark:text-white dark:border-gray-600 border-0 rounded-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-gold focus:outline-none shadow-xl text-lg" placeholder={t.search_placeholder} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
                  <button onClick={() => navigateTo('archive-explorer', '/archive')} className="bg-gold hover:bg-gold-dark text-navy px-8 py-4 rounded-sm font-bold flex items-center shadow-xl transition-all"><Landmark className="w-5 h-5 mr-2" /> {t.nav_archive}</button>
                </div>
              </div>
            </section>

            <section className="max-w-6xl mx-auto px-4 py-16 -mt-10 relative z-10 text-gray-800">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div onClick={() => navigateTo('archive-explorer', '/archive')} className="group bg-white dark:bg-navy-light p-8 rounded-sm shadow-2xl border border-gray-100 dark:border-navy cursor-pointer hover:-translate-y-2 transition-all duration-300">
                  <div className="w-14 h-14 bg-navy dark:bg-gold text-gold dark:text-navy rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Landmark className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-serif font-bold text-navy dark:text-white mb-3">National Registry</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 leading-relaxed">Official directory of political leadership and security forces.</p>
                  <div className="flex items-center text-xs font-bold text-gold uppercase tracking-widest group-hover:gap-2 transition-all">Explore Registry <ArrowRight className="w-4 h-4 ml-1" /></div>
                </div>
                <div onClick={() => navigateTo('business-archive', '/business')} className="group bg-white dark:bg-navy-light p-8 rounded-sm shadow-2xl border border-gray-100 dark:border-navy cursor-pointer hover:-translate-y-2 transition-all duration-300 border-t-4 border-t-gold">
                  <div className="w-14 h-14 bg-gold text-navy rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Briefcase className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-serif font-bold text-navy dark:text-white mb-3">{sectorConfigs.business.title}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 leading-relaxed">{sectorConfigs.business.desc}</p>
                  <div className="flex items-center text-xs font-bold text-gold uppercase tracking-widest group-hover:gap-2 transition-all">Explore Business <ArrowRight className="w-4 h-4 ml-1" /></div>
                </div>
                <div onClick={() => navigateTo('arts-culture-archive', '/culture')} className="group bg-white dark:bg-navy-light p-8 rounded-sm shadow-2xl border border-gray-100 dark:border-navy cursor-pointer hover:-translate-y-2 transition-all duration-300">
                  <div className="w-14 h-14 bg-navy dark:bg-white text-white dark:text-navy rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Palette className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-serif font-bold text-navy dark:text-white mb-3">{sectorConfigs.arts_culture.title}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 leading-relaxed">{sectorConfigs.arts_culture.desc}</p>
                  <div className="flex items-center text-xs font-bold text-gold uppercase tracking-widest group-hover:gap-2 transition-all">Explore Culture <ArrowRight className="w-4 h-4 ml-1" /></div>
                </div>
              </div>
            </section>

            <section className="max-w-6xl mx-auto px-4 py-12 border-b border-gray-200 dark:border-gray-700 text-gray-800">
              <div className="flex justify-between items-end mb-8 border-b border-gray-200 dark:border-gray-700 pb-4">
                <h2 className="text-3xl font-serif font-bold text-navy dark:text-white flex items-center">
                  Featured Dossiers
                  <span className="ml-4 bg-gold/10 text-gold text-sm px-3 py-1 rounded-full border border-gold/20 font-sans tracking-widest">
                    {profiles.length > 0 ? `${profiles.length}+ RECORDS` : 'VERIFYING...'}
                  </span>
                </h2>
              </div>
              {isLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin h-10 w-10 text-gold" /></div>
              ) : (
                <div className="space-y-12">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-gray-800">
                    {displayedProfiles.filter(Boolean).map((profile) => (
                      <ProfileCard 
                        key={profile.id} 
                        profile={profile} 
                        onClick={handleProfileClick} 
                        onVerify={(e) => { e.stopPropagation(); setSelectedProfile(profile); setShowCertificate(true); }} 
                      />
                    ))}
                  </div>
                  {filteredProfiles.length > displayLimit && (
                    <div className="flex justify-center pt-8">
                      <button 
                        onClick={() => setDisplayLimit(prev => prev + 12)}
                        className="group flex items-center space-x-2 bg-navy text-white px-10 py-3 rounded-sm font-bold shadow-xl hover:bg-navy-light transition-all border border-gold/20"
                      >
                        <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-700" />
                        <span>LOAD MORE RECORDS</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </section>
          </>
        ) : (
          <div className="max-w-5xl mx-auto px-4 py-12 animate-fade-in text-gray-800">
            <button onClick={handleBack} className="group flex items-center text-navy dark:text-gold font-medium mb-8 hover:text-gold transition-colors"><ChevronLeft className="h-5 w-5 mr-1" />{t.back_directory}</button>
            {selectedProfile && selectedProfile.locked ? (<ArchivistWorkDesk />) : selectedProfile ? (
              <div className="bg-white dark:bg-navy shadow-xl rounded-sm overflow-hidden mb-12">
                <div className="h-48 relative bg-navy"><div className="absolute inset-0 bg-black/20"></div></div>
                <div className="px-8 pb-12">
                    <div className="relative flex justify-between items-end -mt-20 mb-8"><div className="relative"><img src={selectedProfile?.imageUrl || 'https://via.placeholder.com/150'} className="w-40 h-40 object-cover rounded-sm border-4 border-white shadow-md" />{selectedProfile?.verified && (<div className="absolute -bottom-3 -right-3 bg-white p-1 rounded-full shadow-sm cursor-pointer hover:scale-110 transition-transform" onClick={() => setShowCertificate(true)}>{getVerificationIcon(selectedProfile?.verificationLevel)}</div>)}</div></div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 text-gray-800">
                        <div className="lg:col-span-2">
                            <div className="mb-8"><div className="flex flex-wrap items-center gap-3 mb-4"><span className="text-sm font-bold tracking-widest uppercase text-gold">{selectedProfile?.category}</span></div><h1 className="text-4xl font-serif font-bold text-navy dark:text-white mb-2">{selectedProfile?.name}</h1><p className="text-xl text-gray-500 dark:text-gray-400 font-light">{selectedProfile?.title}</p></div>
                            <div className="prose prose-slate max-w-none text-gray-800"><h3 className="text-navy dark:text-gold font-serif text-xl border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">{t.about}</h3><p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg whitespace-pre-line">{selectedProfile?.fullBio}</p></div>
                            <div className="mt-12 text-gray-800"><h3 className="text-navy dark:text-gold font-serif text-xl border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">{t.timeline}</h3><Timeline events={selectedProfile?.timeline || []} /></div>
                            
                            <div className="mt-16 text-gray-800">
                                <div className="flex border-b border-gray-100 dark:border-gray-700 mb-8 overflow-x-auto space-x-8">
                                    {['archive', 'news', 'podcast'].map((tab) => (
                                        <button key={tab} onClick={() => setActiveTab(tab as any)} className={`pb-4 text-xs font-bold tracking-[0.2em] uppercase transition-all relative ${activeTab === tab ? 'text-navy dark:text-gold' : 'text-gray-300 hover:text-gray-500'}`}>{tab === 'archive' ? t.tab_archive : tab === 'news' ? t.tab_news : t.tab_podcast}{activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-navy dark:bg-gold"></div>}</button>
                                    ))}
                                </div>
                                <div className="animate-fade-in min-h-[200px] text-gray-800">
                                    {activeTab === 'archive' && (<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{(selectedProfile?.archives || []).length > 0 ? selectedProfile?.archives?.map((item) => (<a key={item.id} href={item.url || '#'} target="_blank" className="group flex items-center p-4 bg-slate dark:bg-navy-light rounded-sm border border-transparent hover:border-gold transition-all"><div className="p-3 bg-white dark:bg-navy rounded text-gold mr-4">{item.type === 'PDF' ? <FileText className="w-6 h-6" /> : <ImageIcon className="w-6 h-6" />}</div><div className="flex-1 min-w-0"><h4 className="text-sm font-bold text-navy dark:text-white truncate">{item.title}</h4><p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">{item.date}</p></div><ExternalLink className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100" /></a>)) : <div className="col-span-2 py-12 text-center text-gray-400 italic">{t.no_docs}</div>}</div>)}
                                    {activeTab === 'news' && (<div className="space-y-4">{(selectedProfile?.news || []).length > 0 ? selectedProfile?.news?.map((item) => (<div key={item.id} className="p-5 bg-white dark:bg-navy-light border border-gray-100 dark:border-gray-700 rounded-sm hover:shadow-lg transition-all group"><div className="flex justify-between items-start mb-3"><span className="text-[10px] font-bold text-gold uppercase bg-gold/10 px-2 py-0.5 rounded">{item.source}</span><span className="text-[10px] font-mono text-gray-400">{item.date}</span></div><h4 className="text-lg font-serif font-bold text-navy dark:text-white mb-2 group-hover:text-gold transition-colors">{item.title}</h4><p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-4">{item.summary}</p>{item.url && <a href={item.url} target="_blank" className="inline-flex items-center text-[10px] font-bold text-navy dark:text-gold uppercase hover:underline"><Globe className="w-3 h-3 mr-1" /> {t.search_btn}</a>}</div>)) : <div className="py-12 text-center text-gray-400 italic">{t.no_news}</div>}</div>)}
                                    {activeTab === 'podcast' && (<div className="grid grid-cols-1 gap-3">{(selectedProfile?.podcasts || []).length > 0 ? selectedProfile?.podcasts?.map((item) => (<div key={item.id} className="flex items-center p-4 bg-navy dark:bg-navy-light text-white rounded-sm group hover:bg-navy-light transition-all shadow-xl border border-gold/10"><div className="p-3 bg-gold rounded-full mr-4 text-navy"><Play className="w-5 h-5 fill-current" /></div><div className="flex-1 min-w-0"><h4 className="text-sm font-bold truncate tracking-wide">{item.title}</h4><p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">{item.source} • {item.duration}</p></div><div className="flex items-center space-x-3 opacity-40"><Headphones className="w-4 h-4" /><span className="text-[10px] font-mono">{item.date}</span></div></div>)) : <div className="py-12 text-center text-gray-400 italic">{t.no_podcasts}</div>}</div>)}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6 text-gray-800">
                            <div className="bg-slate dark:bg-navy-light p-6 rounded-sm border border-gray-200 dark:border-navy">
                                <h4 className="font-serif font-bold text-navy dark:text-white mb-4">{t.key_info}</h4>
                                <div className="space-y-4 text-sm text-gray-800">
                                    <div className="flex items-center"><Calendar className="h-5 w-5 mr-3 text-gold" /><div><span className="block text-gray-400 text-xs uppercase">{selectedProfile?.isOrganization ? t.lbl_est : t.lbl_born}</span><span className="font-medium text-gray-800">{selectedProfile?.dateStart || 'Unknown'}</span></div></div>
                                    
                                    {selectedProfile?.dateEnd && (
                                      <div className="flex items-center">
                                        <Clock className="h-5 w-5 mr-3 text-gold" />
                                        <div>
                                          <span className="block text-gray-400 text-xs uppercase">{selectedProfile.isOrganization ? t.lbl_closed : t.lbl_died}</span>
                                          <span className="font-medium text-gray-800">{selectedProfile.dateEnd}</span>
                                        </div>
                                      </div>
                                    )}

                                    <div className="flex items-center"><Activity className="h-5 w-5 mr-3 text-gold" /><div><span className="block text-gray-400 text-xs uppercase">{t.lbl_status}</span><span className={`font-medium px-2 py-0.5 rounded text-xs inline-block mt-0.5 ${selectedProfile?.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{getStatusLabel(selectedProfile?.status || 'ACTIVE')}</span></div></div>
                                    <div className="w-full h-px bg-gray-200 dark:bg-gray-700 my-2"></div>
                                    <div className="flex items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-navy p-1 rounded transition-colors" onClick={() => setShowCertificate(true)}><Building2 className="h-5 w-5 mr-3 text-gold" /><div><span className="block text-gray-400 text-xs uppercase">{t.label_affiliation}</span><span className="font-medium text-gray-800 dark:text-gray-200 underline decoration-dotted">{getVerificationLabel(selectedProfile?.verificationLevel)}</span></div></div>
                                    <h5 className="font-serif font-bold text-navy dark:text-white text-sm mt-6 mb-2">{t.archive_positions}</h5>
                                    {(selectedProfile?.archiveAssignments || []).length > 0 ? (
                                      <ul className="space-y-3">{selectedProfile?.archiveAssignments?.map((assignment, idx) => (<li key={idx} className="flex flex-col text-xs text-gray-600 dark:text-gray-300 border-l-2 border-gold pl-2"><span className="font-bold text-navy dark:text-white">{assignment.title_note}</span><span className="text-gray-500 dark:text-gray-400 text-[10px] italic">({assignment.category?.category_name || 'N/A'})</span>{assignment.start_date && <span className="text-[10px] font-mono mt-0.5">{assignment.start_date} - {assignment.end_date || 'Present'}</span>}</li>))}</ul>
                                    ) : <p className="text-gray-400 italic text-xs">{t.no_archive_positions}</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
              </div>
            ) : <div className="text-center py-20 text-gray-400 italic">No profile selected.</div>}
          </div>
        )}

        {/* Partners Section (Screenshot Inspired) */}
        <section className="bg-navy py-16 border-t border-gold/20 overflow-hidden">
          <div className="max-w-6xl mx-auto px-4">
             <div className="flex flex-col items-center mb-10">
                <h2 className="text-2xl font-serif font-bold text-white mb-2 uppercase tracking-widest relative inline-block">
                   Our Partners
                   <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-white/20"></div>
                </h2>
             </div>
             
             <div className="bg-white p-8 md:p-12 rounded-sm shadow-2xl flex flex-wrap justify-center items-center gap-12 md:gap-20">
                {partners.length > 0 ? partners.map((p) => (
                  <div key={p.id} className="h-12 md:h-16 flex items-center justify-center filter grayscale hover:grayscale-0 transition-all duration-500 opacity-80 hover:opacity-100 transform hover:scale-105" title={p.name}>
                    <img src={p.logo_url} alt={p.name} className="max-h-full max-w-[180px] object-contain" />
                  </div>
                )) : (
                  <p className="text-gray-300 italic text-sm">Partners Registry Loading...</p>
                )}
             </div>
          </div>
        </section>
      </main>

      <footer className="bg-navy text-white pt-16 pb-8 border-t border-gold/10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="space-y-4">
              <div className="flex items-center space-x-2 cursor-pointer" onClick={handleBack}>
                <BrandPin className="h-6 w-6 text-gold" />
                <span className="text-xl font-serif font-bold">SomaliPin</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">{t.footer_desc}</p>
            </div>
          </div>
          <div className="border-t border-white/5 pt-8 text-center text-[10px] text-gray-500 uppercase tracking-widest">
            <p>&copy; {new Date().getFullYear()} {t.rights}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
