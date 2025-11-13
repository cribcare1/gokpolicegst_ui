"use client";
import { useEffect } from 'react';
import { applyTheme, getTheme, getMode, _updateThemeVars } from '@/lib/theme';

export default function ThemeProvider() {
  useEffect(() => {
    // Apply theme only after hydration (client-side only)
    const theme = getTheme();
    const mode = getMode();
    // Update module-level variables using internal function
    _updateThemeVars(theme, mode);
    applyTheme();
  }, []);

  return null;
}

