'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, FileText, StickyNote, Link as LinkIcon } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { translations } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { formatDate, formatFileSize } from '@/utils/helpers';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import { useToast } from '@/components/ui/ToastContainer';

interface RecentItem {
  id: string;
  type: 'file' | 'note' | 'link';
  title: string;
  subtitle?: string;
  accessed_at: string;
  created_at: string;
}

export default function RecentPage() {
  const router = useRouter();
  const { language, user } = useAppStore();
  const t = translations[language];
  const { showToast } = useToast();

  const [items, setItems] = useState<RecentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchRecent();
    }
  }, [user]);

  const fetchRecent = async () => {
    setLoading(true);
    try {
      const recentItems: RecentItem[] = [];

      // Fetch recent files
      const { data: files } = await supabase
        .from('files')
        .select('id, original_filename, size, accessed_at, created_at')
        .eq('user_id', user?.id)
        .eq('is_deleted', false)
        .order('accessed_at', { ascending: false })
        .limit(20);

      if (files) {
        recentItems.push(
          ...files.map((f) => ({
            id: f.id,
            type: 'file' as const,
            title: f.original_filename,
            subtitle: formatFileSize(f.size),
            accessed_at: f.accessed_at,
            created_at: f.created_at,
          }))
        );
      }

      // Fetch recent notes
      const { data: notes } = await supabase
        .from('notes')
        .select('id, title, content, accessed_at, created_at')
        .eq('user_id', user?.id)
        .eq('is_deleted', false)
        .order('accessed_at', { ascending: false })
        .limit(20);

      if (notes) {
        recentItems.push(
          ...notes.map((n) => ({
            id: n.id,
            type: 'note' as const,
            title: n.title,
            subtitle: n.content.substring(0, 60) + '...',
            accessed_at: n.accessed_at,
            created_at: n.created_at,
          }))
        );
      }

      // Fetch recent links
      const { data: links } = await supabase
        .from('links')
        .select('id, title, url, accessed_at, created_at')
        .eq('user_id', user?.id)
        .eq('is_deleted', false)
        .order('accessed_at', { ascending: false })
        .limit(20);

      if (links) {
        recentItems.push(
          ...links.map((l) => ({
            id: l.id,
            type: 'link' as const,
            title: l.title,
            subtitle: new URL(l.url).hostname.replace('www.', ''),
            accessed_at: l.accessed_at,
            created_at: l.created_at,
          }))
        );
      }

      // Sort by accessed_at
      setItems(
        recentItems
          .sort((a, b) => new Date(b.accessed_at).getTime() - new Date(a.accessed_at).getTime())
          .slice(0, 50)
      );
    } catch (error) {
      console.error('Error fetching recent items:', error);
      showToast('error', 'Failed to load recent items');
    } finally {
      setLoading(false);
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

  const navigateToItem = (item: RecentItem) => {
    if (item.type === 'file') router.push(`/dashboard/files?id=${item.id}`);
    else if (item.type === 'note') router.push(`/dashboard/notes?id=${item.id}`);
    else if (item.type === 'link') router.push(`/dashboard/links?id=${item.id}`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">{t.recent}</h1>
        <p className="text-gray-400">
          {language === 'en'
            ? 'Recently accessed items from your vault'
            : 'हाल ही में एक्सेस किए गए आइटम'}
        </p>
      </div>

      {/* Recent Items List */}
      {loading ? (
        <div className="space-y-3">
          <LoadingSkeleton type="list" count={10} />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Clock}
          title={language === 'en' ? 'No recent activity' : 'कोई हालिया गतिविधि नहीं'}
          description={
            language === 'en'
              ? 'Items you access will appear here for quick reference.'
              : 'जो आइटम आप एक्सेस करते हैं वे त्वरित संदर्भ के लिए यहां दिखाई देंगे।'
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
                  className="flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 transition-all cursor-pointer border border-transparent hover:border-vault-border-subtle"
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
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="w-3 h-3 text-gray-500" />
                      <span className="text-xs text-gray-500">
                        {formatDate(item.accessed_at)}
                      </span>
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
