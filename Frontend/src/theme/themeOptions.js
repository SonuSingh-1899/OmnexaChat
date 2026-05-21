export const UI_THEME_KEY = 'uiTheme';

export const THEME_OPTIONS = {
  // Black & White Mix (Dark Gray + White)
  charcoal: {
    key: 'charcoal',
    label: 'Charcoal',
    pageBackground: '#1a1a1a',
    surface: '#262626',
    subtle: '#2d2d2d',
    border: '#404040',
    accent: '#e5e5e5',
    accentText: '#1a1a1a',
    muted: '#a3a3a3',
    text: '#f5f5f5',
    shadow: 'rgba(0, 0, 0, 0.3)',
  },
  
  // // Pure Black + Blue
  // obsidian: {
  //   key: 'obsidian',
  //   label: 'Obsidian',
  //   pageBackground: '#000000',
  //   surface: '#0a0a0a',
  //   subtle: '#111111',
  //   border: '#1a1a1a',
  //   accent: '#3b82f6',
  //   accentText: '#ffffff',
  //   muted: '#6b7280',
  //   text: '#ffffff',
  //   shadow: 'rgba(59, 130, 246, 0.2)',
  // },
  
  // White & Black (Pure Light)
  pureLight: {
    key: 'pureLight',
    label: 'Pure Light',
    pageBackground: '#ffffff',
    surface: '#ffffff',
    subtle: '#f5f5f5',
    border: '#e5e5e5',
    accent: '#000000',
    accentText: '#ffffff',
    muted: '#737373',
    text: '#000000',
    shadow: 'rgba(0, 0, 0, 0.08)',
  },
};

export const DEFAULT_THEME_KEY = 'pureLight';

export const getTheme = (themeKey) => THEME_OPTIONS[themeKey] || THEME_OPTIONS[DEFAULT_THEME_KEY];