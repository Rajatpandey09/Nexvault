'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileImage, Download, Star, Trash2, Search } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { translations } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { formatFileSize, formatDate } from '@/utils/helpers';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import { useToast } from '@/components/ui/ToastContainer';
import { VaultFile } from '@/types';

export default function ImagesPage() {
  const router = useRouter();
  const { language, user } = useAppStore();
  const t = translations[language];
  const { showToast } = useToast();

  const [images, setImages] = useState<VaultFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      fetchImages();
    }
  }, [user]);

  const fetchImages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_deleted', false)
        .like('mime_type', 'image/%')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setImages(data || []);
    } catch (error) {
      console.error('Error fetching images:', error);
      showToast('error', 'Failed to load images');
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

      setImages((prev) =>
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

      showToast('success', 'Image downloaded');
    } catch (error) {
      showToast('error', 'Failed to download image');
    }
  };

  const moveToTrash = async (fileId: string) => {
    try {
      const { error } = await supabase
        .from('files')
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', fileId);

      if (error) throw error;

      setImages((prev) => prev.filter((f) => f.id !== fileId));
      showToast('success', 'Moved to trash');
    } catch (error) {
      showToast('error', 'Failed to delete image');
    }
  };

  const filteredImages = images.filter((img) =>
    img.original_filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{t.images}</h1>
          <p className="text-gray-400">
            {images.length} {language === 'en' ? 'images in your vault' : 'छवियाँ आपकी vault में'}
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

      {/* Images Grid */}
      {loading ? (
        <div className="grid-files">
          <LoadingSkeleton type="card" count={6} />
        </div>
      ) : filteredImages.length === 0 ? (
        <EmptyState
          icon={FileImage}
          title={searchQuery ? t.noResults : t.noFiles}
          description={
            searchQuery
              ? t.searchSuggestions
              : language === 'en'
              ? 'Upload PNG, JPG, or other image files to your vault.'
              : 'अपनी vault में PNG, JPG, या अन्य छवि फ़ाइलें अपलोड करें।'
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
          {filteredImages.map((img) => (
            <div key={img.id} className="file-card">
              <div className="file-card-icon bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30">
                <FileImage className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-white font-medium mb-1 truncate">{img.original_filename}</h3>
              <p className="text-xs text-gray-500 mb-3">{formatFileSize(img.size)}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{formatDate(img.created_at)}</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => toggleFavorite(img.id, img.is_favorite)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      img.is_favorite ? 'text-yellow-400' : 'text-gray-400 hover:text-yellow-400'
                    }`}
                  >
                    <Star className="w-4 h-4" fill={img.is_favorite ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadFile(img)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-white transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveToTrash(img.id)}
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
