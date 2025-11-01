"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/shared/Layout';
import Button from '@/components/shared/Button';
import { t, setLanguage, getLanguage } from '@/lib/localization';
import { setTheme, getTheme, getMode, themes } from '@/lib/theme';
import { Moon, Sun, Languages, Palette, Accessibility } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const router = useRouter();
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [currentTheme, setCurrentTheme] = useState('modeA');
  const [currentMode, setCurrentMode] = useState('light');
  const [fontSize, setFontSize] = useState('medium');
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    setCurrentLanguage(getLanguage());
    setCurrentTheme(getTheme());
    setCurrentMode(getMode());
    
    if (typeof window !== 'undefined') {
      const savedFontSize = localStorage.getItem('fontSize') || 'medium';
      const savedHighContrast = localStorage.getItem('highContrast') === 'true';
      setFontSize(savedFontSize);
      setHighContrast(savedHighContrast);
    }
  }, []);

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setCurrentLanguage(lang);
    toast.success('Language changed. Page will reload.');
    setTimeout(() => window.location.reload(), 300);
  };

  const handleThemeChange = (theme) => {
    setTheme(theme, currentMode);
    setCurrentTheme(theme);
    toast.success('Theme changed');
  };

  const handleModeToggle = () => {
    const newMode = currentMode === 'light' ? 'dark' : 'light';
    setTheme(currentTheme, newMode);
    setCurrentMode(newMode);
    toast.success(`Switched to ${newMode} mode`);
  };

  const handleFontSizeChange = (size) => {
    setFontSize(size);
    if (typeof window !== 'undefined') {
      localStorage.setItem('fontSize', size);
      document.documentElement.setAttribute('data-font-size', size);
    }
    toast.success('Font size changed');
  };

  const handleHighContrastToggle = () => {
    const newValue = !highContrast;
    setHighContrast(newValue);
    if (typeof window !== 'undefined') {
      localStorage.setItem('highContrast', newValue.toString());
      document.documentElement.classList.toggle('high-contrast', newValue);
    }
    toast.success(`High contrast ${newValue ? 'enabled' : 'disabled'}`);
  };

  return (
    <Layout role="admin">
      <div className="space-y-4 sm:space-y-6 max-w-4xl">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold mb-2">
            <span className="gradient-text">{t('nav.settings')}</span>
          </h1>
          <p className="text-sm sm:text-base text-[var(--color-text-secondary)]">
            Customize your experience
          </p>
        </div>

        {/* Language Settings */}
        <div className="premium-card p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <Languages size={20} className="text-[var(--color-primary)]" />
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
              Language
            </h2>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => handleLanguageChange('en')}
              variant={currentLanguage === 'en' ? 'primary' : 'secondary'}
              className="w-full sm:w-auto"
            >
              English
            </Button>
            <Button
              onClick={() => handleLanguageChange('kn')}
              variant={currentLanguage === 'kn' ? 'primary' : 'secondary'}
              className="w-full sm:w-auto"
            >
              ಕನ್ನಡ (Kannada)
            </Button>
          </div>
        </div>

        {/* Theme Settings */}
        <div className="premium-card p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <Palette size={20} className="text-[var(--color-primary)]" />
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
              Theme
            </h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Theme Mode</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => handleThemeChange('modeA')}
                  variant={currentTheme === 'modeA' ? 'primary' : 'secondary'}
                  className="w-full sm:w-auto"
                >
                  Corporate Blue
                </Button>
                <Button
                  onClick={() => handleThemeChange('modeB')}
                  variant={currentTheme === 'modeB' ? 'primary' : 'secondary'}
                  className="w-full sm:w-auto"
                >
                  Warm Teal
                </Button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Color Mode</label>
              <Button onClick={handleModeToggle} variant="secondary" className="w-full sm:w-auto">
                {currentMode === 'light' ? (
                  <>
                    <Sun className="mr-2" size={16} />
                    Light Mode
                  </>
                ) : (
                  <>
                    <Moon className="mr-2" size={16} />
                    Dark Mode
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Accessibility Settings */}
        <div className="premium-card p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <Accessibility size={20} className="text-[var(--color-primary)]" />
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
              Accessibility
            </h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Font Size</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => handleFontSizeChange('small')}
                  variant={fontSize === 'small' ? 'primary' : 'secondary'}
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  Small
                </Button>
                <Button
                  onClick={() => handleFontSizeChange('medium')}
                  variant={fontSize === 'medium' ? 'primary' : 'secondary'}
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  Medium
                </Button>
                <Button
                  onClick={() => handleFontSizeChange('large')}
                  variant={fontSize === 'large' ? 'primary' : 'secondary'}
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  Large
                </Button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">High Contrast</label>
              <Button
                onClick={handleHighContrastToggle}
                variant={highContrast ? 'primary' : 'secondary'}
                className="w-full sm:w-auto"
              >
                {highContrast ? 'Enabled' : 'Disabled'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

