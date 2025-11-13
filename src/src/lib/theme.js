// Theme system for Mode A (Corporate Blue/Gray) and Mode B (Warm Teal/Slate)

export const themes = {
  modeA: {
    name: 'Corporate Blue',
    light: {
      primary: '#0B64D0',
      accent: '#0E8BFF',
      surface: '#F6F8FB',
      background: '#FFFFFF',
      textPrimary: '#0F1724',
      textSecondary: '#64748B',
      success: '#059669',
      error: '#DC2626',
      warning: '#D97706',
      border: '#E2E8F0',
      muted: '#F1F5F9',
    },
    dark: {
      primary: '#0E8BFF',
      accent: '#3BA3FF',
      surface: '#1E293B',
      background: '#0F1724',
      textPrimary: '#F8FAFC',
      textSecondary: '#CBD5E1',
      success: '#10B981',
      error: '#EF4444',
      warning: '#F59E0B',
      border: '#334155',
      muted: '#1E293B',
    },
  },
  modeB: {
    name: 'Warm Teal',
    light: {
      primary: '#0F766E',
      accent: '#06B6D4',
      surface: '#FBFEFD',
      background: '#FFFFFF',
      textPrimary: '#0B1220',
      textSecondary: '#475569',
      success: '#10B981',
      error: '#EF4444',
      warning: '#F59E0B',
      border: '#E2E8F0',
      muted: '#F1F5F9',
    },
    dark: {
      primary: '#06B6D4',
      accent: '#22D3EE',
      surface: '#1E293B',
      background: '#0B1220',
      textPrimary: '#F8FAFC',
      textSecondary: '#CBD5E1',
      success: '#10B981',
      error: '#EF4444',
      warning: '#F59E0B',
      border: '#334155',
      muted: '#1E293B',
    },
  },
};

// Module-level variables (not exported to avoid getter issues)
let currentTheme = 'modeA';
let currentMode = 'light';

export const setTheme = (theme, mode) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('preferredTheme', theme);
    localStorage.setItem('preferredMode', mode);
  }
  // Update exported variables
  currentTheme = theme;
  currentMode = mode;
  // Apply theme only on client side
  if (typeof window !== 'undefined') {
    applyTheme();
  }
};

export const getTheme = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('preferredTheme') || 'modeA';
  }
  return currentTheme;
};

export const getMode = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('preferredMode') || 'light';
  }
  return currentMode;
};

export const toggleMode = () => {
  const newMode = currentMode === 'light' ? 'dark' : 'light';
  setTheme(currentTheme, newMode);
};

export const applyTheme = () => {
  if (typeof window === 'undefined') return;
  
  // Always read from localStorage to get the latest values
  const themeName = localStorage.getItem('preferredTheme') || 'modeA';
  const modeName = localStorage.getItem('preferredMode') || 'light';
  
  // Update module variables
  currentTheme = themeName;
  currentMode = modeName;
  
  const theme = themes[themeName];
  if (!theme) return;
  
  const colors = theme[modeName];
  if (!colors) return;
  
  const root = document.documentElement;
  
  root.style.setProperty('--color-primary', colors.primary);
  root.style.setProperty('--color-accent', colors.accent);
  root.style.setProperty('--color-surface', colors.surface);
  root.style.setProperty('--color-background', colors.background);
  root.style.setProperty('--color-text-primary', colors.textPrimary);
  root.style.setProperty('--color-text-secondary', colors.textSecondary);
  root.style.setProperty('--color-success', colors.success);
  root.style.setProperty('--color-error', colors.error);
  root.style.setProperty('--color-warning', colors.warning);
  root.style.setProperty('--color-border', colors.border);
  root.style.setProperty('--color-muted', colors.muted);
  
  // Update dark class on html element
  if (modeName === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

// Internal function to update theme variables (used by ThemeProvider)
export const _updateThemeVars = (theme, mode) => {
  currentTheme = theme;
  currentMode = mode;
};

// Don't initialize theme immediately to avoid hydration errors
// Theme will be initialized by ThemeProvider component on client side

