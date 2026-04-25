import { createContext, useState, useContext, useEffect } from 'react';
import { theme } from 'antd';

const ThemeContext = createContext();

// Accent color presets
export const ACCENT_COLORS = [
    { key: 'green',  label: 'Electric',  color: '#00e87a', dim: 'rgba(0,232,122,0.1)',  glow: 'rgba(0,232,122,0.22)',  border: 'rgba(0,232,122,0.28)'  },
    { key: 'blue',   label: 'Ocean',     color: '#3b82f6', dim: 'rgba(59,130,246,0.1)', glow: 'rgba(59,130,246,0.22)', border: 'rgba(59,130,246,0.28)' },
    { key: 'purple', label: 'Midnight',  color: '#a855f7', dim: 'rgba(168,85,247,0.1)', glow: 'rgba(168,85,247,0.22)', border: 'rgba(168,85,247,0.28)' },
    { key: 'orange', label: 'Sunset',    color: '#f97316', dim: 'rgba(249,115,22,0.1)', glow: 'rgba(249,115,22,0.22)', border: 'rgba(249,115,22,0.28)' },
    { key: 'red',    label: 'Fire',      color: '#ef4444', dim: 'rgba(239,68,68,0.1)',  glow: 'rgba(239,68,68,0.22)',  border: 'rgba(239,68,68,0.28)'  },
    { key: 'amber',  label: 'Gold',      color: '#f59e0b', dim: 'rgba(245,158,11,0.1)', glow: 'rgba(245,158,11,0.22)', border: 'rgba(245,158,11,0.28)' },
];

// Dark theme variants (background palettes)
export const THEMES = {
    DARK: {
        key: 'dark',
        name: '🌑 Dark',
        isDark: true,
        bg: { base: '#060c18', card: '#0c1526', raised: '#131e33', hover: '#1a2740' },
        text: { primary: '#edf2ff', secondary: 'rgba(237,242,255,0.58)', tertiary: 'rgba(237,242,255,0.33)' },
        border: 'rgba(255,255,255,0.07)',
    },
    CARBON: {
        key: 'carbon',
        name: '⬛ Carbon',
        isDark: true,
        bg: { base: '#0a0a0a', card: '#141414', raised: '#1c1c1c', hover: '#242424' },
        text: { primary: '#f5f5f5', secondary: 'rgba(245,245,245,0.55)', tertiary: 'rgba(245,245,245,0.3)' },
        border: 'rgba(255,255,255,0.08)',
    },
    NAVY: {
        key: 'navy',
        name: '🔷 Navy',
        isDark: true,
        bg: { base: '#030712', card: '#0f172a', raised: '#1e293b', hover: '#273449' },
        text: { primary: '#f1f5f9', secondary: 'rgba(241,245,249,0.55)', tertiary: 'rgba(241,245,249,0.3)' },
        border: 'rgba(255,255,255,0.08)',
    },
    LIGHT: {
        key: 'light',
        name: '☀️ Light',
        isDark: false,
        bg: { base: '#f0f2f5', card: '#ffffff', raised: '#f8fafc', hover: '#e8ecf0' },
        text: { primary: '#0f172a', secondary: 'rgba(15,23,42,0.6)', tertiary: 'rgba(15,23,42,0.38)' },
        border: 'rgba(0,0,0,0.08)',
    },
};

export const FONT_SIZES = [
    { key: 'small',  label: 'S', base: 14, body: 13 },
    { key: 'medium', label: 'M', base: 16, body: 15 },
    { key: 'large',  label: 'L', base: 18, body: 17 },
];

function applyCssVars(themeObj, accentObj, fontSizeObj) {
    const r = document.documentElement.style;
    // Backgrounds
    r.setProperty('--bg-base',   themeObj.bg.base);
    r.setProperty('--bg-card',   themeObj.bg.card);
    r.setProperty('--bg-raised', themeObj.bg.raised);
    r.setProperty('--bg-hover',  themeObj.bg.hover);
    r.setProperty('--bg-primary',  themeObj.bg.base);
    r.setProperty('--bg-secondary', themeObj.bg.card);
    r.setProperty('--bg-glass',  themeObj.bg.card);
    r.setProperty('--bg-input',  themeObj.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)');
    r.setProperty('--header-bg', themeObj.isDark ? 'rgba(6,12,24,0.94)'    : 'rgba(255,255,255,0.95)');
    r.setProperty('--nav-bg',    themeObj.isDark ? 'rgba(6,12,24,0.97)'    : 'rgba(255,255,255,0.97)');
    r.setProperty('--logo-filter', themeObj.isDark ? 'brightness(0) invert(1)' : 'brightness(0)');
    // Text
    r.setProperty('--text-primary',   themeObj.text.primary);
    r.setProperty('--text-secondary', themeObj.text.secondary);
    r.setProperty('--text-tertiary',  themeObj.text.tertiary);
    // Borders
    r.setProperty('--border-color', themeObj.border);
    // Accent
    r.setProperty('--green',        accentObj.color);
    r.setProperty('--green-dim',    accentObj.dim);
    r.setProperty('--green-glow',   accentObj.glow);
    r.setProperty('--green-border', accentObj.border);
    r.setProperty('--primary-color', accentObj.color);
    r.setProperty('--primary-hover', accentObj.color);
    // Font size
    r.setProperty('--font-size', `${fontSizeObj.base}px`);
    document.body.style.fontSize = `${fontSizeObj.body}px`;
}

export const ThemeProvider = ({ children }) => {
    const [currentThemeKey, setCurrentThemeKey] = useState(
        () => localStorage.getItem('app-theme') || 'DARK'
    );
    const [accentKey, setAccentKey] = useState(
        () => localStorage.getItem('app-accent') || 'green'
    );
    const [fontSizeKey, setFontSizeKey] = useState(
        () => localStorage.getItem('app-font-size') || 'medium'
    );
    const [isCompact, setIsCompact] = useState(
        () => localStorage.getItem('app-compact') === 'true'
    );

    const currentTheme  = THEMES[currentThemeKey] || THEMES.DARK;
    const currentAccent = ACCENT_COLORS.find(a => a.key === accentKey) || ACCENT_COLORS[0];
    const currentFont   = FONT_SIZES.find(f => f.key === fontSizeKey) || FONT_SIZES[1];

    // Apply CSS vars whenever any setting changes
    useEffect(() => {
        applyCssVars(currentTheme, currentAccent, currentFont);
        document.body.setAttribute('data-theme', currentThemeKey.toLowerCase());
        localStorage.setItem('app-theme', currentThemeKey);
        localStorage.setItem('app-accent', accentKey);
        localStorage.setItem('app-font-size', fontSizeKey);
        localStorage.setItem('app-compact', String(isCompact));
    }, [currentThemeKey, accentKey, fontSizeKey, isCompact]);

    const themeConfig = {
        algorithm: [
            currentTheme.isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
            isCompact ? theme.compactAlgorithm : undefined,
        ].filter(Boolean),
        token: {
            colorPrimary: currentAccent.color,
            colorBgContainer: currentTheme.bg.card,
            colorBgElevated: currentTheme.bg.raised,
            colorBgBase: currentTheme.bg.base,
            colorBgLayout: currentTheme.bg.base,
            colorBorder: currentTheme.border,
            colorBorderSecondary: currentTheme.border,
            colorText: currentTheme.text.primary,
            colorTextSecondary: currentTheme.text.secondary,
            colorTextTertiary: currentTheme.text.tertiary,
            borderRadius: 10,
            fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif",
            controlHeight: isCompact ? 32 : 48,
            fontSize: currentFont.base,
        },
        components: {
            Button: { primaryShadow: `0 2px 12px ${currentAccent.glow}` },
            Input: { activeBorderColor: currentAccent.border, hoverBorderColor: currentAccent.dim },
            Select: { optionSelectedBg: currentAccent.dim },
            Menu: { darkItemBg: 'transparent', darkSubMenuItemBg: 'transparent' },
        }
    };

    return (
        <ThemeContext.Provider value={{
            currentThemeKey,
            changeTheme: (key) => setCurrentThemeKey(key),
            accentKey,
            changeAccent: (key) => setAccentKey(key),
            fontSizeKey,
            changeFontSize: (key) => setFontSizeKey(key),
            isCompact,
            toggleCompact: () => setIsCompact(p => !p),
            themeConfig,
            isDark: currentTheme.isDark,
        }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
