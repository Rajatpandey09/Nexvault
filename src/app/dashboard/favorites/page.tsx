'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Star, FileText, StickyNote, Link as LinkIcon, Download, Trash2 } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { translations } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { formatDate, formatFileSize } from '@/utils/helpers';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import { useToast } from '@/components/ui/ToastContainer';

interface FavoriteItem {
  id: string;
  type: 'file' | 'note' | 'link';
  title: string;
  subtitle?: string;
  created_at: string;
  size?: number;
}

export default function FavoritesPage() {
  const router = useRouter();
  const { language, user } = useAppStore();
  const t = translations[language];
  const { showToast } = useToast();

  const [items, setItems] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user]);

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const favorites: FavoriteItem[] = [];

      // Fetch favorite files
      const { data: files } = await supabase
        .from('files')
        .select('id, original_filename, size, created_at')
        .eq('user_id', user?.id)
        .eq('is_deleted', false)
        .eq('is_favorite', true);

      if (files) {
        favorites.push(
          ...files.map((f) => ({
            id: f.id,
            type: 'file' as const,
            title: f.original_filename,
            subtitle: formatFileSize(f.size),
            created_at: f.created_at,
            size: f.size,
          }))
        );
      }

      // Fetch favorite notes
      const { data: notes } = await supabase
        .from('notes')
        .select('id, title, content, created_at')
        .eq('user_id', user?.id)
        .eq('is_deleted', false)
        .eq('is_favorite', true);

      if (notes) {
        favorites.push(
          ...notes.map((n) => ({
            id: n.id,
            type: 'note' as const,
            title: n.title,
            subtitle: n.content.substring(0, 60) + '...',
            created_at: n.created_at,
          }))
        );
      }

      // Fetch favorite links
      const { data: links } = await supabase
        .from('links')
        .select('id, title, url, created_at')
        .eq('user_id', user?.id)
        .eq('is_deleted', false)
        .eq('is_favorite', true);

      if (links) {
        favorites.push(
          ...links.map((l) => ({
            id: l.id,
            type: 'link' as const,
            title: l.title,
            subtitle: new URL(l.url).hostname.replace('www.', ''),
            created_at: l.created_at,
          }))
        );
      }

      // Sort by created_at
      setItems(
        favorites.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      );
    } catch (error) {
      console.error('Error fetching favorites:', error);
      showToast('error', 'Failed to load favorites');
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (item: FavoriteItem) => {
    try {
      const table = item.type === 'file' ? 'files' : item.type === 'note' ? 'notes' : 'links';
      const { error } = await supabase
        .from(table)
        .update({ is_favorite: false })
        .eq('id', item.id);

      if (error) throw error;

      setItems((prev) => prev.filter((i) => i.id !== item.id));
      showToast('success', 'Removed from favorites');
    } catch (error) {
      showToast('error', 'Failed to remove favorite');
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
    if (type === 'file')
      return 'from-vault-accent-blue/20 to-vault-accent-purple/20 border-vault-accent-blue/30';
    if (type === 'note') return 'from-amber-500/20 to-amber-600/20 border-amber-500/30';
    if (type === 'link') return 'from-cyan-500/20 to-cyan-600/20 border-cyan-500/30';
    return 'from-vault-accent-blue/20 to-vault-accent-purple/20 border-vault-accent-blue/30';
  };

  const navigateToItem = (item: FavoriteItem) => {
    if (item.type === 'file') router.push(`/dashboard/files?id=${item.id}`);
    else if (item.type === 'note') router.push(`/dashboard/notes?id=${item.id}`);
    else if (item.type === 'link') router.push(`/dashboard/links?id=${item.id}`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">{t.favorites}</h1>
        <p className="text-gray-400">
          {items.length}{' '}
          {language === 'en' ? 'starred items in your vault' : 'स्टार किए गए आइटम'}
        </p>
      </div>

      {/* Favorites List */}
      {loading ? (
        <div className="space-y-3">
          <LoadingSkeleton type="list" count={6} />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Star}
          title={language === 'en' ? 'No favorites yet' : 'अभी तक कोई पसंदीदा नहीं'}
          description={
            language === 'en'
              ? 'Star files, notes, and links to quickly access them here.'
              : 'फ़ाइलों, नोट्स और लिंक को स्टार करें और उन्हें यहाँ तुरंत एक्सेस करें।'
          }
        />
      ) : (
        <div className="surface-elevated rounded-2xl p-6">
          <div className="space-y-3">
            {items.map((item) => {
              const Icon = getIcon(item.type);
              return (
                <div
                  key={`${item.type}-${item.id}`}
                  onClick={() => navigateToItem(item)}
                  className="flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 transition-all cursor-pointer border border-transparent hover:border-vault-border-subtle group"
                >
                  <div
                    className={`w-12 h-12 rounded-lg bg-gradient-to-br ${getBgColor(
                      item.type
                    )} border flex items-center justify-center flex-shrink-0`}
                  >
                    <Icon className={`w-6 h-6 ${getIconColor(item.type)}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-medium truncate">{item.title}</h3>
                      <span className="px-2 py-0.5 rounded-full text-xs bg-white/5 text-gray-400 capitalize">
                        {item.type}
                      </span>
                    </div>
                    {item.subtitle && (
                      <p className="text-sm text-gray-400 truncate">{item.subtitle}</p>
                    )}
                    <span className="text-xs text-gray-500">{formatDate(item.created_at)}</span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFavorite(item);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-yellow-400 hover:bg-white/5 transition-all"
                  >
                    <Star className="w-5 h-5" fill="currentColor" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
