'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  FileText,
  FileImage,
  StickyNote,
  Link as LinkIcon,
  Star,
  Clock,
  Trash2,
  Settings,
  PlusCircle,
  Menu,
  X,
  HardDrive,
  Search,
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { translations } from '@/lib/i18n';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { formatFileSize } from '@/utils/helpers';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { language, sidebarOpen, toggleSidebar, user } = useAppStore();
  const t = translations[language];
  const [mobileOpen, setMobileOpen] = useState(false);
  const [storageUsed, setStorageUsed] = useState(0);
  const storageQuota = 1073741824; // 1GB

  useEffect(() => {
    if (user) {
      fetchStorageUsed();
    }
  }, [user]);

  const fetchStorageUsed = async () => {
    try {
      const { data, error } = await supabase
        .from('files')
        .select('size')
        .eq('user_id', user?.id)
        .eq('is_deleted', false);

      if (!error && data) {
        const total = data.reduce((sum, file) => sum + (file.size || 0), 0);
        setStorageUsed(total);
      }
    } catch (err) {
      console.error('Error fetching storage:', err);
    }
  };

  const navItems = [
    { icon: Home, label: t.dashboard, path: '/dashboard' },
    { icon: Search, label: 'Finder', path: '/dashboard/search' },
    { icon: FileText, label: t.allFiles, path: '/dashboard/files' },
    { icon: FileText, label: t.documents, path: '/dashboard/documents' },
    { icon: FileImage, label: t.images, path: '/dashboard/images' },
    { icon: StickyNote, label: t.notes, path: '/dashboard/notes' },
    { icon: LinkIcon, label: t.links, path: '/dashboard/links' },
    { icon: Star, label: t.favorites, path: '/dashboard/favorites' },
    { icon: Clock, label: t.recent, path: '/dashboard/recent' },
    { icon: Trash2, label: t.trash, path: '/dashboard/trash' },
  ];

  const handleNavigation = (path: string) => {
    router.push(path);
    setMobileOpen(false);
  };

  const storagePercentage = (storageUsed / storageQuota) * 100;

  return (
    <>
      {/* Mobile Menu Button - fixed position, safe area */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 glass-dark p-3 rounded-xl border border-vault-border-medium hover:border-vault-border-strong transition-all touch-target safe-area-inset-left"
        aria-label="Toggle menu"
        aria-expanded={mobileOpen}
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Overlay for mobile */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30 animate-fade-in"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 h-screen z-40
          glass-dark border-r border-vault-border-subtle
          transition-all duration-300 ease-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${sidebarOpen ? 'w-72' : 'lg:w-20 w-72'}
        `}
        style={{ maxWidth: '100vw' }}
      >
        <div className="flex flex-col h-full min-w-0">
          {/* Logo */}
          <div className="p-4 sm:p-6 border-b border-vault-border-subtle flex-shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-vault-accent-blue to-vault-accent-purple flex items-center justify-center shadow-glow-blue flex-shrink-0">
                <span className="text-lg font-bold">KV</span>
              </div>
              {sidebarOpen && (
                <div className="min-w-0">
                  <h1 className="text-base font-bold text-white truncate">Knowledge Vault</h1>
                  <p className="text-xs text-gray-500 truncate">Personal AI Vault</p>
                </div>
              )}
            </div>
          </div>

          {/* Add to Vault Button */}
          <div className="p-4 sm:p-4 flex-shrink-0">
            <button
              type="button"
              onClick={() => handleNavigation('/dashboard/upload')}
              className="w-full btn-primary flex items-center justify-center gap-2 btn-mobile"
            >
              <PlusCircle className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="font-semibold truncate">{t.addToVault}</span>}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1.5 min-h-0" aria-label="Main navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;

              return (
                <button
                  type="button"
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-3 rounded-xl
                    transition-all duration-200 touch-target
                    ${isActive
                      ? 'bg-vault-accent-blue text-white shadow-glow-blue'
                      : 'text-gray-300 hover:bg-white/5 hover:text-white'
                    }
                  `}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && <span className="truncate text-sm font-medium">{item.label}</span>}
                </button>
              );
            })}
          </nav>

          {/* Storage Indicator */}
          {sidebarOpen && (
            <div className="p-4 border-t border-vault-border-subtle flex-shrink-0">
              <div className="bg-white/3 rounded-xl p-3 border border-vault-border-subtle">
                <div className="flex items-center gap-2 mb-2">
                  <HardDrive className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-xs font-medium text-gray-400 truncate">{t.storage}</span>
                </div>
                <div className="mb-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white font-medium truncate">
                      {formatFileSize(storageUsed)}
                    </span>
                    <span className="text-gray-500 truncate">
                      {formatFileSize(storageQuota)}
                    </span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-vault-accent-blue to-vault-accent-cyan h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(storagePercentage, 100)}%` }}
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  {storagePercentage.toFixed(1)}% used
                </p>
              </div>
            </div>
          )}

          {/* Settings */}
          <div className="p-4 border-t border-vault-border-subtle flex-shrink-0">
            <button
              type="button"
              onClick={() => handleNavigation('/dashboard/settings')}
              className={`
                w-full flex items-center gap-3 px-3 py-3 rounded-xl
                transition-all duration-200 touch-target
                ${pathname === '/dashboard/settings'
                  ? 'bg-vault-accent-blue text-white shadow-glow-blue'
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
                }
              `}
            >
              <Settings className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="truncate text-sm font-medium">{t.settings}</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
