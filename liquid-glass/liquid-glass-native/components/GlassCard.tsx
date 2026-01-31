/**
 * GlassCard - React Native 玻璃态卡片组件
 */

import React, { useRef } from 'react';
import {
  View,
  Text,
  Animated,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
  GestureResponderEvent,
} from 'react-native';
import { colors, typography, spacing } from '../styles/theme';
import { glassCard, glassCardHoverable } from '../styles/glassEffects';

// ========== GlassCard 主组件 ==========
export interface GlassCardProps {
  /** 是否可点击（带悬停效果） */
  hoverable?: boolean;
  /** 子元素 */
  children: React.ReactNode;
  /** 点击事件 */
  onPress?: (event: GestureResponderEvent) => void;
  /** 自定义样式 */
  style?: ViewStyle;
  /** 测试 ID */
  testID?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  hoverable = false,
  children,
  onPress,
  style,
  testID,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (hoverable) {
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        useNativeDriver: true,
        speed: 50,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (hoverable) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 50,
      }).start();
    }
  };

  const cardStyle = hoverable ? glassCardHoverable : glassCard;

  if (hoverable && onPress) {
    return (
      <Animated.View
        style={[{ transform: [{ scale: scaleAnim }] }]}
        testID={testID}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[cardStyle, style]}
        >
          {children}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <View style={[cardStyle, style]} testID={testID}>
      {children}
    </View>
  );
};

// ========== GlassCardHeader ==========
export interface GlassCardHeaderProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const GlassCardHeader: React.FC<GlassCardHeaderProps> = ({
  children,
  style,
}) => {
  return <View style={[styles.header, style]}>{children}</View>;
};

// ========== GlassCardTitle ==========
export interface GlassCardTitleProps {
  children: React.ReactNode;
  style?: TextStyle;
}

export const GlassCardTitle: React.FC<GlassCardTitleProps> = ({
  children,
  style,
}) => {
  return (
    <Text style={[styles.title, typography.h3, style]}>
      {children}
    </Text>
  );
};

// ========== GlassCardDescription ==========
export interface GlassCardDescriptionProps {
  children: React.ReactNode;
  style?: TextStyle;
}

export const GlassCardDescription: React.FC<GlassCardDescriptionProps> = ({
  children,
  style,
}) => {
  return (
    <Text style={[styles.description, typography.bodySmall, style]}>
      {children}
    </Text>
  );
};

// ========== GlassCardContent ==========
export interface GlassCardContentProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const GlassCardContent: React.FC<GlassCardContentProps> = ({
  children,
  style,
}) => {
  return <View style={[styles.content, style]}>{children}</View>;
};

// ========== GlassCardFooter ==========
export interface GlassCardFooterProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const GlassCardFooter: React.FC<GlassCardFooterProps> = ({
  children,
  style,
}) => {
  return <View style={[styles.footer, style]}>{children}</View>;
};

// ========== 样式 ==========
const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.s,
  },
  title: {
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  description: {
    color: colors.textSecondary,
  },
  content: {
    // 内容区域样式
  },
  footer: {
    marginTop: spacing.m,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
  },
});
