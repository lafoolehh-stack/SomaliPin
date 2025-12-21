
export enum Category {
    POLITICS = 'Politics',
    BUSINESS = 'Business',
    HISTORY = 'History',
    ARTS = 'Arts & Culture'
  }
  
  export enum VerificationLevel {
    NOBEL = 'Nobel',   // Highest Honor/Nobel Level
    GOLDEN = 'Golden', // High-level elite
    HERO = 'Hero',     // Martyrs and Heroes (Halgamaayaal)
    STANDARD = 'Standard' // Standard verification
  }

  export type Language = 'en' | 'so' | 'ar';

  export type ProfileStatus = 'ACTIVE' | 'DECEASED' | 'RETIRED' | 'CLOSED';

  export interface TimelineEvent {
    year: string;
    title: string;
    description: string;
  }
  
  export interface ArchiveItem {
    id: string;
    type: 'PDF' | 'IMAGE' | 'AWARD';
    title: string;
    date: string;
    size?: string;
    url?: string; 
  }
  
  export interface NewsItem {
    id: string;
    title: string;
    source: string;
    date: string;
    summary: string;
    url?: string; 
  }

  export interface PodcastItem {
    id: string;
    title: string;
    date: string;
    duration: string;
    source: string; 
    url?: string;
  }
  
  export interface InfluenceStats {
    support: number; 
    neutral: number;
    opposition: number;
  }

  export enum SectionType {
    POLITICS = 'POLITICS',
    JUDICIARY = 'JUDICIARY',
    SECURITY = 'SECURITY',
    BUSINESS = 'BUSINESS',
    ARTS_CULTURE = 'ARTS_CULTURE'
  }

  export interface ArchiveCategory {
    id: number;
    category_name: string;
    section_type: SectionType;
  }

  export interface ArchiveAssignment {
    id: number;
    user_id: string; 
    category_id: number;
    start_date: string;
    end_date?: string;
    title_note: string;
    category?: ArchiveCategory; 
  }

  export interface Profile {
    id: string;
    name: string;
    title: string;
    category: string; 
    categoryLabel?: string; 
    verified: boolean;
    verificationLevel?: VerificationLevel;
    imageUrl: string;
    shortBio: string;
    fullBio: string;
    timeline: TimelineEvent[];
    location?: string;
    archives?: ArchiveItem[];
    news?: NewsItem[];
    podcasts?: PodcastItem[];
    influence?: InfluenceStats;
    isOrganization: boolean;
    status: ProfileStatus;
    dateStart: string; 
    dateEnd?: string;
    locked?: boolean; 
    archiveAssignments?: ArchiveAssignment[]; 
  }

  export interface DossierDB {
    id: string;
    created_at?: string;
    full_name: string;
    role: string;
    bio: string;
    status: 'Verified' | 'Unverified';
    reputation_score: number;
    image_url: string;
    category: string;
    verification_level: string;
    details: any; 
  }
  
  export interface SearchResult {
    query: string;
    profiles: Profile[];
    aiSummary?: string;
  }
