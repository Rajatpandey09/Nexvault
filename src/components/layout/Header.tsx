'use client';

import { useState } from 'react';
import { Search, Mic, Globe, Moon, Sun, LogOut, Menu, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/store/appStore';
import { translations } from '@/lib/i18n';

export default function Header() {
  const router = useRouter();
  const { language, setLanguage, theme, setTheme, setUser, sidebarOpen, toggleSidebar } = useAppStore();
  const t = translations[language];
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/dashboard/search?q=${encodeURIComponent(searchQuery)}`);
      setMobileSearchOpen(false);
    }
  };

  const handleVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice recognition is not supported in your browser');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = language === 'hi' ? 'hi-IN' : 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
      setIsListening(false);
      router.push(`/dashboard/search?q=${encodeURIComponent(transcript)}`);
      setMobileSearchOpen(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'hi' : 'en');
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/auth/login');
  };

  return (
    <header className="glass-dark border-b border-white/10 sticky top-0 z-30">
      <div className="px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Mobile menu toggle */}
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-300 hover:text-white touch-target"
            aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            aria-expanded={sidebarOpen}
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Search Bar - collapsible on mobile */}
          <form onSubmit={handleSearch} className={`flex-1 max-w-2xl transition-all duration-200 ${mobileSearchOpen ? 'w-full lg:max-w-2xl' : 'lg:flex-1'}`}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setMobileSearchOpen(true)}
                placeholder={t.search}
                className="w-full pl-10 pr-12 py-2.5 sm:py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all input-responsive"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={handleVoiceSearch}
                className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                  isListening ? 'text-red-500 animate-pulse' : 'text-gray-400 hover:text-white'
                } transition-colors touch-target p-1`}
                aria-label="Voice search"
              >
                <Mic className="w-5 h-5" />
              </button>
            </div>
          </form>

          {/* Mobile search toggle button */}
          <button
            type="button"
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-300 hover:text-white touch-target"
            aria-label="Open search"
            aria-expanded={mobileSearchOpen}
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Language Toggle */}
            <button
              type="button"
              onClick={toggleLanguage}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-300 hover:text-white touch-target"
              title={language === 'en' ? 'Switch to Hindi' : 'Switch to English'}
              aria-label={language === 'en' ? 'Switch to Hindi' : 'Switch to English'}
            >
              <Globe className="w-5 h-5" />
            </button>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-300 hover:text-white touch-target"
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Sign Out */}
            <button
              type="button"
              onClick={handleSignOut}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-300 hover:text-white touch-target"
              title={t.signOut}
              aria-label={t.signOut}
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
