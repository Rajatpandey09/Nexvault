'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, StickyNote, Star, Trash2, Edit2, Search } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { translations } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/utils/helpers';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/ToastContainer';
import { Note } from '@/types';

export default function NotesPage() {
  const router = useRouter();
  const { language, user } = useAppStore();
  const t = translations[language];
  const { showToast } = useToast();

  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [formData, setFormData] = useState({ title: '', content: '', description: '' });

  useEffect(() => {
    if (user) {
      fetchNotes();
    }
  }, [user]);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_deleted', false)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
      showToast('error', 'Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingNote(null);
    setFormData({ title: '', content: '', description: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (note: Note) => {
    setEditingNote(note);
    setFormData({
      title: note.title,
      content: note.content,
      description: note.description || '',
    });
    setIsModalOpen(true);
  };

  const saveNote = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      showToast('error', 'Title and content are required');
      return;
    }

    try {
      if (editingNote) {
        // Update existing note
        const { error } = await supabase
          .from('notes')
          .update({
            title: formData.title,
            content: formData.content,
            description: formData.description || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingNote.id);

        if (error) throw error;
        showToast('success', t.saveSuccess);
      } else {
        // Create new note
        const { error } = await supabase.from('notes').insert({
          user_id: user?.id,
          title: formData.title,
          content: formData.content,
          description: formData.description || null,
        });

        if (error) throw error;
        showToast('success', 'Note created successfully');
      }

      setIsModalOpen(false);
      fetchNotes();
    } catch (error) {
      showToast('error', editingNote ? 'Failed to update note' : 'Failed to create note');
    }
  };

  const toggleFavorite = async (noteId: string, isFavorite: boolean) => {
    try {
      const { error } = await supabase
        .from('notes')
        .update({ is_favorite: !isFavorite })
        .eq('id', noteId);

      if (error) throw error;

      setNotes((prev) =>
        prev.map((n) => (n.id === noteId ? { ...n, is_favorite: !isFavorite } : n))
      );
      showToast('success', isFavorite ? 'Removed from favorites' : 'Added to favorites');
    } catch (error) {
      showToast('error', 'Failed to update favorite');
    }
  };

  const moveToTrash = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('notes')
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', noteId);

      if (error) throw error;

      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      showToast('success', 'Moved to trash');
    } catch (error) {
      showToast('error', 'Failed to delete note');
    }
  };

  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{t.notes}</h1>
          <p className="text-gray-400">
            {notes.length} {language === 'en' ? 'notes in your vault' : 'नोट्स आपकी vault में'}
          </p>
        </div>
        <button type="button" onClick={openCreateModal} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          {t.createNote}
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

      {/* Notes Grid */}
      {loading ? (
        <div className="grid-files">
          <LoadingSkeleton type="card" count={6} />
        </div>
      ) : filteredNotes.length === 0 ? (
        <EmptyState
          icon={StickyNote}
          title={searchQuery ? t.noResults : t.noNotes}
          description={
            searchQuery
              ? t.searchSuggestions
              : language === 'en'
              ? 'Create your first note to capture ideas, thoughts, and knowledge.'
              : 'विचारों, सोच और ज्ञान को पकड़ने के लिए अपना पहला नोट बनाएं।'
          }
          action={
            !searchQuery
              ? {
                  label: t.createNote,
                  onClick: openCreateModal,
                }
              : undefined
          }
        />
      ) : (
        <div className="grid-files">
          {filteredNotes.map((note) => (
            <div key={note.id} className="card-interactive">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                  <StickyNote className="w-5 h-5 text-amber-400" />
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(note.id, note.is_favorite);
                  }}
                  className={`p-1.5 rounded-lg transition-colors ${
                    note.is_favorite ? 'text-yellow-400' : 'text-gray-400 hover:text-yellow-400'
                  }`}
                >
                  <Star className="w-4 h-4" fill={note.is_favorite ? 'currentColor' : 'none'} />
                </button>
              </div>

              <h3 className="text-white font-semibold mb-2 truncate">{note.title}</h3>
              <p className="text-sm text-gray-400 mb-4 truncate-2-lines">{note.content}</p>

              <div className="flex items-center justify-between pt-3 border-t border-vault-border-subtle">
                <span className="text-xs text-gray-500">{formatDate(note.updated_at)}</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(note);
                    }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-white transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      moveToTrash(note.id);
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

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingNote ? t.edit : t.createNote}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t.noteTitle}
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input-field"
              placeholder="Enter note title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description (optional)
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field"
              placeholder="Brief description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t.noteContent}
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="input-field min-h-[200px] resize-none"
              placeholder="Write your note here..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button onClick={() => setIsModalOpen(false)} className="btn-secondary flex-1">
              {t.cancel}
            </button>
            <button onClick={saveNote} className="btn-primary flex-1">
              {t.save}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
