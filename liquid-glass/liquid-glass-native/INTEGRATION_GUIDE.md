# 🔧 Liquid Glass Native - 集成指南

在 KitchenFlow 应用中集成 Liquid Glass Native 组件库的完整指南。

---

## 📁 项目结构

```
kitchenflow/
├── liquid-glass/
│   └── liquid-glass-native/    # ← 组件库位置
│       ├── components/
│       ├── styles/
│       ├── index.ts
│       └── README.md
└── kitchenflow-app/            # ← 你的应用
    └── src/
        ├── screens/
        ├── components/
        └── App.tsx
```

---

## 🚀 集成步骤

### 步骤 1: 配置路径别名 (推荐)

在 `tsconfig.json` 中添加路径别名:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/liquid-glass-native": ["../liquid-glass/liquid-glass-native"],
      "@/liquid-glass-native/*": ["../liquid-glass/liquid-glass-native/*"]
    }
  }
}
```

或者使用 Babel 配置 (如果使用 `babel-plugin-module-resolver`):

```js
// babel.config.js
module.exports = {
  plugins: [
    [
      'module-resolver',
      {
        alias: {
          '@/liquid-glass-native': '../liquid-glass/liquid-glass-native',
        },
      },
    ],
  ],
};
```

### 步骤 2: 在 App.tsx 中添加 ToastContainer

```tsx
// kitchenflow-app/src/App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ToastContainer } from '@/liquid-glass-native';

export default function App() {
  return (
    <>
      <NavigationContainer>
        {/* 你的导航和路由 */}
      </NavigationContainer>
      
      {/* Toast 容器 - 全局添加一次即可 */}
      <ToastContainer />
    </>
  );
}
```

### 步骤 3: 开始使用组件

```tsx
// kitchenflow-app/src/screens/HomeScreen.tsx
import React from 'react';
import { View } from 'react-native';
import {
  GlassCard,
  GlassCardTitle,
  GlassButton,
  spacing,
} from '@/liquid-glass-native';

export default function HomeScreen() {
  return (
    <View style={{ padding: spacing.m }}>
      <GlassCard>
        <GlassCardTitle>欢迎使用 KitchenFlow</GlassCardTitle>
        <GlassButton onPress={() => {}}>开始使用</GlassButton>
      </GlassCard>
    </View>
  );
}
```

---

## 🔄 迁移现有组件

### 迁移按钮

**之前:**
```tsx
import { TouchableOpacity, Text } from 'react-native';

<TouchableOpacity style={styles.button} onPress={handlePress}>
  <Text style={styles.buttonText}>按钮</Text>
</TouchableOpacity>
```

**之后:**
```tsx
import { GlassButton } from '@/liquid-glass-native';

<GlassButton onPress={handlePress}>按钮</GlassButton>
```

### 迁移输入框

**之前:**
```tsx
import { TextInput } from 'react-native';

<TextInput
  style={styles.input}
  placeholder="输入..."
  value={value}
  onChangeText={setValue}
/>
```

**之后:**
```tsx
import { GlassInput } from '@/liquid-glass-native';

<GlassInput
  placeholder="输入..."
  value={value}
  onChangeText={setValue}
/>
```

### 迁移卡片

**之前:**
```tsx
import { View, Text } from 'react-native';

<View style={glassStyles.container}>
  <Text style={styles.title}>标题</Text>
  <Text style={styles.content}>内容</Text>
</View>
```

**之后:**
```tsx
import { GlassCard, GlassCardTitle, GlassCardContent } from '@/liquid-glass-native';

<GlassCard>
  <GlassCardTitle>标题</GlassCardTitle>
  <GlassCardContent>
    <Text>内容</Text>
  </GlassCardContent>
</GlassCard>
```

---

## 🎨 替换现有样式系统

### 1. 更新颜色引用

**之前:**
```tsx
import { colors } from '../styles/theme';

<View style={{ backgroundColor: colors.primary }} />
```

**之后:**
```tsx
import { colors } from '@/liquid-glass-native';

<View style={{ backgroundColor: colors.primary }} />
```

### 2. 更新间距

**之前:**
```tsx
import { spacing } from '../styles/theme';

<View style={{ padding: spacing.m, margin: spacing.l }} />
```

**之后:**
```tsx
import { spacing } from '@/liquid-glass-native';

<View style={{ padding: spacing.m, margin: spacing.l }} />
```

### 3. 更新排版

**之前:**
```tsx
import { typography } from '../styles/theme';

<Text style={typography.h1}>标题</Text>
```

**之后:**
```tsx
import { typography } from '@/liquid-glass-native';

<Text style={typography.h1}>标题</Text>
```

---

## 📝 更新现有屏幕

### CravingsScreen 示例

**迁移前:**
```tsx
// CravingsScreen.tsx
import { View, TextInput, TouchableOpacity, Text } from 'react-native';
import { colors, spacing } from '../styles/theme';

export function CravingsScreen() {
  return (
    <View style={{ padding: spacing.m }}>
      <TextInput placeholder="搜索..." />
      <TouchableOpacity style={{ backgroundColor: colors.primary }}>
        <Text>添加</Text>
      </TouchableOpacity>
    </View>
  );
}
```

**迁移后:**
```tsx
// CravingsScreen.tsx
import { View } from 'react-native';
import {
  GlassInput,
  GlassButton,
  spacing,
} from '@/liquid-glass-native';

export function CravingsScreen() {
  return (
    <View style={{ padding: spacing.m }}>
      <GlassInput placeholder="搜索..." />
      <GlassButton onPress={() => {}}>添加</GlassButton>
    </View>
  );
}
```

---

## 🧪 逐步迁移策略

建议采用逐步迁移的方式:

### 阶段 1: 新功能使用新组件
- 所有新开发的功能使用 Liquid Glass Native 组件
- 保持现有代码不变

### 阶段 2: 迁移公共组件
- 迁移最常用的组件 (按钮、输入框、卡片)
- 更新 `src/components/` 下的组件

### 阶段 3: 迁移屏幕
- 按优先级迁移各个屏幕
- 推荐顺序: 
  1. HomeScreen
  2. CravingsScreen
  3. PantryScreen
  4. ShoppingListScreen
  5. SettingsScreen

### 阶段 4: 清理旧代码
- 删除不再使用的旧样式文件
- 统一使用 Liquid Glass Native 的主题系统

---

## 🎯 具体文件迁移清单

### 1. 迁移 CravingCard 组件

```tsx
// src/components/CravingCard.tsx
import { GlassCard, GlassCardHeader, GlassCardTitle } from '@/liquid-glass-native';

export function CravingCard({ craving, onPress }) {
  return (
    <GlassCard hoverable onPress={onPress}>
      <GlassCardHeader>
        <GlassCardTitle>{craving.name}</GlassCardTitle>
      </GlassCardHeader>
    </GlassCard>
  );
}
```

### 2. 迁移 FloatingActionButton 组件

```tsx
// src/components/FloatingActionButton.tsx
import { GlassButton } from '@/liquid-glass-native';
import { StyleSheet } from 'react-native';

export function FloatingActionButton({ onPress, icon }) {
  return (
    <GlassButton
      variant="default"
      icon={icon}
      onPress={onPress}
      style={styles.fab}
    >
      +
    </GlassButton>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
  },
});
```

### 3. 统一样式导入

创建一个统一的样式导出文件:

```tsx
// src/styles/index.ts
export {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
  glassCard,
  glassButton,
  glassInput,
} from '@/liquid-glass-native';
```

然后在整个应用中使用:

```tsx
import { colors, spacing, typography } from '@/styles';
```

---

## ⚠️ 注意事项

### 1. 样式优先级
如果同时使用了组件的内置样式和自定义样式,自定义样式会覆盖内置样式:

```tsx
<GlassButton 
  style={{ backgroundColor: 'red' }} // 会覆盖默认背景色
>
  按钮
</GlassButton>
```

### 2. TypeScript 类型
确保导入了正确的类型:

```tsx
import type { GlassButtonProps } from '@/liquid-glass-native';
```

### 3. 动画性能
组件使用了 `Animated` API,确保设置了 `useNativeDriver: true` (已在组件内部处理)。

### 4. 兼容性
- 最低支持: React Native 0.70+
- 已测试平台: iOS, Android
- 需要支持: Animated API, StyleSheet

---

## 📊 迁移进度跟踪

使用这个清单跟踪迁移进度:

- [ ] 配置路径别名
- [ ] 添加 ToastContainer
- [ ] 迁移 HomeScreen
- [ ] 迁移 CravingsScreen
- [ ] 迁移 PantryScreen
- [ ] 迁移 ShoppingListScreen
- [ ] 迁移 SettingsScreen
- [ ] 迁移公共组件
  - [ ] CravingCard
  - [ ] PantryItemCard
  - [ ] ShoppingItemCard
  - [ ] FloatingActionButton
- [ ] 清理旧样式文件
- [ ] 更新文档

---

## 🆘 常见问题

### Q: 组件样式不生效?
A: 确保导入了正确的组件,并检查是否有自定义样式覆盖了默认样式。

### Q: Toast 不显示?
A: 确保在 App 根组件中添加了 `<ToastContainer />`。

### Q: TypeScript 报错?
A: 检查 `tsconfig.json` 中的路径配置是否正确。

### Q: 想要自定义主题?
A: 直接修改 `liquid-glass-native/styles/theme.ts` 文件。

---

## 📞 支持

如有问题,请查看:
- [README.md](./README.md) - 完整文档
- [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - 快速参考
- [EXAMPLES.md](./EXAMPLES.md) - 使用示例
