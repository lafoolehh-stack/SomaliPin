
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
    url?: string; // Added URL field for file links
  }
  
  export interface NewsItem {
    id: string;
    title: string;
    source: string;
    date: string;
    summary: string;
    url?: string; // Added URL field for news links
  }

  export interface PodcastItem {
    id: string;
    title: string;
    date: string;
    duration: string;
    source: string; // e.g. "Daljir", "BBC"
    url?: string;
  }
  
  export interface InfluenceStats {
    support: number; // Percentage
    neutral: number;
    opposition: number;
  }

  // New interfaces for Archive structure
  export enum SectionType {
    POLITICS = 'POLITICS',
    JUDICIARY = 'JUDICIARY',
    SECURITY = 'SECURITY'
  }

  export interface ArchiveCategory {
    id: number;
    category_name: string;
    section_type: SectionType;
  }

  export interface ArchiveAssignment {
    id: number;
    user_id: string; // Corresponds to Profile.id
    category_id: number;
    start_date: string;
    end_date?: string;
    title_note: string;
    category?: ArchiveCategory; // Joined category details
  }

  // Frontend Profile Interface
  export interface Profile {
    id: string;
    name: string;
    title: string;
    category: string; // Changed from Category enum to string to allow manual input
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
    locked?: boolean; // Existing field for security/locking
    archiveAssignments?: ArchiveAssignment[]; // New field for structured archive positions
  }

  // Supabase Database Row Interface
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
    details: any; // JSONB column for extra fields
  }
  
  export interface SearchResult {
    query: string;
    profiles: Profile[];
    aiSummary?: string;
  }