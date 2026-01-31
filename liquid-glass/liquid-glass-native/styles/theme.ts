/**
 * Liquid Glass Native - 主题配置
 * React Native 版本的玻璃态设计系统
 */

export const colors = {
  // 主色调
  primary: '#007AFF',
  primaryLight: '#5AC8FA',
  primaryDark: '#0051D5',

  // 玻璃态背景 (使用半透明白色)
  glassLight: 'rgba(255, 255, 255, 0.7)',
  glassMedium: 'rgba(255, 255, 255, 0.5)',
  glassDark: 'rgba(0, 0, 0, 0.15)',

  // 玻璃态边框
  glassBorder: 'rgba(255, 255, 255, 0.3)',
  glassBorderDark: 'rgba(0, 0, 0, 0.1)',

  // 背景色
  background: '#F2F2F7',
  backgroundSecondary: '#E5E5EA',
  white: '#FFFFFF',
  black: '#000000',

  // 文字颜色
  textPrimary: '#000000',
  textSecondary: '#6C6C70',
  textTertiary: '#8E8E93',
  textWhite: '#FFFFFF',

  // 状态颜色
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  info: '#5AC8FA',

  // 阴影颜色
  shadowLight: 'rgba(0, 0, 0, 0.1)',
  shadowMedium: 'rgba(0, 0, 0, 0.2)',
  shadowDark: 'rgba(0, 0, 0, 0.3)',
} as const;

export const spacing = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 48,
} as const;

export const borderRadius = {
  xs: 4,
  s: 8,
  m: 12,
  l: 16,
  xl: 24,
  full: 9999,
} as const;

export const typography = {
  h1: {
    fontSize: 34,
    fontWeight: '700' as const,
    lineHeight: 41,
  },
  h2: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 34,
  },
  h3: {
    fontSize: 22,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  h4: {
    fontSize: 17,
    fontWeight: '600' as const,
    lineHeight: 22,
  },
  body: {
    fontSize: 17,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  bodySmall: {
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18,
  },
  button: {
    fontSize: 17,
    fontWeight: '600' as const,
    lineHeight: 22,
  },
} as const;

export const shadows = {
  small: {
    shadowColor: colors.shadowLight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: colors.shadowLight,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: colors.shadowMedium,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

export type ColorKey = keyof typeof colors;
export type SpacingKey = keyof typeof spacing;
export type BorderRadiusKey = keyof typeof borderRadius;
export type TypographyKey = keyof typeof typography;
export type ShadowKey = keyof typeof shadows;
