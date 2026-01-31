# 🎨 修订版 UI 布局设计

**创建时间:** 2026-01-26  
**用户需求:** 
1. ✅ 小票上传放在首页下方
2. ✅ 设置按钮放在右上角
3. ✅ 直接从相册上传的按钮

---

## 📱 新的 HomeScreen 布局

### 视觉效果

```
┌─────────────────────────────────┐
│  KitchenFlow           ⚙️       │ ← Header (设置在右上角)
├─────────────────────────────────┤
│                                 │
│                                 │
│       [相机预览]                 │
│                                 │
│                                 │
├─────────────────────────────────┤
│ 🍜      🛒      📸             │ ← QuickAccessBar (3个按钮)
│Cravings Shopping Fridge         │
├─────────────────────────────────┤
│          [拍照按钮]              │ ← FloatingActionButton
├─────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐ │
│ │ 🧾 扫描小票  │ │ 📤 相册上传 │ │ ← 新增按钮区域
│ └─────────────┘ └─────────────┘ │
└─────────────────────────────────┘
```

### 布局说明

#### 1. Header 区域 (顶部)
```typescript
<View style={styles.header}>
  <Text style={styles.logo}>KitchenFlow</Text>
  <TouchableOpacity 
    style={styles.settingsButton}
    onPress={() => navigation.navigate('Settings')}
  >
    <Text style={styles.settingsIcon}>⚙️</Text>
  </TouchableOpacity>
</View>
```

**变化:**
- ✅ 设置按钮从底部移到右上角
- ✅ 更符合常见 App 设计习惯

#### 2. QuickAccessBar (简化为3个按钮)
```typescript
<QuickAccessBar
  onCravingsPress={() => navigation.navigate('Cravings')}
  onShoppingPress={() => navigation.navigate('ShoppingList')}
  onFridgeScanPress={() => navigation.navigate('FridgeScan')}
  // 移除 onSettingsPress
/>
```

**变化:**
- ✅ 从4个按钮减少到3个
- ✅ 更宽敞,更易点击
- ✅ 设置移到右上角

#### 3. 新增功能按钮区域 (底部)
```typescript
<View style={styles.actionButtons}>
  {/* 扫描小票 */}
  <TouchableOpacity
    style={styles.actionButton}
    onPress={() => navigation.navigate('ReceiptScan')}
  >
    <View style={styles.actionButtonContent}>
      <Text style={styles.actionButtonIcon}>🧾</Text>
      <Text style={styles.actionButtonText}>扫描小票</Text>
    </View>
  </TouchableOpacity>

  {/* 相册上传 */}
  <TouchableOpacity
    style={styles.actionButton}
    onPress={handleUploadFromGallery}
  >
    <View style={styles.actionButtonContent}>
      <Text style={styles.actionButtonIcon}>📤</Text>
      <Text style={styles.actionButtonText}>相册上传</Text>
    </View>
  </TouchableOpacity>
</View>
```

**功能:**
- ✅ 扫描小票: 跳转到小票扫描页面
- ✅ 相册上传: 直接从相册选择图片上传

---

## 🔧 完整实现代码

### HomeScreen.tsx (修订版)

```typescript
import React, { useState, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { FloatingActionButton } from '../components/FloatingActionButton';
import { QuickAccessBar } from '../components/QuickAccessBar';
import { 
  colors, 
  spacing, 
  typography, 
  glassNavBar, 
  GlassButton, 
  Toast 
} from '../liquid-glass-native';

export const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const handleCapture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          base64: true,
          quality: 0.7,
        });
        if (photo) {
          navigation.navigate('ScanResults', { photo });
          Toast.success('照片已捕获');
        }
      } catch (error) {
        Toast.error('拍照失败,请重试');
      }
    }
  };

  // 新增: 从相册上传
  const handleUploadFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Toast.error('需要相册权限');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true, // 允许多选
      quality: 0.8,
      selectionLimit: 5, // 最多5张
    });

    if (!result.canceled && result.assets.length > 0) {
      // 跳转到冰箱扫描页面,传入选中的图片
      navigation.navigate('FridgeScan', { 
        preloadedImages: result.assets.map(asset => asset.uri) 
      });
      Toast.success(`已选择 ${result.assets.length} 张照片`);
    }
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>需要相机权限来扫描冰箱</Text>
        <GlassButton onPress={requestPermission}>授予权限</GlassButton>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
      >
        {/* Header - 设置按钮在右上角 */}
        <View style={[glassNavBar, styles.header]}>
          <Text style={styles.logo}>KitchenFlow</Text>
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          {/* QuickAccessBar - 只有3个按钮 */}
          <QuickAccessBar
            onCravingsPress={() => navigation.navigate('Cravings')}
            onShoppingPress={() => navigation.navigate('ShoppingList')}
            onFridgeScanPress={() => navigation.navigate('FridgeScan')}
          />

          {/* 拍照按钮 */}
          <View style={styles.shutterContainer}>
            <FloatingActionButton
              onPress={handleCapture}
              onLongPress={() => Toast.info('长按录像功能即将推出')}
            />
          </View>

          {/* 新增: 功能按钮区域 */}
          <View style={styles.actionButtons}>
            {/* 扫描小票 */}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('ReceiptScan')}
            >
              <View style={styles.actionButtonContent}>
                <Text style={styles.actionButtonIcon}>🧾</Text>
                <Text style={styles.actionButtonText}>扫描小票</Text>
              </View>
            </TouchableOpacity>

            {/* 相册上传 */}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleUploadFromGallery}
            >
              <View style={styles.actionButtonContent}>
                <Text style={styles.actionButtonIcon}>📤</Text>
                <Text style={styles.actionButtonText}>相册上传</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  camera: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: spacing.m,
    paddingHorizontal: spacing.m,
  },
  logo: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  settingsButton: {
    padding: spacing.s,
  },
  settingsIcon: {
    fontSize: 28,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: spacing.l,
  },
  shutterContainer: {
    alignItems: 'center',
    marginTop: spacing.l,
  },
  // 新增: 功能按钮样式
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.m,
    marginTop: spacing.m,
    paddingHorizontal: spacing.m,
  },
  actionButton: {
    flex: 1,
    maxWidth: 160,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(10px)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    padding: spacing.m,
  },
  actionButtonContent: {
    alignItems: 'center',
  },
  actionButtonIcon: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  actionButtonText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  permissionText: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.l,
  },
});
```

---

## 🔄 QuickAccessBar 组件更新

### QuickAccessBar.tsx (修订版)

```typescript
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { glassStyles } from '../styles/glassmorphism';
import { colors, spacing, typography } from '../styles/theme';

interface QuickAccessBarProps {
  onCravingsPress: () => void;
  onShoppingPress: () => void;
  onFridgeScanPress: () => void;
  // 移除 onSettingsPress
}

export const QuickAccessBar: React.FC<QuickAccessBarProps> = ({
  onCravingsPress,
  onShoppingPress,
  onFridgeScanPress,
}) => {
  return (
    <View style={[glassStyles.container, styles.container]}>
      <TouchableOpacity style={styles.item} onPress={onCravingsPress}>
        <Text style={styles.icon}>🍜</Text>
        <Text style={styles.label}>Cravings</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.item} onPress={onShoppingPress}>
        <Text style={styles.icon}>🛒</Text>
        <Text style={styles.label}>Shopping</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.item} onPress={onFridgeScanPress}>
        <Text style={styles.icon}>📸</Text>
        <Text style={styles.label}>Fridge</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.l,
    marginHorizontal: spacing.m,
  },
  item: {
    alignItems: 'center',
    flex: 1, // 平均分配空间
  },
  icon: {
    fontSize: 28, // 稍微大一点
    marginBottom: spacing.xs,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
```

---

## 📋 功能说明

### 1. 扫描小票 🧾

**点击后:**
- 跳转到 `ReceiptScanScreen`
- 可以拍照或选择小票图片
- AI 识别小票内容和价格

### 2. 相册上传 📤

**点击后:**
- 直接打开相册选择器
- 支持多选 (最多5张)
- 自动跳转到 `FridgeScanScreen` 并预加载图片
- 用户可以直接扫描,无需再次选择

**实现逻辑:**
```typescript
const handleUploadFromGallery = async () => {
  // 1. 请求相册权限
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  
  // 2. 打开相册选择器 (支持多选)
  const result = await ImagePicker.launchImageLibraryAsync({
    allowsMultipleSelection: true,
    selectionLimit: 5,
  });
  
  // 3. 跳转到 FridgeScanScreen,传入图片
  navigation.navigate('FridgeScan', { 
    preloadedImages: result.assets.map(asset => asset.uri) 
  });
};
```

---

## 🔧 FridgeScanScreen 更新

需要支持预加载图片功能:

```typescript
export const FridgeScanScreen: React.FC<{ 
  navigation: any;
  route: any; // 新增
}> = ({ navigation, route }) => {
  const { deviceId } = useDevice();
  
  // 从路由参数获取预加载的图片
  const preloadedImages = route.params?.preloadedImages || [];
  
  const [images, setImages] = useState<string[]>(preloadedImages);
  
  // ... 其余代码保持不变
};
```

---

## 🎨 视觉效果对比

### 优化前
```
┌─────────────────────────────┐
│      KitchenFlow            │
├─────────────────────────────┤
│      [相机预览]              │
├─────────────────────────────┤
│ 🍜  🛒  📸  ⚙️             │ ← 4个按钮,拥挤
│         [拍照]              │
└─────────────────────────────┘
```

### 优化后
```
┌─────────────────────────────┐
│ KitchenFlow         ⚙️      │ ← 设置在右上角
├─────────────────────────────┤
│      [相机预览]              │
├─────────────────────────────┤
│ 🍜    🛒    📸             │ ← 3个按钮,宽敞
│         [拍照]              │
│ ┌──────────┐ ┌──────────┐  │
│ │🧾 扫描小票│ │📤 相册上传│  │ ← 新增功能
│ └──────────┘ └──────────┘  │
└─────────────────────────────┘
```

---

## ✅ 改进总结

### 布局优化
- ✅ 设置按钮移到右上角 (更符合习惯)
- ✅ QuickAccessBar 从4个减少到3个按钮 (更宽敞)
- ✅ 底部新增功能按钮区域 (扫描小票 + 相册上传)

### 功能增强
- ✅ 直接从相册上传 (支持多选,最多5张)
- ✅ 扫描小票入口 (首页直达)
- ✅ 预加载图片到扫描页面 (流畅体验)

### 用户体验
- ✅ 更清晰的功能分区
- ✅ 更大的点击区域
- ✅ 更流畅的操作流程

---

## 🚀 实施步骤

### 步骤 1: 更新 HomeScreen (10分钟)
- 添加设置按钮到右上角
- 添加相册上传功能
- 添加底部功能按钮区域

### 步骤 2: 更新 QuickAccessBar (5分钟)
- 移除 `onSettingsPress` prop
- 调整按钮间距

### 步骤 3: 更新 FridgeScanScreen (5分钟)
- 支持 `preloadedImages` 参数
- 自动加载传入的图片

### 步骤 4: 创建 ReceiptScanScreen (3-4小时)
- 按照原计划实施

---

## 📊 时间估算

| 任务 | 时间 |
|-----|------|
| 更新 HomeScreen | 10分钟 |
| 更新 QuickAccessBar | 5分钟 |
| 更新 FridgeScanScreen | 5分钟 |
| 测试基础功能 | 10分钟 |
| **总计 (基础布局)** | **30分钟** |
| 创建 ReceiptScanScreen | 3-4小时 |
| **总计 (完整功能)** | **4-4.5小时** |

---

**准备好开始实施了吗?** 🚀

我可以立即帮你:
1. ✅ 更新 HomeScreen 布局
2. ✅ 更新 QuickAccessBar 组件
3. ✅ 更新 FridgeScanScreen 支持预加载
4. ✅ 测试新布局

告诉我可以开始了! 💪
