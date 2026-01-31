import { useState, useEffect } from 'react';
import { ThemeName, getTheme, setTheme as setThemeUtil } from '../utils/theme';

export const useTheme = () => {
    const [theme, setThemeState] = useState<ThemeName>(getTheme());

    const setTheme = (newTheme: ThemeName) => {
        setThemeUtil(newTheme);
        setThemeState(newTheme);
    };

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
    };

    // 监听系统主题变化
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const handleChange = (e: MediaQueryListEvent) => {
            const savedTheme = localStorage.getItem('liquid-glass-theme');
            if (!savedTheme) {
                setThemeState(e.matches ? 'dark' : 'light');
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    return { theme, setTheme, toggleTheme };
};
