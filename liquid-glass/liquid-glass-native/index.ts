/**
 * Liquid Glass Native
 * React Native 版本的玻璃态 UI 组件库
 * 
 * @description
 * 为 React Native / Expo 应用提供现代化的玻璃态设计组件
 * 
 * @author KitchenFlow Team
 * @version 1.0.0
 */

// ========== 组件 ==========
export { GlassButton } from './components/GlassButton';
export type { GlassButtonProps } from './components/GlassButton';

export {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardDescription,
  GlassCardContent,
  GlassCardFooter,
} from './components/GlassCard';
export type {
  GlassCardProps,
  GlassCardHeaderProps,
  GlassCardTitleProps,
  GlassCardDescriptionProps,
  GlassCardContentProps,
  GlassCardFooterProps,
} from './components/GlassCard';

export { GlassInput } from './components/GlassInput';
export type { GlassInputProps } from './components/GlassInput';

export { GlassDialog } from './components/GlassDialog';
export type { GlassDialogProps } from './components/GlassDialog';

export { Toast, ToastContainer } from './components/GlassToast';
export type { ToastConfig, ToastType } from './components/GlassToast';

// ========== 样式系统 ==========
export { colors, spacing, borderRadius, typography, shadows } from './styles/theme';
export type {
  ColorKey,
  SpacingKey,
  BorderRadiusKey,
  TypographyKey,
  ShadowKey,
} from './styles/theme';

export {
  glassBase,
  glassCard,
  glassCardHoverable,
  glassButton,
  glassButtonPrimary,
  glassInput,
  glassNavBar,
  glassFloatingButton,
  glassModal,
  glassChip,
  glassInputError,
  glassInputFocused,
} from './styles/glassEffects';
