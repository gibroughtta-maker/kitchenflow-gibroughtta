/**
 * GlassInput - React Native 玻璃态输入框组件
 */

import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  Text,
  Animated,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps,
  NativeSyntheticEvent,
  TextInputFocusEventData,
} from 'react-native';
import { colors, typography, spacing } from '../styles/theme';
import { glassInput, glassInputError, glassInputFocused } from '../styles/glassEffects';

export interface GlassInputProps extends Omit<TextInputProps, 'style'> {
  /** 是否显示错误状态 */
  error?: boolean;
  /** 错误提示信息 */
  errorMessage?: string;
  /** 输入框标签 */
  label?: string;
  /** 左侧图标 */
  leftIcon?: React.ReactNode;
  /** 右侧图标 */
  rightIcon?: React.ReactNode;
  /** 容器样式 */
  containerStyle?: ViewStyle;
  /** 输入框样式 */
  inputStyle?: TextStyle;
  /** 标签样式 */
  labelStyle?: TextStyle;
}

export const GlassInput = React.forwardRef<TextInput, GlassInputProps>(
  (
    {
      error = false,
      errorMessage,
      label,
      leftIcon,
      rightIcon,
      containerStyle,
      inputStyle,
      labelStyle,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const borderAnim = useRef(new Animated.Value(0)).current;

    const handleFocus = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
      setIsFocused(true);
      Animated.timing(borderAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
      onFocus?.(e);
    };

    const handleBlur = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
      setIsFocused(false);
      Animated.timing(borderAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
      onBlur?.(e);
    };

    // 根据状态获取输入框样式
    const getInputContainerStyle = (): ViewStyle[] => {
      const baseStyles: ViewStyle[] = [glassInput];

      if (error) {
        baseStyles.push(glassInputError);
      } else if (isFocused) {
        baseStyles.push(glassInputFocused);
      }

      return baseStyles;
    };

    return (
      <View style={[styles.container, containerStyle]}>
        {/* 标签 */}
        {label && (
          <Text style={[styles.label, typography.bodySmall, labelStyle]}>
            {label}
          </Text>
        )}

        {/* 输入框容器 */}
        <Animated.View style={[styles.inputContainer, ...getInputContainerStyle()]}>
          {/* 左侧图标 */}
          {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

          {/* 输入框 */}
          <TextInput
            ref={ref}
            style={[
              styles.input,
              typography.body,
              leftIcon && styles.inputWithLeftIcon,
              rightIcon && styles.inputWithRightIcon,
              inputStyle,
            ]}
            placeholderTextColor={colors.textTertiary}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...props}
          />

          {/* 右侧图标 */}
          {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
        </Animated.View>

        {/* 错误提示 */}
        {error && errorMessage && (
          <Text style={[styles.errorMessage, typography.caption]}>
            {errorMessage}
          </Text>
        )}
      </View>
    );
  }
);

GlassInput.displayName = 'GlassInput';

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    padding: 0, // 移除默认 padding，由容器控制
  },
  inputWithLeftIcon: {
    marginLeft: spacing.s,
  },
  inputWithRightIcon: {
    marginRight: spacing.s,
  },
  leftIcon: {
    marginLeft: spacing.m,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightIcon: {
    marginRight: spacing.m,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorMessage: {
    color: colors.error,
    marginTop: spacing.xs,
  },
});
