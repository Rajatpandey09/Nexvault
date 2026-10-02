'use client';

import { useState, useEffect } from 'react';
import { Trash2, RotateCcw, XCircle, AlertTriangle, FileText, StickyNote, Link as LinkIcon } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { translations } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/utils/helpers';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/ToastContainer';

interface TrashItem {
  id: string;
  type: 'file' | 'note' | 'link';
  title: string;
  deleted_at: string;
}

export default function TrashPage() {
  const { language, user } = useAppStore();
  const t = translations[language];
  const { showToast } = useToast();

  const [items, setItems] = useState<TrashItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<TrashItem | null>(null);
  const [confirmEmptyTrash, setConfirmEmptyTrash] = useState(false);

  useEffect(() => {
    if (user) {
      fetchTrash();
    }
  }, [user]);

  const fetchTrash = async () => {
    setLoading(true);
    try {
      const trashItems: TrashItem[] = [];

      // Fetch deleted files
      const { data: files } = await supabase
        .from('files')
        .select('id, original_filename, deleted_at')
        .eq('user_id', user?.id)
        .eq('is_deleted', true)
        .order('deleted_at', { ascending: false });

      if (files) {
        trashItems.push(
          ...files.map((f) => ({
            id: f.id,
            type: 'file' as const,
            title: f.original_filename,
            deleted_at: f.deleted_at!,
          }))
        );
      }

      // Fetch deleted notes
      const { data: notes } = await supabase
        .from('notes')
        .select('id, title, deleted_at')
        .eq('user_id', user?.id)
        .eq('is_deleted', true)
        .order('deleted_at', { ascending: false });

      if (notes) {
        trashItems.push(
          ...notes.map((n) => ({
            id: n.id,
            type: 'note' as const,
            title: n.title,
            deleted_at: n.deleted_at!,
          }))
        );
      }

      // Fetch deleted links
      const { data: links } = await supabase
        .from('links')
        .select('id, title, deleted_at')
        .eq('user_id', user?.id)
        .eq('is_deleted', true)
        .order('deleted_at', { ascending: false });

      if (links) {
        trashItems.push(
          ...links.map((l) => ({
            id: l.id,
            type: 'link' as const,
            title: l.title,
            deleted_at: l.deleted_at!,
          }))
        );
      }

      setItems(trashItems.sort((a, b) => new Date(b.deleted_at).getTime() - new Date(a.deleted_at).getTime()));
    } catch (error) {
      console.error('Error fetching trash:', error);
      showToast('error', 'Failed to load trash');
    } finally {
      setLoading(false);
    }
  };

  const restoreItem = async (item: TrashItem) => {
    try {
      const table = item.type === 'file' ? 'files' : item.type === 'note' ? 'notes' : 'links';
      const { error } = await supabase
        .from(table)
        .update({ is_deleted: false, deleted_at: null })
        .eq('id', item.id);

      if (error) throw error;

      setItems((prev) => prev.filter((i) => i.id !== item.id));
      showToast('success', t.restoreSuccess);
    } catch (error) {
      showToast('error', 'Failed to restore item');
    }
  };

  const permanentlyDelete = async (item: TrashItem) => {
    try {
      const table = item.type === 'file' ? 'files' : item.type === 'note' ? 'notes' : 'links';

      // If it's a file, delete from storage first
      if (item.type === 'file') {
        const { data: fileData } = await supabase
          .from('files')
          .select('storage_path')
          .eq('id', item.id)
          .single();

        if (fileData?.storage_path) {
          await supabase.storage.from('vault-files').remove([fileData.storage_path]);
        }
      }

      const { error } = await supabase.from(table).delete().eq('id', item.id);

      if (error) throw error;

      setItems((prev) => prev.filter((i) => i.id !== item.id));
      showToast('success', 'Permanently deleted');
      setConfirmDelete(null);
    } catch (error) {
      showToast('error', 'Failed to delete item');
    }
  };

  const emptyTrash = async () => {
    try {
      // Delete all files from storage
      const fileItems = items.filter((i) => i.type === 'file');
      for (const item of fileItems) {
        const { data: fileData } = await supabase
          .from('files')
          .select('storage_path')
          .eq('id', item.id)
          .single();

        if (fileData?.storage_path) {
          await supabase.storage.from('vault-files').remove([fileData.storage_path]);
        }
      }

      // Delete all items from database
      await Promise.all([
        supabase.from('files').delete().eq('user_id', user?.id).eq('is_deleted', true),
        supabase.from('notes').delete().eq('user_id', user?.id).eq('is_deleted', true),
        supabase.from('links').delete().eq('user_id', user?.id).eq('is_deleted', true),
      ]);

      setItems([]);
      showToast('success', 'Trash emptied');
      setConfirmEmptyTrash(false);
    } catch (error) {
      showToast('error', 'Failed to empty trash');
    }
  };

  const getIcon = (type: string) => {
    if (type === 'file') return FileText;
    if (type === 'note') return StickyNote;
    if (type === 'link') return LinkIcon;
    return FileText;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{t.trash}</h1>
          <p className="text-gray-400">
            {items.length} {language === 'en' ? 'items in trash' : 'आइटम ट्रैश में'}
          </p>
        </div>
        {items.length > 0 && (
          <button
            onClick={() => setConfirmEmptyTrash(true)}
            className="btn-danger flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            {t.emptyTrash}
          </button>
        )}
      </div>

      {/* Warning */}
      {items.length > 0 && (
        <div className="glass-dark rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-200 text-sm font-medium mb-1">
                {language === 'en' ? 'Items in trash' : 'ट्रैश में आइटम'}
              </p>
              <p className="text-amber-300/70 text-sm">
                {language === 'en'
                  ? 'Deleted items can be restored or permanently deleted. Permanent deletion cannot be undone.'
                  : 'हटाए गए आइटम को पुनर्स्थापित या स्थायी रूप से हटाया जा सकता है। स्थायी विलोपन पूर्ववत नहीं किया जा सकता।'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Trash Items */}
      {loading ? (
        <div className="space-y-3">
          <LoadingSkeleton type="list" count={6} />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Trash2}
          title={language === 'en' ? 'Trash is empty' : 'ट्रैश खाली है'}
          description={
            language === 'en'
              ? 'Deleted items will appear here before permanent deletion.'
              : 'स्थायी विलोपन से पहले हटाए गए आइटम यहाँ दिखाई देंगे।'
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
                  className="flex items-center gap-4 p-4 rounded-xl bg-white/3 border border-vault-border-subtle"
                >
                  <div className="w-12 h-12 rounded-lg bg-white/5 border border-vault-border-subtle flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-gray-400" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-medium truncate">{item.title}</h3>
                      <span className="px-2 py-0.5 rounded-full text-xs bg-white/5 text-gray-400 capitalize">
                        {item.type}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      Deleted {formatDate(item.deleted_at)}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => restoreItem(item)}
                      className="p-2 rounded-lg text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
                      title={t.restore}
                    >
                      <RotateCcw className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(item)}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                      title={t.permanentlyDelete}
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Confirm Delete Dialog */}
      {confirmDelete && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setConfirmDelete(null)}
          onConfirm={() => permanentlyDelete(confirmDelete)}
          title={t.permanentlyDelete}
          message={`Are you sure you want to permanently delete "${confirmDelete.title}"? This action cannot be undone.`}
          confirmText={t.deleteForever}
          variant="danger"
        />
      )}

      {/* Confirm Empty Trash Dialog */}
      <ConfirmDialog
        isOpen={confirmEmptyTrash}
        onClose={() => setConfirmEmptyTrash(false)}
        onConfirm={emptyTrash}
        title={t.emptyTrash}
        message={t.confirmEmptyTrash}
        confirmText={t.emptyTrash}
        variant="danger"
      />
    </div>
  );
}
