/**
 * GlassButton - React Native 玻璃态按钮组件
 */

import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  Animated,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  GestureResponderEvent,
} from 'react-native';
import { colors, borderRadius, typography } from '../styles/theme';
import { glassButton, glassButtonPrimary } from '../styles/glassEffects';

export interface GlassButtonProps {
  /** 按钮变体 */
  variant?: 'default' | 'glass' | 'outline' | 'ghost';
  /** 按钮尺寸 */
  size?: 'sm' | 'md' | 'lg';
  /** 是否加载中 */
  loading?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 左侧图标 */
  icon?: React.ReactNode;
  /** 右侧图标 */
  rightIcon?: React.ReactNode;
  /** 按钮文本 */
  children: React.ReactNode;
  /** 点击事件 */
  onPress?: (event: GestureResponderEvent) => void;
  /** 长按事件 */
  onLongPress?: (event: GestureResponderEvent) => void;
  /** 自定义容器样式 */
  style?: ViewStyle;
  /** 自定义文本样式 */
  textStyle?: TextStyle;
  /** 测试 ID */
  testID?: string;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  variant = 'default',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  rightIcon,
  children,
  onPress,
  onLongPress,
  style,
  textStyle,
  testID,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // 按下动画
  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  // 释放动画
  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  // 获取变体样式
  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'glass':
        return glassButton;
      case 'outline':
        return {
          ...glassButton,
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: colors.primary,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderRadius: borderRadius.m,
        };
      case 'default':
      default:
        return glassButtonPrimary;
    }
  };

  // 获取尺寸样式
  const getSizeStyle = (): ViewStyle => {
    switch (size) {
      case 'sm':
        return { paddingVertical: 8, paddingHorizontal: 16, minHeight: 36 };
      case 'lg':
        return { paddingVertical: 16, paddingHorizontal: 32, minHeight: 56 };
      case 'md':
      default:
        return { paddingVertical: 12, paddingHorizontal: 24, minHeight: 44 };
    }
  };

  // 获取文本颜色
  const getTextColor = (): string => {
    if (disabled) return colors.textTertiary;
    if (variant === 'default') return colors.textWhite;
    if (variant === 'outline') return colors.primary;
    return colors.textPrimary;
  };

  const isDisabled = disabled || loading;

  return (
    <Animated.View
      style={[
        { transform: [{ scale: scaleAnim }] },
        isDisabled && styles.disabledContainer,
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        disabled={isDisabled}
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        testID={testID}
        style={[
          styles.button,
          getVariantStyle(),
          getSizeStyle(),
          style,
        ]}
      >
        <View style={styles.content}>
          {loading && (
            <ActivityIndicator
              size="small"
              color={getTextColor()}
              style={styles.loader}
            />
          )}
          {!loading && icon && <View style={styles.icon}>{icon}</View>}
          <Text
            style={[
              styles.text,
              typography.button,
              { color: getTextColor() },
              textStyle,
            ]}
          >
            {children}
          </Text>
          {!loading && rightIcon && <View style={styles.icon}>{rightIcon}</View>}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  text: {
    textAlign: 'center',
  },
  icon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loader: {
    marginRight: 4,
  },
  disabledContainer: {
    opacity: 0.5,
  },
});
