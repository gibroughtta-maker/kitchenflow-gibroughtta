/**
 * GlassDialog - React Native 玻璃态对话框组件
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Dimensions,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../styles/theme';
import { glassModal } from '../styles/glassEffects';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface GlassDialogProps {
  /** 是否显示对话框 */
  visible: boolean;
  /** 关闭对话框回调 */
  onClose: () => void;
  /** 标题 */
  title?: string;
  /** 内容 */
  children: React.ReactNode;
  /** 底部按钮区域 */
  footer?: React.ReactNode;
  /** 点击背景是否关闭 */
  closeOnBackdropPress?: boolean;
  /** 容器样式 */
  containerStyle?: ViewStyle;
  /** 标题样式 */
  titleStyle?: TextStyle;
}

export const GlassDialog: React.FC<GlassDialogProps> = ({
  visible,
  onClose,
  title,
  children,
  footer,
  closeOnBackdropPress = true,
  containerStyle,
  titleStyle,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          speed: 12,
          bounciness: 8,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, scaleAnim]);

  const handleBackdropPress = () => {
    if (closeOnBackdropPress) {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* 背景遮罩 */}
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.backdropTouchable}
            activeOpacity={1}
            onPress={handleBackdropPress}
          />
        </Animated.View>

        {/* 对话框内容 */}
        <Animated.View
          style={[
            styles.dialogContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={[glassModal, styles.dialog, containerStyle]}>
            {/* 标题 */}
            {title && (
              <View style={styles.header}>
                <Text style={[styles.title, typography.h3, titleStyle]}>
                  {title}
                </Text>
              </View>
            )}

            {/* 内容区域 */}
            <View style={styles.content}>{children}</View>

            {/* 底部按钮区域 */}
            {footer && <View style={styles.footer}>{footer}</View>}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdropTouchable: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  dialogContainer: {
    width: SCREEN_WIDTH - spacing.xl * 2,
    maxWidth: 400,
  },
  dialog: {
    width: '100%',
  },
  header: {
    marginBottom: spacing.m,
  },
  title: {
    color: colors.textPrimary,
    textAlign: 'center',
  },
  content: {
    marginBottom: spacing.m,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.m,
  },
});
