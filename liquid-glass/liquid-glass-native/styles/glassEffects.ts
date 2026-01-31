/**
 * Liquid Glass Native - 玻璃态效果样式
 * React Native 无法使用 backdrop-filter，使用半透明背景和阴影模拟玻璃效果
 */

import { ViewStyle, Platform } from 'react-native';
import { colors, borderRadius, shadows } from './theme';

/**
 * 基础玻璃效果
 */
export const glassBase: ViewStyle = {
  backgroundColor: colors.glassLight,
  borderWidth: 1,
  borderColor: colors.glassBorder,
  borderRadius: borderRadius.l,
  overflow: 'hidden',
  ...shadows.medium,
};

/**
 * 玻璃卡片效果
 */
export const glassCard: ViewStyle = {
  ...glassBase,
  padding: 16,
};

/**
 * 玻璃卡片 - 可悬停效果 (仅用于视觉参考，实际交互通过 Animated 实现)
 */
export const glassCardHoverable: ViewStyle = {
  ...glassCard,
  ...shadows.large,
};

/**
 * 玻璃按钮效果
 */
export const glassButton: ViewStyle = {
  backgroundColor: colors.glassLight,
  borderWidth: 1,
  borderColor: colors.glassBorder,
  borderRadius: borderRadius.m,
  paddingVertical: 12,
  paddingHorizontal: 24,
  ...shadows.small,
};

/**
 * 主要按钮效果（实心）
 */
export const glassButtonPrimary: ViewStyle = {
  backgroundColor: colors.primary,
  borderRadius: borderRadius.m,
  paddingVertical: 12,
  paddingHorizontal: 24,
  ...shadows.medium,
};

/**
 * 玻璃输入框效果
 */
export const glassInput: ViewStyle = {
  backgroundColor: colors.glassLight,
  borderWidth: 1,
  borderColor: colors.glassBorder,
  borderRadius: borderRadius.m,
  paddingVertical: 12,
  paddingHorizontal: 16,
  fontSize: 17,
  ...Platform.select({
    ios: {
      shadowColor: colors.shadowLight,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 4,
    },
    android: {
      elevation: 2,
    },
  }),
};

/**
 * 玻璃容器 - 导航栏
 */
export const glassNavBar: ViewStyle = {
  backgroundColor: colors.glassLight,
  borderBottomWidth: 1,
  borderBottomColor: colors.glassBorder,
  ...Platform.select({
    ios: {
      shadowColor: colors.shadowLight,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 8,
    },
    android: {
      elevation: 4,
    },
  }),
};

/**
 * 玻璃浮动按钮
 */
export const glassFloatingButton: ViewStyle = {
  backgroundColor: colors.white,
  borderRadius: borderRadius.full,
  width: 56,
  height: 56,
  justifyContent: 'center',
  alignItems: 'center',
  ...shadows.large,
};

/**
 * 玻璃对话框/模态框
 */
export const glassModal: ViewStyle = {
  backgroundColor: colors.glassLight,
  borderRadius: borderRadius.xl,
  padding: 24,
  borderWidth: 1,
  borderColor: colors.glassBorder,
  ...shadows.large,
};

/**
 * 玻璃标签效果
 */
export const glassChip: ViewStyle = {
  backgroundColor: colors.glassMedium,
  borderWidth: 1,
  borderColor: colors.glassBorder,
  borderRadius: borderRadius.full,
  paddingVertical: 6,
  paddingHorizontal: 12,
  ...shadows.small,
};

/**
 * 错误状态边框
 */
export const glassInputError: ViewStyle = {
  borderColor: colors.error,
  borderWidth: 2,
};

/**
 * 聚焦状态边框
 */
export const glassInputFocused: ViewStyle = {
  borderColor: colors.primary,
  borderWidth: 2,
  ...shadows.medium,
};
