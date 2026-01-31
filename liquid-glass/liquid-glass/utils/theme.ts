export type ThemeName = 'light' | 'dark';

export interface CustomThemeConfig {
    blur?: number;
    opacity?: number;
    tintColor?: string;
    borderColor?: string;
    saturation?: number;
}

/**
 * 设置主题
 */
export const setTheme = (theme: ThemeName) => {
    const root = document.documentElement;

    if (theme === 'dark') {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }

    localStorage.setItem('liquid-glass-theme', theme);
};

/**
 * 获取当前主题
 */
export const getTheme = (): ThemeName => {
    const savedTheme = localStorage.getItem('liquid-glass-theme') as ThemeName;
    if (savedTheme) return savedTheme;

    // 检测系统主题
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
};

/**
 * 自定义主题配置
 */
export const setCustomTheme = (config: CustomThemeConfig) => {
    const root = document.documentElement;

    if (config.blur !== undefined) {
        root.style.setProperty('--glass-blur', `${config.blur}px`);
    }

    if (config.opacity !== undefined) {
        root.style.setProperty('--glass-opacity', config.opacity.toString());
    }

    if (config.tintColor) {
        root.style.setProperty('--glass-tint', config.tintColor);
    }

    if (config.borderColor) {
        root.style.setProperty('--glass-border', config.borderColor);
    }

    if (config.saturation !== undefined) {
        root.style.setProperty('--glass-saturation', `${config.saturation}%`);
    }
};

/**
 * 重置为默认主题
 */
export const resetTheme = () => {
    const root = document.documentElement;
    const props = [
        '--glass-blur',
        '--glass-opacity',
        '--glass-tint',
        '--glass-border',
        '--glass-saturation'
    ];

    props.forEach(prop => root.style.removeProperty(prop));
};
