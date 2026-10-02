'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  FileImage,
  StickyNote,
  Link as LinkIcon,
  HardDrive,
  TrendingUp,
  Search,
  Upload,
  Clock,
  Star,
  Sparkles,
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { translations } from '@/lib/i18n';
import { formatFileSize, formatDate } from '@/utils/helpers';
import { supabase } from '@/lib/supabase';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';

interface RecentItem {
  id: string;
  type: 'file' | 'note' | 'link';
  name: string;
  created_at: string;
  accessed_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { language, user } = useAppStore();
  const t = translations[language];

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalItems: 0,
    documents: 0,
    images: 0,
    notes: 0,
    links: 0,
    storageUsed: 0,
    storageQuota: 1073741824, // 1 GB
  });
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch file stats
      const { data: files } = await supabase
        .from('files')
        .select('mime_type, size')
        .eq('user_id', user?.id)
        .eq('is_deleted', false);

      // Fetch notes count
      const { count: notesCount } = await supabase
        .from('notes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)
        .eq('is_deleted', false);

      // Fetch links count
      const { count: linksCount } = await supabase
        .from('links')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)
        .eq('is_deleted', false);

      // Calculate stats
      const documents = files?.filter(f =>
        f.mime_type.includes('pdf') ||
        f.mime_type.includes('document') ||
        f.mime_type.includes('text')
      ).length || 0;

      const images = files?.filter(f => f.mime_type.startsWith('image/')).length || 0;
      const totalSize = files?.reduce((sum, f) => sum + (f.size || 0), 0) || 0;
      const totalItems = (files?.length || 0) + (notesCount || 0) + (linksCount || 0);

      setStats({
        totalItems,
        documents,
        images,
        notes: notesCount || 0,
        links: linksCount || 0,
        storageUsed: totalSize,
        storageQuota: 1073741824,
      });

      // Fetch recent items (last 5 accessed)
      const recentFiles = await supabase
        .from('files')
        .select('id, original_filename, accessed_at, created_at')
        .eq('user_id', user?.id)
        .eq('is_deleted', false)
        .order('accessed_at', { ascending: false })
        .limit(3);

      const recentNotes = await supabase
        .from('notes')
        .select('id, title, accessed_at, created_at')
        .eq('user_id', user?.id)
        .eq('is_deleted', false)
        .order('accessed_at', { ascending: false })
        .limit(2);

      const items: RecentItem[] = [
        ...(recentFiles.data?.map(f => ({
          id: f.id,
          type: 'file' as const,
          name: f.original_filename,
          created_at: f.created_at,
          accessed_at: f.accessed_at,
        })) || []),
        ...(recentNotes.data?.map(n => ({
          id: n.id,
          type: 'note' as const,
          name: n.title,
          created_at: n.created_at,
          accessed_at: n.accessed_at,
        })) || []),
      ].sort((a, b) => new Date(b.accessed_at).getTime() - new Date(a.accessed_at).getTime()).slice(0, 5);

      setRecentItems(items);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const storagePercentage = (stats.storageUsed / stats.storageQuota) * 100;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero Section with Search */}
      <div className="glass-strong rounded-3xl border border-vault-border-medium p-8 lg:p-10">
        <div className="max-w-3xl">
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-3">
            {language === 'en' ? 'Your Knowledge Vault' : 'आपकी Knowledge Vault'}
          </h1>
          <p className="text-lg text-gray-400 mb-6">
            {language === 'en'
              ? 'Store, organize, and discover your personal knowledge with AI-powered intelligence.'
              : 'AI से संचालित बुद्धिमत्ता के साथ अपनी व्यक्तिगत जानकारी को संग्रहीत, व्यवस्थित और खोजें।'}
          </p>

          {/* Quick Search */}
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-vault-accent-blue transition-colors" />
            <input
              type="text"
              placeholder={t.search}
              onClick={() => router.push('/dashboard/search')}
              className="w-full pl-12 pr-4 py-4 bg-white/5 border border-vault-border-medium rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-vault-accent-blue/50 focus:border-vault-accent-blue focus:bg-white/8 transition-all cursor-pointer"
              readOnly
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <kbd className="px-2 py-1 text-xs bg-white/10 rounded border border-vault-border-subtle text-gray-400">⌘K</kbd>
            </div>
          </div>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stats - Small Cards */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {loading ? (
            <LoadingSkeleton type="stat" count={4} />
          ) : (
            <>
              <div className="stat-card group">
                <div className="stat-card-icon bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30">
                  <TrendingUp className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-gray-400 text-xs font-medium mb-1">{t.totalItems}</h3>
                <p className="text-2xl font-bold text-white">{stats.totalItems}</p>
              </div>

              <div className="stat-card group">
                <div className="stat-card-icon bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30">
                  <FileText className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-gray-400 text-xs font-medium mb-1">{t.documents}</h3>
                <p className="text-2xl font-bold text-white">{stats.documents}</p>
              </div>

              <div className="stat-card group">
                <div className="stat-card-icon bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30">
                  <FileImage className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-gray-400 text-xs font-medium mb-1">{t.images}</h3>
                <p className="text-2xl font-bold text-white">{stats.images}</p>
              </div>

              <div className="stat-card group">
                <div className="stat-card-icon bg-gradient-to-br from-amber-500/20 to-amber-600/20 border border-amber-500/30">
                  <StickyNote className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="text-gray-400 text-xs font-medium mb-1">{t.notes}</h3>
                <p className="text-2xl font-bold text-white">{stats.notes}</p>
              </div>
            </>
          )}
        </div>

        {/* Storage - Large Card */}
        <div className="glass-strong rounded-2xl border border-vault-border-medium p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-vault-accent-blue/20 to-vault-accent-purple/20 border border-vault-accent-blue/30 flex items-center justify-center">
              <HardDrive className="w-6 h-6 text-vault-accent-blue" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-semibold">{t.storageUsed}</h3>
              <p className="text-sm text-gray-400">
                {formatFileSize(stats.storageUsed)} of {formatFileSize(stats.storageQuota)}
              </p>
            </div>
          </div>
          <div className="mb-2">
            <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-vault-accent-blue to-vault-accent-cyan h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(storagePercentage, 100)}%` }}
              />
            </div>
          </div>
          <p className="text-right text-lg font-bold text-white">
            {storagePercentage.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Recent Items & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Items - Large */}
        <div className="lg:col-span-2 surface-elevated rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-vault-accent-blue" />
              <h2 className="text-xl font-bold text-white">{t.recentItems}</h2>
            </div>
          </div>

          {loading ? (
            <LoadingSkeleton type="list" count={3} />
          ) : recentItems.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title={t.emptyVault}
              description={language === 'en'
                ? 'Start building your knowledge vault by uploading files, creating notes, or saving links.'
                : 'फ़ाइलें अपलोड करके, नोट्स बनाकर, या लिंक सहेज कर अपनी vault बनाना शुरू करें।'
              }
              action={{
                label: t.addToVault,
                onClick: () => router.push('/dashboard/upload'),
              }}
            />
          ) : (
            <div className="space-y-3">
              {recentItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-all cursor-pointer border border-transparent hover:border-vault-border-subtle"
                  onClick={() => {
                    if (item.type === 'file') router.push(`/dashboard/files?id=${item.id}`);
                    else if (item.type === 'note') router.push(`/dashboard/notes?id=${item.id}`);
                  }}
                >
                  <div className="w-10 h-10 rounded-lg bg-vault-accent-blue/10 border border-vault-accent-blue/30 flex items-center justify-center flex-shrink-0">
                    {item.type === 'file' && <FileText className="w-5 h-5 text-vault-accent-blue" />}
                    {item.type === 'note' && <StickyNote className="w-5 h-5 text-amber-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{item.name}</p>
                    <p className="text-xs text-gray-500">{formatDate(item.accessed_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="surface-elevated rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/dashboard/upload')}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-vault-accent-blue/10 border border-vault-accent-blue/30 hover:bg-vault-accent-blue/20 transition-all text-left group"
            >
              <Upload className="w-5 h-5 text-vault-accent-blue group-hover:scale-110 transition-transform" />
              <div>
                <p className="text-white font-medium text-sm">{t.upload}</p>
                <p className="text-xs text-gray-400">Add files to vault</p>
              </div>
            </button>

            <button
              onClick={() => router.push('/dashboard/notes')}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-vault-border-subtle hover:bg-white/8 hover:border-vault-border-medium transition-all text-left group"
            >
              <StickyNote className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
              <div>
                <p className="text-white font-medium text-sm">{t.createNote}</p>
                <p className="text-xs text-gray-400">Write a new note</p>
              </div>
            </button>

            <button
              onClick={() => router.push('/dashboard/links')}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-vault-border-subtle hover:bg-white/8 hover:border-vault-border-medium transition-all text-left group"
            >
              <LinkIcon className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
              <div>
                <p className="text-white font-medium text-sm">{t.saveLink}</p>
                <p className="text-xs text-gray-400">Save a website</p>
              </div>
            </button>

            <button
              onClick={() => router.push('/dashboard/favorites')}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-vault-border-subtle hover:bg-white/8 hover:border-vault-border-medium transition-all text-left group"
            >
              <Star className="w-5 h-5 text-yellow-400 group-hover:scale-110 transition-transform" />
              <div>
                <p className="text-white font-medium text-sm">{t.favorites}</p>
                <p className="text-xs text-gray-400">View starred items</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
