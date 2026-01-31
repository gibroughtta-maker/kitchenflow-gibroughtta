/**
 * GlassToast - React Native 玻璃态提示组件
 * 简化版本，使用函数式 API
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../styles/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastConfig {
  message: string;
  type?: ToastType;
  duration?: number;
  position?: 'top' | 'center' | 'bottom';
}

interface ToastProps extends ToastConfig {
  visible: boolean;
  onHide: () => void;
}

const GlassToastComponent: React.FC<ToastProps> = ({
  visible,
  message,
  type = 'info',
  position = 'bottom',
  duration = 3000,
  onHide,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (visible) {
      // 显示动画
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          speed: 12,
          bounciness: 8,
        }),
      ]).start();

      // 自动隐藏
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 50,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => {
          onHide();
        });
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, duration, fadeAnim, translateY, onHide]);

  if (!visible) return null;

  const getTypeStyle = () => {
    switch (type) {
      case 'success':
        return { backgroundColor: colors.success, borderColor: colors.success };
      case 'error':
        return { backgroundColor: colors.error, borderColor: colors.error };
      case 'warning':
        return { backgroundColor: colors.warning, borderColor: colors.warning };
      case 'info':
      default:
        return { backgroundColor: colors.info, borderColor: colors.info };
    }
  };

  const getPositionStyle = () => {
    switch (position) {
      case 'top':
        return { top: spacing.xxl };
      case 'center':
        return { top: '50%', transform: [{ translateY: -25 }] };
      case 'bottom':
      default:
        return { bottom: spacing.xxl };
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        getPositionStyle(),
        {
          opacity: fadeAnim,
          transform: [{ translateY }],
        },
      ]}
    >
      <View style={[styles.toast, getTypeStyle()]}>
        <Text style={[styles.message, typography.bodySmall]}>
          {message}
        </Text>
      </View>
    </Animated.View>
  );
};

// Toast 管理器 (简化版本 - 实际使用中可以用第三方库如 react-native-toast-message)
let toastRef: ((config: ToastConfig) => void) | null = null;

export const Toast = {
  show: (config: ToastConfig) => {
    if (toastRef) {
      toastRef(config);
    } else {
      console.warn('Toast not initialized. Make sure to add <ToastContainer /> to your app root.');
    }
  },
  success: (message: string, duration = 3000) => {
    Toast.show({ message, type: 'success', duration });
  },
  error: (message: string, duration = 3000) => {
    Toast.show({ message, type: 'error', duration });
  },
  warning: (message: string, duration = 3000) => {
    Toast.show({ message, type: 'warning', duration });
  },
  info: (message: string, duration = 3000) => {
    Toast.show({ message, type: 'info', duration });
  },
};

// Toast 容器组件 - 需要在 App 根组件中使用
export const ToastContainer: React.FC = () => {
  const [toastConfig, setToastConfig] = React.useState<ToastConfig | null>(null);
  const [visible, setVisible] = React.useState(false);

  useEffect(() => {
    toastRef = (config: ToastConfig) => {
      setToastConfig(config);
      setVisible(true);
    };

    return () => {
      toastRef = null;
    };
  }, []);

  const handleHide = () => {
    setVisible(false);
  };

  if (!toastConfig) return null;

  return (
    <GlassToastComponent
      visible={visible}
      message={toastConfig.message}
      type={toastConfig.type}
      duration={toastConfig.duration}
      position={toastConfig.position}
      onHide={handleHide}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.m,
    right: spacing.m,
    alignItems: 'center',
    zIndex: 9999,
  },
  toast: {
    minWidth: SCREEN_WIDTH - spacing.xl * 2,
    maxWidth: SCREEN_WIDTH - spacing.xl * 2,
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.l,
    borderRadius: borderRadius.m,
    borderWidth: 1,
    ...shadows.large,
  },
  message: {
    color: colors.textWhite,
    textAlign: 'center',
  },
});
