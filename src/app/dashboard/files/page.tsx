'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  FileText,
  FileImage,
  File,
  Grid3x3,
  List,
  Download,
  Star,
  Trash2,
  MoreVertical,
  Search,
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { translations } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { formatFileSize, formatDate, getFileType } from '@/utils/helpers';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import { useToast } from '@/components/ui/ToastContainer';
import { VaultFile } from '@/types';

export default function FilesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language, user } = useAppStore();
  const t = translations[language];
  const { showToast } = useToast();

  const [files, setFiles] = useState<VaultFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size'>('date');

  useEffect(() => {
    if (user) {
      fetchFiles();
    }
  }, [user]);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      console.error('Error fetching files:', error);
      showToast('error', 'Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (fileId: string, isFavorite: boolean) => {
    try {
      const { error } = await supabase
        .from('files')
        .update({ is_favorite: !isFavorite })
        .eq('id', fileId);

      if (error) throw error;

      setFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, is_favorite: !isFavorite } : f))
      );
      showToast('success', isFavorite ? 'Removed from favorites' : 'Added to favorites');
    } catch (error) {
      showToast('error', 'Failed to update favorite');
    }
  };

  const downloadFile = async (file: VaultFile) => {
    try {
      const { data, error } = await supabase.storage
        .from('vault-files')
        .download(file.storage_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.original_filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast('success', 'File downloaded');
    } catch (error) {
      showToast('error', 'Failed to download file');
    }
  };

  const moveToTrash = async (fileId: string) => {
    try {
      const { error } = await supabase
        .from('files')
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', fileId);

      if (error) throw error;

      setFiles((prev) => prev.filter((f) => f.id !== fileId));
      showToast('success', 'Moved to trash');
    } catch (error) {
      showToast('error', 'Failed to delete file');
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return FileImage;
    if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text'))
      return FileText;
    return File;
  };

  const filteredFiles = files
    .filter((file) =>
      file.original_filename.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'date') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === 'name') return a.original_filename.localeCompare(b.original_filename);
      if (sortBy === 'size') return b.size - a.size;
      return 0;
    });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{t.allFiles}</h1>
          <p className="text-gray-400">
            {files.length} {language === 'en' ? 'files in your vault' : 'फ़ाइलें आपकी vault में'}
          </p>
        </div>
        <button onClick={() => router.push('/dashboard/upload')} className="btn-primary">
          {t.upload}
        </button>
      </div>

      {/* Filters & View Controls */}
      <div className="glass-dark rounded-2xl border border-vault-border-subtle p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-vault-border-subtle rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-vault-accent-blue/50 transition-all"
            />
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2.5 bg-white/5 border border-vault-border-subtle rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-vault-accent-blue/50 transition-all"
          >
            <option value="date">Sort by Date</option>
            <option value="name">Sort by Name</option>
            <option value="size">Sort by Size</option>
          </select>

          {/* View Toggle */}
          <div className="flex gap-2 bg-white/5 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'grid'
                  ? 'bg-vault-accent-blue text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Grid3x3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'list'
                  ? 'bg-vault-accent-blue text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Files Grid/List */}
      {loading ? (
        <div className={viewMode === 'grid' ? 'grid-files' : 'space-y-3'}>
          <LoadingSkeleton type={viewMode === 'grid' ? 'card' : 'list'} count={6} />
        </div>
      ) : filteredFiles.length === 0 ? (
        <EmptyState
          icon={File}
          title={searchQuery ? t.noResults : t.noFiles}
          description={
            searchQuery
              ? t.searchSuggestions
              : language === 'en'
              ? 'Upload your first file to start building your knowledge vault.'
              : 'अपनी vault बनाना शुरू करने के लिए अपनी पहली फ़ाइल अपलोड करें।'
          }
          action={
            !searchQuery
              ? {
                  label: t.upload,
                  onClick: () => router.push('/dashboard/upload'),
                }
              : undefined
          }
        />
      ) : viewMode === 'grid' ? (
        <div className="grid-files">
          {filteredFiles.map((file) => {
            const Icon = getFileIcon(file.mime_type);
            return (
              <div key={file.id} className="file-card">
                <div className="file-card-icon bg-gradient-to-br from-vault-accent-blue/20 to-vault-accent-purple/20 border border-vault-accent-blue/30">
                  <Icon className="w-6 h-6 text-vault-accent-blue" />
                </div>
                <h3 className="text-white font-medium mb-1 truncate">{file.original_filename}</h3>
                <p className="text-xs text-gray-500 mb-3">{formatFileSize(file.size)}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{formatDate(file.created_at)}</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => toggleFavorite(file.id, file.is_favorite)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        file.is_favorite ? 'text-yellow-400' : 'text-gray-400 hover:text-yellow-400'
                      }`}
                    >
                      <Star className="w-4 h-4" fill={file.is_favorite ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadFile(file)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-white transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveToTrash(file.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredFiles.map((file) => {
            const Icon = getFileIcon(file.mime_type);
            return (
              <div
                key={file.id}
                className="flex items-center gap-4 p-4 rounded-xl bg-white/3 border border-vault-border-subtle hover:border-vault-border-medium hover:bg-white/5 transition-all"
              >
                <div className="w-12 h-12 rounded-lg bg-vault-accent-blue/10 border border-vault-accent-blue/30 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-6 h-6 text-vault-accent-blue" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-medium truncate">{file.original_filename}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-500">{formatFileSize(file.size)}</span>
                    <span className="text-xs text-gray-600">•</span>
                    <span className="text-xs text-gray-500">{formatDate(file.created_at)}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => toggleFavorite(file.id, file.is_favorite)}
                    className={`p-2 rounded-lg transition-colors ${
                      file.is_favorite ? 'text-yellow-400' : 'text-gray-400 hover:text-yellow-400'
                    }`}
                  >
                    <Star className="w-5 h-5" fill={file.is_favorite ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadFile(file)}
                    className="p-2 rounded-lg text-gray-400 hover:text-white transition-colors"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveToTrash(file.id)}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
