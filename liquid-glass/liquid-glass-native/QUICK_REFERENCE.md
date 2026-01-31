# Liquid Glass Native - 快速参考

## 📦 导入

```tsx
import {
  // 组件
  GlassButton,
  GlassCard,
  GlassInput,
  GlassDialog,
  Toast,
  ToastContainer,
  
  // 样式系统
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
  
  // 玻璃效果
  glassCard,
  glassButton,
  glassInput,
  glassNavBar,
} from '@/liquid-glass-native';
```

---

## 🔘 GlassButton

```tsx
<GlassButton variant="default" size="md" onPress={fn}>文本</GlassButton>
<GlassButton variant="glass" loading>加载中</GlassButton>
<GlassButton variant="outline" icon={<Icon />}>带图标</GlassButton>
<GlassButton variant="ghost" disabled>禁用</GlassButton>
```

**Variants:** `default` `glass` `outline` `ghost`  
**Sizes:** `sm` `md` `lg`

---

## 🃏 GlassCard

```tsx
<GlassCard hoverable onPress={fn}>
  <GlassCardHeader>
    <GlassCardTitle>标题</GlassCardTitle>
    <GlassCardDescription>描述</GlassCardDescription>
  </GlassCardHeader>
  <GlassCardContent>内容</GlassCardContent>
  <GlassCardFooter>底部</GlassCardFooter>
</GlassCard>
```

---

## 📝 GlassInput

```tsx
<GlassInput
  label="标签"
  placeholder="占位符"
  value={value}
  onChangeText={setValue}
  error={hasError}
  errorMessage="错误信息"
  leftIcon={<Icon />}
  rightIcon={<Icon />}
/>
```

---

## 💬 GlassDialog

```tsx
<GlassDialog
  visible={visible}
  onClose={onClose}
  title="标题"
  footer={<GlassButton>确认</GlassButton>}
>
  <Text>对话框内容</Text>
</GlassDialog>
```

---

## 🔔 Toast

```tsx
Toast.success('成功');
Toast.error('错误');
Toast.warning('警告');
Toast.info('信息');

Toast.show({
  message: '自定义',
  type: 'success',
  duration: 3000,
  position: 'bottom',
});
```

**记得添加:** `<ToastContainer />` 到 App 根组件

---

## 🎨 颜色

```tsx
colors.primary          // 主色调
colors.success          // 成功绿
colors.warning          // 警告橙
colors.error            // 错误红
colors.info             // 信息蓝

colors.glassLight       // 玻璃态 - 亮
colors.glassMedium      // 玻璃态 - 中
colors.glassDark        // 玻璃态 - 暗
colors.glassBorder      // 玻璃态边框

colors.textPrimary      // 主要文本
colors.textSecondary    // 次要文本
colors.textTertiary     // 三级文本
```

---

## 📏 间距

```tsx
spacing.xs    // 4
spacing.s     // 8
spacing.m     // 16
spacing.l     // 24
spacing.xl    // 32
spacing.xxl   // 48
```

---

## 🔤 排版

```tsx
typography.h1          // 标题1 (34/700)
typography.h2          // 标题2 (28/700)
typography.h3          // 标题3 (22/600)
typography.h4          // 标题4 (17/600)
typography.body        // 正文 (17/400)
typography.bodySmall   // 小正文 (15/400)
typography.caption     // 说明 (13/400)
typography.button      // 按钮 (17/600)
```

---

## 🌊 圆角

```tsx
borderRadius.xs    // 4
borderRadius.s     // 8
borderRadius.m     // 12
borderRadius.l     // 16
borderRadius.xl    // 24
borderRadius.full  // 9999
```

---

## 🌑 阴影

```tsx
shadows.small      // 小阴影 (elevation: 2)
shadows.medium     // 中阴影 (elevation: 4)
shadows.large      // 大阴影 (elevation: 8)
```

---

## ✨ 玻璃效果样式

```tsx
glassBase              // 基础玻璃效果
glassCard              // 卡片玻璃效果
glassCardHoverable     // 可悬停卡片
glassButton            // 按钮玻璃效果
glassButtonPrimary     // 主要按钮
glassInput             // 输入框玻璃效果
glassNavBar            // 导航栏玻璃效果
glassFloatingButton    // 浮动按钮
glassModal             // 对话框/模态框
glassChip              // 标签效果
```

使用示例:

```tsx
<View style={glassCard}>
  <Text>自定义玻璃卡片</Text>
</View>
```

---

## 🎯 组合使用

```tsx
<View style={[glassCard, { padding: spacing.l }]}>
  <Text style={[typography.h3, { color: colors.textPrimary }]}>
    标题
  </Text>
  <View style={{ marginTop: spacing.m }}>
    <GlassButton onPress={fn}>操作</GlassButton>
  </View>
</View>
```

---

## 📱 响应式设计

使用 `Dimensions` 或 `useWindowDimensions`:

```tsx
import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

<GlassCard style={{ width: width - spacing.xl * 2 }}>
  {/* 内容 */}
</GlassCard>
```
