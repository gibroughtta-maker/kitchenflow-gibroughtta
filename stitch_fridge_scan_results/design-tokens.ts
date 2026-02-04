/**
 * KitchenFlow 设计稿 - React Native 可用设计 token
 * 供 kitchenflow-app 的 theme.ts / glassmorphism 对齐设计稿颜色、圆角、阴影
 *
 * 使用：在 kitchenflow-app/src/styles/theme.ts 中引用或复制所需字段
 * 例如: import { stitchColors, stitchBorderRadius } from '../../stitch_fridge_scan_results/design-tokens';
 */

/** 设计稿主色与背景（与 tailwind-theme.js 一致） */
export const stitchColors = {
  primary: '#3b82f6',
  primaryAlt: '#007bff',
  asdaGreen: '#78BE20',
  tescoBlue: '#00539F',
  lidlBlue: '#0050AA',
  lidlRed: '#E3000F',
  lidlYellow: '#FFD500',
  backgroundLight: '#f2f4f6',
  backgroundDark: '#0f1923',
  /** 玻璃/液态卡片 */
  glassLight: 'rgba(255, 255, 255, 0.65)',
  glassDark: 'rgba(0, 0, 0, 0.55)',
  glassBorder: 'rgba(255, 255, 255, 0.3)',
  /** 状态标签（与 design-system.css 的 liquid-tag-* 一致） */
  tagFresh: '#34C759',
  tagUseSoon: '#EAB308',
  tagPriority: '#EF4444',
  tagFreshBg: 'rgba(34, 197, 94, 0.25)',
  tagUseSoonBg: 'rgba(234, 179, 8, 0.25)',
  tagPriorityBg: 'rgba(239, 68, 68, 0.25)',
} as const;

/** 圆角（px，RN 用数字） */
export const stitchBorderRadius = {
  s: 8,
  m: 12,
  l: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  full: 9999,
} as const;

/** 设计稿间距（与现有 spacing 对齐时可选用） */
export const stitchSpacing = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 48,
} as const;

/**
 * 玻璃卡片阴影 - 转为 React Native 的 shadow / elevation
 * iOS 用 shadow*，Android 用 elevation
 */
export const stitchShadows = {
  glass: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 32,
    elevation: 8,
  },
  glassCard: {
    shadowColor: '#1f2687',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 32,
    elevation: 8,
  },
  iconGlowGreen: {
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 6,
  },
  iconGlowRed: {
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 6,
  },
  iconGlowYellow: {
    shadowColor: '#eab308',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 6,
  },
} as const;
