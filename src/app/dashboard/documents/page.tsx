'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Download, Star, Trash2, Search } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { translations } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { formatFileSize, formatDate } from '@/utils/helpers';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import { useToast } from '@/components/ui/ToastContainer';
import { VaultFile } from '@/types';

export default function DocumentsPage() {
  const router = useRouter();
  const { language, user } = useAppStore();
  const t = translations[language];
  const { showToast } = useToast();

  const [documents, setDocuments] = useState<VaultFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [user]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_deleted', false)
        .or('mime_type.like.%pdf%,mime_type.like.%document%,mime_type.like.%text%,mime_type.like.%word%')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      showToast('error', 'Failed to load documents');
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

      setDocuments((prev) =>
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

      setDocuments((prev) => prev.filter((f) => f.id !== fileId));
      showToast('success', 'Moved to trash');
    } catch (error) {
      showToast('error', 'Failed to delete file');
    }
  };

  const filteredDocuments = documents.filter((doc) =>
    doc.original_filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{t.documents}</h1>
          <p className="text-gray-400">
            {documents.length} {language === 'en' ? 'documents in your vault' : 'दस्तावेज़ आपकी vault में'}
          </p>
        </div>
        <button onClick={() => router.push('/dashboard/upload')} className="btn-primary">
          {t.upload}
        </button>
      </div>

      {/* Search */}
      <div className="glass-dark rounded-2xl border border-vault-border-subtle p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={t.search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-vault-border-subtle rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-vault-accent-blue/50 transition-all"
          />
        </div>
      </div>

      {/* Documents Grid */}
      {loading ? (
        <div className="grid-files">
          <LoadingSkeleton type="card" count={6} />
        </div>
      ) : filteredDocuments.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={searchQuery ? t.noResults : t.noFiles}
          description={
            searchQuery
              ? t.searchSuggestions
              : language === 'en'
              ? 'Upload PDF, Word, or text documents to your vault.'
              : 'अपनी vault में PDF, Word, या text दस्तावेज़ अपलोड करें।'
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
      ) : (
        <div className="grid-files">
          {filteredDocuments.map((doc) => (
            <div key={doc.id} className="file-card">
              <div className="file-card-icon bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30">
                <FileText className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-white font-medium mb-1 truncate">{doc.original_filename}</h3>
              <p className="text-xs text-gray-500 mb-3">{formatFileSize(doc.size)}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{formatDate(doc.created_at)}</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => toggleFavorite(doc.id, doc.is_favorite)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      doc.is_favorite ? 'text-yellow-400' : 'text-gray-400 hover:text-yellow-400'
                    }`}
                  >
                    <Star className="w-4 h-4" fill={doc.is_favorite ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    onClick={() => downloadFile(doc)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-white transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => moveToTrash(doc.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
