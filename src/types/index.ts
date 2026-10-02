export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface VaultFile {
  id: string;
  user_id: string;
  filename: string;
  original_filename: string;
  mime_type: string;
  extension: string;
  size: number;
  hash: string;
  storage_path: string;
  extracted_text?: string;
  extraction_status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
  is_favorite: boolean;
  is_deleted: boolean;
  deleted_at?: string;
}

export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string;
  description?: string;
  created_at: string;
  updated_at: string;
  is_favorite: boolean;
  is_deleted: boolean;
  deleted_at?: string;
}

export interface Link {
  id: string;
  user_id: string;
  url: string;
  title: string;
  description?: string;
  created_at: string;
  is_favorite: boolean;
  is_deleted: boolean;
  deleted_at?: string;
  favicon_url?: string;
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface ItemTag {
  id: string;
  tag_id: string;
  item_id: string;
  item_type: 'file' | 'note' | 'link';
  created_at: string;
}

export interface SearchResult {
  id: string;
  type: 'file' | 'note' | 'link';
  title: string;
  description?: string;
  snippet?: string;
  tags: string[];
  created_at: string;
  is_favorite: boolean;
  relevance_score?: number;
  match_type?: 'exact' | 'semantic' | 'related';
}

export interface StorageStats {
  total_files: number;
  total_size: number;
  quota: number;
  used_percentage: number;
  documents: number;
  images: number;
  notes: number;
  links: number;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  item_type: 'file' | 'note' | 'link';
  item_id: string;
  item_name: string;
  created_at: string;
}

export type Language = 'en' | 'hi';

export type Theme = 'light' | 'dark' | 'system';

export interface UserSettings {
  language: Language;
  theme: Theme;
  ai_enabled: boolean;
  voice_enabled: boolean;
}
