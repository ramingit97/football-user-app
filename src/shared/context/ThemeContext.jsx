import { createContext, useState, useContext, useEffect } from 'react';
import { theme } from 'antd';

const ThemeContext = createContext();

export const THEMES = {
    FIELD: {
        key: 'field',
        name: 'Electric Pitch (Default)',
        token: {
            colorPrimary: '#00e87a',
            colorBgContainer: '#0c1526',
            colorBgElevated: '#131e33',
            colorBgBase: '#060c18',
            colorBgLayout: '#060c18',
            colorBorder: 'rgba(255,255,255,0.07)',
            colorBorderSecondary: 'rgba(255,255,255,0.05)',
            colorText: '#edf2ff',
            colorTextSecondary: 'rgba(237,242,255,0.58)',
            colorTextTertiary: 'rgba(237,242,255,0.33)',
            borderRadius: 10,
        },
        components: {
            Button: { primaryShadow: '0 2px 12px rgba(0,232,122,0.3)' },
            Input: { activeBorderColor: 'rgba(0,232,122,0.4)', hoverBorderColor: 'rgba(0,232,122,0.3)' },
            Select: { optionSelectedBg: 'rgba(0,232,122,0.1)' },
        }
    },
    OCEAN: {
        key: 'ocean',
        name: 'Ocean',
        token: {
            colorPrimary: '#1890ff',
            colorBgContainer: 'rgba(16, 35, 50, 0.8)',
            colorBgElevated: '#0a1a2a',
            colorBorder: 'rgba(24, 144, 255, 0.3)',
            borderRadius: 16,
        },
        components: {
            Button: { primaryShadow: '0 4px 16px rgba(24, 144, 255, 0.3)' },
            Input: { activeBorderColor: '#1890ff', hoverBorderColor: '#40a9ff' },
            Select: { optionSelectedBg: 'rgba(24, 144, 255, 0.2)' },
        }
    },
    SUNSET: {
        key: 'sunset',
        name: 'Sunset',
        token: {
            colorPrimary: '#fa541c',
            colorBgContainer: 'rgba(40, 20, 20, 0.8)',
            colorBgElevated: '#2a1010',
            colorBorder: 'rgba(250, 84, 28, 0.3)',
            borderRadius: 8,
        },
        components: {
            Button: { primaryShadow: '0 4px 16px rgba(250, 84, 28, 0.3)' },
            Input: { activeBorderColor: '#fa541c', hoverBorderColor: '#ff7a45' },
            Select: { optionSelectedBg: 'rgba(250, 84, 28, 0.2)' },
        }
    },
    MIDNIGHT: {
        key: 'midnight',
        name: 'Midnight',
        token: {
            colorPrimary: '#722ed1',
            colorBgContainer: 'rgba(20, 10, 30, 0.9)',
            colorBgElevated: '#120320',
            colorBorder: 'rgba(114, 46, 209, 0.3)',
            borderRadius: 4,
        },
        components: {
            Button: { primaryShadow: '0 4px 16px rgba(114, 46, 209, 0.4)' },
            Input: { activeBorderColor: '#722ed1', hoverBorderColor: '#9254de' },
            Select: { optionSelectedBg: 'rgba(114, 46, 209, 0.2)' },
        }
    }
};

export const ThemeProvider = ({ children }) => {
    const [currentThemeKey, setCurrentThemeKey] = useState(() => {
        return localStorage.getItem('app-theme') || 'FIELD';
    });

    const [isCompact, setIsCompact] = useState(false);

    useEffect(() => {
        localStorage.setItem('app-theme', currentThemeKey);
        // Update body class for global CSS overrides if needed
        document.body.setAttribute('data-theme', currentThemeKey.toLowerCase());
    }, [currentThemeKey]);

    const currentTheme = THEMES[currentThemeKey];

    const themeConfig = {
        algorithm: [theme.darkAlgorithm, isCompact ? theme.compactAlgorithm : undefined].filter(Boolean),
        token: {
            ...currentTheme.token,
            fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif",
            controlHeight: isCompact ? 32 : 48,
            fontSize: isCompact ? 14 : 16,
        },
        components: {
            ...currentTheme.components,
            Menu: {
                darkItemBg: 'transparent',
                darkSubMenuItemBg: 'transparent',
            }
        }
    };

    const changeTheme = (key) => {
        const themeEntry = Object.entries(THEMES).find(([_, value]) => value.key === key);
        if (themeEntry) {
            setCurrentThemeKey(themeEntry[0]);
        }
    };

    return (
        <ThemeContext.Provider value={{
            currentThemeKey,
            changeTheme,
            themeConfig,
            isCompact,
            toggleCompact: () => setIsCompact(!isCompact)
        }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
