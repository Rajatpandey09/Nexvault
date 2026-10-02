'use client';

import { useState, useEffect } from 'react';
import { Globe, Moon, Sun, Sparkles, Mic, User, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/appStore';
import { translations } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/ToastContainer';

export default function SettingsPage() {
  const router = useRouter();
  const { language, setLanguage, theme, setTheme, user, setUser } = useAppStore();
  const t = translations[language];
  const { showToast } = useToast();

  const [settings, setSettings] = useState({
    ai_enabled: true,
    voice_enabled: true,
  });

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    try {
      const { data } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (data) {
        setSettings({
          ai_enabled: data.ai_enabled,
          voice_enabled: data.voice_enabled,
        });
        setLanguage(data.language);
        setTheme(data.theme);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const updateSettings = async (updates: Partial<typeof settings>) => {
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user?.id,
          ...updates,
          language,
          theme,
        });

      if (error) throw error;

      setSettings((prev) => ({ ...prev, ...updates }));
      showToast('success', t.saveSuccess);
    } catch (error) {
      showToast('error', 'Failed to save settings');
    }
  };

  const handleLanguageChange = async (newLang: 'en' | 'hi') => {
    setLanguage(newLang);
    try {
      await supabase
        .from('user_settings')
        .upsert({
          user_id: user?.id,
          language: newLang,
          theme,
          ai_enabled: settings.ai_enabled,
          voice_enabled: settings.voice_enabled,
        });
      showToast('success', t.saveSuccess);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  const handleThemeChange = async (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    try {
      await supabase
        .from('user_settings')
        .upsert({
          user_id: user?.id,
          language,
          theme: newTheme,
          ai_enabled: settings.ai_enabled,
          voice_enabled: settings.voice_enabled,
        });
      showToast('success', t.saveSuccess);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/auth/login');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">{t.settings}</h1>
        <p className="text-gray-400">
          {language === 'en'
            ? 'Manage your account and application preferences'
            : 'अपने खाते और एप्लिकेशन प्राथमिकताएं प्रबंधित करें'}
        </p>
      </div>

      {/* Account */}
      <div className="surface-elevated rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <User className="w-5 h-5 text-vault-accent-blue" />
          <h2 className="text-xl font-bold text-white">{t.account}</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/3 border border-vault-border-subtle">
            <div>
              <p className="text-white font-medium">{t.email}</p>
              <p className="text-sm text-gray-400">{user?.email}</p>
            </div>
          </div>

          <button onClick={handleSignOut} className="btn-danger flex items-center gap-2">
            <LogOut className="w-4 h-4" />
            {t.signOut}
          </button>
        </div>
      </div>

      {/* Appearance */}
      <div className="surface-elevated rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <Sun className="w-5 h-5 text-vault-accent-blue" />
          <h2 className="text-xl font-bold text-white">{t.appearance}</h2>
        </div>

        <div className="space-y-6">
          {/* Language */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              {t.language}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleLanguageChange('en')}
                className={`p-4 rounded-xl border transition-all ${
                  language === 'en'
                    ? 'bg-vault-accent-blue border-vault-accent-blue text-white'
                    : 'bg-white/3 border-vault-border-subtle text-gray-300 hover:border-vault-border-medium'
                }`}
              >
                <Globe className="w-5 h-5 mb-2" />
                <p className="font-medium">English</p>
              </button>
              <button
                type="button"
                onClick={() => handleLanguageChange('hi')}
                className={`p-4 rounded-xl border transition-all ${
                  language === 'hi'
                    ? 'bg-vault-accent-blue border-vault-accent-blue text-white'
                    : 'bg-white/3 border-vault-border-subtle text-gray-300 hover:border-vault-border-medium'
                }`}
              >
                <Globe className="w-5 h-5 mb-2" />
                <p className="font-medium">हिंदी (Hindi)</p>
              </button>
            </div>
          </div>

          {/* Theme */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              {t.theme}
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleThemeChange('light')}
                className={`p-4 rounded-xl border transition-all ${
                  theme === 'light'
                    ? 'bg-vault-accent-blue border-vault-accent-blue text-white'
                    : 'bg-white/3 border-vault-border-subtle text-gray-300 hover:border-vault-border-medium'
                }`}
              >
                <Sun className="w-5 h-5 mb-2" />
                <p className="font-medium text-sm">{t.light}</p>
              </button>
              <button
                type="button"
                onClick={() => handleThemeChange('dark')}
                className={`p-4 rounded-xl border transition-all ${
                  theme === 'dark'
                    ? 'bg-vault-accent-blue border-vault-accent-blue text-white'
                    : 'bg-white/3 border-vault-border-subtle text-gray-300 hover:border-vault-border-medium'
                }`}
              >
                <Moon className="w-5 h-5 mb-2" />
                <p className="font-medium text-sm">{t.dark}</p>
              </button>
              <button
                type="button"
                onClick={() => handleThemeChange('system')}
                className={`p-4 rounded-xl border transition-all ${
                  theme === 'system'
                    ? 'bg-vault-accent-blue border-vault-accent-blue text-white'
                    : 'bg-white/3 border-vault-border-subtle text-gray-300 hover:border-vault-border-medium'
                }`}
              >
                <Globe className="w-5 h-5 mb-2" />
                <p className="font-medium text-sm">{t.system}</p>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* AI Features */}
      <div className="surface-elevated rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <Sparkles className="w-5 h-5 text-vault-accent-blue" />
          <h2 className="text-xl font-bold text-white">{t.ai}</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/3 border border-vault-border-subtle">
            <div>
              <p className="text-white font-medium">{t.aiSearch}</p>
              <p className="text-sm text-gray-400">
                {language === 'en'
                  ? 'Enable AI-powered semantic search'
                  : 'AI से संचालित सिमेंटिक खोज सक्षम करें'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => updateSettings({ ai_enabled: !settings.ai_enabled })}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                settings.ai_enabled ? 'bg-vault-accent-blue' : 'bg-white/10'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  settings.ai_enabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-white/3 border border-vault-border-subtle">
            <div>
              <p className="text-white font-medium">{t.voiceSearch}</p>
              <p className="text-sm text-gray-400">
                {language === 'en'
                  ? 'Enable voice commands and voice search'
                  : 'आवाज आदेश और आवाज खोज सक्षम करें'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => updateSettings({ voice_enabled: !settings.voice_enabled })}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                settings.voice_enabled ? 'bg-vault-accent-blue' : 'bg-white/10'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  settings.voice_enabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="surface-elevated rounded-2xl p-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-vault-accent-blue to-vault-accent-purple mb-4">
            <span className="text-2xl font-bold">KV</span>
          </div>
          <h3 className="text-white font-bold mb-2">Personal Knowledge Vault</h3>
          <p className="text-sm text-gray-400 mb-1">Version 1.0.0</p>
          <p className="text-xs text-gray-500">
            AI-Powered Personal Knowledge Management
          </p>
        </div>
      </div>
    </div>
  );
}
