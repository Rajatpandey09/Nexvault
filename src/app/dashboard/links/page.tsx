'use client';

import { useState, useEffect } from 'react';
import { Plus, Link as LinkIcon, Star, Trash2, ExternalLink, Search, Globe } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { translations } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/utils/helpers';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/ToastContainer';
import { Link } from '@/types';

export default function LinksPage() {
  const { language, user } = useAppStore();
  const t = translations[language];
  const { showToast } = useToast();

  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ url: '', title: '', description: '' });

  useEffect(() => {
    if (user) {
      fetchLinks();
    }
  }, [user]);

  const fetchLinks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('links')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLinks(data || []);
    } catch (error) {
      console.error('Error fetching links:', error);
      showToast('error', 'Failed to load links');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setFormData({ url: '', title: '', description: '' });
    setIsModalOpen(true);
  };

  const saveLink = async () => {
    if (!formData.url.trim() || !formData.title.trim()) {
      showToast('error', 'URL and title are required');
      return;
    }

    // Validate URL
    try {
      new URL(formData.url);
    } catch {
      showToast('error', 'Please enter a valid URL');
      return;
    }

    try {
      // Extract domain for favicon
      const urlObj = new URL(formData.url);
      const domain = urlObj.hostname;
      const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

      const { error } = await supabase.from('links').insert({
        user_id: user?.id,
        url: formData.url,
        title: formData.title,
        description: formData.description || null,
        favicon_url: faviconUrl,
      });

      if (error) throw error;

      showToast('success', 'Link saved successfully');
      setIsModalOpen(false);
      fetchLinks();
    } catch (error) {
      showToast('error', 'Failed to save link');
    }
  };

  const toggleFavorite = async (linkId: string, isFavorite: boolean) => {
    try {
      const { error } = await supabase
        .from('links')
        .update({ is_favorite: !isFavorite })
        .eq('id', linkId);

      if (error) throw error;

      setLinks((prev) =>
        prev.map((l) => (l.id === linkId ? { ...l, is_favorite: !isFavorite } : l))
      );
      showToast('success', isFavorite ? 'Removed from favorites' : 'Added to favorites');
    } catch (error) {
      showToast('error', 'Failed to update favorite');
    }
  };

  const moveToTrash = async (linkId: string) => {
    try {
      const { error } = await supabase
        .from('links')
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', linkId);

      if (error) throw error;

      setLinks((prev) => prev.filter((l) => l.id !== linkId));
      showToast('success', 'Moved to trash');
    } catch (error) {
      showToast('error', 'Failed to delete link');
    }
  };

  const openLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return 'Invalid URL';
    }
  };

  const filteredLinks = links.filter(
    (link) =>
      link.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{t.links}</h1>
          <p className="text-gray-400">
            {links.length} {language === 'en' ? 'saved links in your vault' : 'सहेजे गए लिंक आपकी vault में'}
          </p>
        </div>
        <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          {t.saveLink}
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

      {/* Links Grid */}
      {loading ? (
        <div className="grid-files">
          <LoadingSkeleton type="card" count={6} />
        </div>
      ) : filteredLinks.length === 0 ? (
        <EmptyState
          icon={LinkIcon}
          title={searchQuery ? t.noResults : t.noLinks}
          description={
            searchQuery
              ? t.searchSuggestions
              : language === 'en'
              ? 'Save your first link to keep track of important websites and resources.'
              : 'महत्वपूर्ण वेबसाइटों और संसाधनों पर नज़र रखने के लिए अपना पहला लिंक सहेजें।'
          }
          action={
            !searchQuery
              ? {
                  label: t.saveLink,
                  onClick: openCreateModal,
                }
              : undefined
          }
        />
      ) : (
        <div className="grid-files">
          {filteredLinks.map((link) => (
            <div key={link.id} className="card-interactive group">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
                  {link.favicon_url ? (
                    <img
                      src={link.favicon_url}
                      alt=""
                      className="w-5 h-5"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <Globe className="w-5 h-5 text-cyan-400" />
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(link.id, link.is_favorite);
                  }}
                  className={`p-1.5 rounded-lg transition-colors ${
                    link.is_favorite ? 'text-yellow-400' : 'text-gray-400 hover:text-yellow-400'
                  }`}
                >
                  <Star className="w-4 h-4" fill={link.is_favorite ? 'currentColor' : 'none'} />
                </button>
              </div>

              <h3 className="text-white font-semibold mb-1 truncate">{link.title}</h3>
              <p className="text-xs text-cyan-400 mb-2 truncate">{getDomain(link.url)}</p>
              {link.description && (
                <p className="text-sm text-gray-400 mb-4 truncate-2-lines">{link.description}</p>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-vault-border-subtle">
                <span className="text-xs text-gray-500">{formatDate(link.created_at)}</span>
                <div className="flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openLink(link.url);
                    }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-cyan-400 transition-colors"
                    title={t.open}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveToTrash(link.id);
                    }}
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

      {/* Create Link Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t.saveLink}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t.linkUrl}
            </label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              className="input-field"
              placeholder="https://example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t.linkTitle}
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input-field"
              placeholder="Enter link title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t.linkDescription}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field min-h-[100px] resize-none"
              placeholder="Optional description"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button onClick={() => setIsModalOpen(false)} className="btn-secondary flex-1">
              {t.cancel}
            </button>
            <button onClick={saveLink} className="btn-primary flex-1">
              {t.save}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
