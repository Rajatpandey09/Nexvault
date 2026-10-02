'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Search,
  Sparkles,
  FileText,
  FileImage,
  StickyNote,
  Link as LinkIcon,
  Filter,
  X,
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { translations } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/utils/helpers';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';

interface SearchResult {
  id: string;
  type: 'file' | 'note' | 'link';
  title: string;
  snippet?: string;
  created_at: string;
  match_field?: string;
}

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language, user } = useAppStore();
  const t = translations[language];

  const [searchQuery, setSearchQuery] = useState(searchParams?.get('q') || '');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    files: true,
    notes: true,
    links: true,
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const query = searchParams?.get('q');
    if (query) {
      setSearchQuery(query);
      performSearch(query);
    }
  }, [searchParams]);

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const searchResults: SearchResult[] = [];

      // Search files
      if (filters.files) {
        const { data: files } = await supabase
          .from('files')
          .select('id, original_filename, extracted_text, created_at')
          .eq('user_id', user?.id)
          .eq('is_deleted', false)
          .or(`original_filename.ilike.%${query}%,extracted_text.ilike.%${query}%`);

        if (files) {
          searchResults.push(
            ...files.map((f) => ({
              id: f.id,
              type: 'file' as const,
              title: f.original_filename,
              snippet: f.extracted_text?.substring(0, 150),
              created_at: f.created_at,
              match_field: f.original_filename.toLowerCase().includes(query.toLowerCase())
                ? 'filename'
                : 'content',
            }))
          );
        }
      }

      // Search notes
      if (filters.notes) {
        const { data: notes } = await supabase
          .from('notes')
          .select('id, title, content, created_at')
          .eq('user_id', user?.id)
          .eq('is_deleted', false)
          .or(`title.ilike.%${query}%,content.ilike.%${query}%`);

        if (notes) {
          searchResults.push(
            ...notes.map((n) => ({
              id: n.id,
              type: 'note' as const,
              title: n.title,
              snippet: n.content.substring(0, 150),
              created_at: n.created_at,
              match_field: n.title.toLowerCase().includes(query.toLowerCase())
                ? 'title'
                : 'content',
            }))
          );
        }
      }

      // Search links
      if (filters.links) {
        const { data: links } = await supabase
          .from('links')
          .select('id, title, url, description, created_at')
          .eq('user_id', user?.id)
          .eq('is_deleted', false)
          .or(`title.ilike.%${query}%,url.ilike.%${query}%,description.ilike.%${query}%`);

        if (links) {
          searchResults.push(
            ...links.map((l) => ({
              id: l.id,
              type: 'link' as const,
              title: l.title,
              snippet: l.description || l.url,
              created_at: l.created_at,
              match_field: 'title',
            }))
          );
        }
      }

      // Sort by relevance (can be enhanced with better scoring)
      setResults(
        searchResults.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      );
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/dashboard/search?q=${encodeURIComponent(searchQuery)}`);
      performSearch(searchQuery);
    }
  };

  const getIcon = (type: string) => {
    if (type === 'file') return FileText;
    if (type === 'note') return StickyNote;
    if (type === 'link') return LinkIcon;
    return FileText;
  };

  const getIconColor = (type: string) => {
    if (type === 'file') return 'text-vault-accent-blue';
    if (type === 'note') return 'text-amber-400';
    if (type === 'link') return 'text-cyan-400';
    return 'text-vault-accent-blue';
  };

  const getBgColor = (type: string) => {
    if (type === 'file') return 'from-vault-accent-blue/20 to-vault-accent-purple/20 border-vault-accent-blue/30';
    if (type === 'note') return 'from-amber-500/20 to-amber-600/20 border-amber-500/30';
    if (type === 'link') return 'from-cyan-500/20 to-cyan-600/20 border-cyan-500/30';
    return 'from-vault-accent-blue/20 to-vault-accent-purple/20 border-vault-accent-blue/30';
  };

  const navigateToItem = (result: SearchResult) => {
    if (result.type === 'file') router.push(`/dashboard/files?id=${result.id}`);
    else if (result.type === 'note') router.push(`/dashboard/notes?id=${result.id}`);
    else if (result.type === 'link') router.push(`/dashboard/links?id=${result.id}`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Hero Search */}
      <div className="glass-strong rounded-3xl border border-vault-border-medium p-8">
        <div className="flex items-center gap-3 mb-6">
          <Sparkles className="w-8 h-8 text-vault-accent-blue" />
          <h1 className="text-3xl font-bold text-white">
            {language === 'en' ? 'Finder' : 'Finder'}
          </h1>
        </div>

        <form onSubmit={handleSearch}>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                language === 'en'
                  ? 'Search across files, notes, and links...'
                  : 'फ़ाइलों, नोट्स और लिंक में खोजें...'
              }
              className="w-full pl-14 pr-4 py-4 bg-white/5 border border-vault-border-medium rounded-2xl text-white text-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-vault-accent-blue/50 focus:border-vault-accent-blue focus:bg-white/8 transition-all"
              autoFocus
            />
          </div>
        </form>

        {/* Filters */}
        <div className="flex items-center gap-3 mt-4">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-vault-border-subtle hover:border-vault-border-medium transition-all text-sm text-gray-300"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>

          {showFilters && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFilters({ ...filters, files: !filters.files })}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                  filters.files
                    ? 'bg-vault-accent-blue text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                Files
              </button>
              <button
                type="button"
                onClick={() => setFilters({ ...filters, notes: !filters.notes })}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                  filters.notes
                    ? 'bg-amber-500 text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                Notes
              </button>
              <button
                type="button"
                onClick={() => setFilters({ ...filters, links: !filters.links })}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                  filters.links
                    ? 'bg-cyan-500 text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                Links
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      {!searchQuery.trim() ? (
        <EmptyState
          icon={Search}
          title={language === 'en' ? 'Start searching' : 'खोजना शुरू करें'}
          description={
            language === 'en'
              ? 'Enter keywords to find files, notes, and links in your vault.'
              : 'अपनी vault में फ़ाइलें, नोट्स और लिंक खोजने के लिए keywords दर्ज करें।'
          }
        />
      ) : loading ? (
        <div className="space-y-3">
          <LoadingSkeleton type="list" count={5} />
        </div>
      ) : results.length === 0 ? (
        <EmptyState
          icon={Search}
          title={t.noResults}
          description={t.searchSuggestions}
        />
      ) : (
        <div className="surface-elevated rounded-2xl p-6">
          <p className="text-sm text-gray-400 mb-4">
            {results.length} {language === 'en' ? 'results found' : 'परिणाम मिले'}
          </p>
          <div className="space-y-3">
            {results.map((result) => {
              const Icon = getIcon(result.type);
              return (
                <div
                  key={`${result.type}-${result.id}`}
                  onClick={() => navigateToItem(result)}
                  className="flex items-start gap-4 p-4 rounded-xl hover:bg-white/5 transition-all cursor-pointer border border-transparent hover:border-vault-border-subtle"
                >
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getBgColor(result.type)} border flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${getIconColor(result.type)}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-medium truncate">{result.title}</h3>
                      <span className="px-2 py-0.5 rounded-full text-xs bg-white/5 text-gray-400 capitalize">
                        {result.type}
                      </span>
                    </div>
                    {result.snippet && (
                      <p className="text-sm text-gray-400 truncate-2-lines">{result.snippet}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      {result.match_field && (
                        <span className="text-xs text-vault-accent-blue">
                          Matched in {result.match_field}
                        </span>
                      )}
                      <span className="text-xs text-gray-600">•</span>
                      <span className="text-xs text-gray-500">{formatDate(result.created_at)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
