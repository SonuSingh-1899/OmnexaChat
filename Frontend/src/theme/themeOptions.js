export const UI_THEME_KEY = 'uiTheme';

export const THEME_OPTIONS = {
  sand: {
    key: 'sand',
    label: 'Logo White',
    pageBackground: '#f6f6f7',
    surface: '#ffffff',
    subtle: '#f3f4f6',
    border: '#e5e7eb',
    accent: '#111111',
    accentText: '#ffffff',
    muted: '#6b7280',
    text: '#111111',
    shadow: 'rgba(17, 17, 17, 0.08)',
  },
  ocean: {
    key: 'ocean',
    label: 'Ink Silver',
    pageBackground: '#f3f4f6',
    surface: '#ffffff',
    subtle: '#eef0f3',
    border: '#d7dbe2',
    accent: '#1f2937',
    accentText: '#ffffff',
    muted: '#667085',
    text: '#111827',
    shadow: 'rgba(17, 24, 39, 0.10)',
  },
  forest: {
    key: 'forest',
    label: 'Obsidian',
    pageBackground: '#f5f5f5',
    surface: '#ffffff',
    subtle: '#f1f1f1',
    border: '#dddddd',
    accent: '#000000',
    accentText: '#ffffff',
    muted: '#707070',
    text: '#121212',
    shadow: 'rgba(0, 0, 0, 0.12)',
  },
};

export const DEFAULT_THEME_KEY = 'sand';

export const getTheme = (themeKey) => THEME_OPTIONS[themeKey] || THEME_OPTIONS[DEFAULT_THEME_KEY];
