# 🪟 Liquid Glass Native

React Native / Expo 专用的玻璃态 UI 组件库

## ✨ 特性

- 💎 **玻璃态设计**: 使用半透明背景和阴影打造现代化的玻璃质感
- 📱 **React Native 原生**: 专为移动端优化，支持 iOS 和 Android
- ⚡ **流畅动画**: 使用 `Animated` API 实现丝滑的交互动画
- 🎨 **完整主题**: 内置颜色、间距、排版等完整主题系统
- 🧩 **丰富组件**: 按钮、卡片、输入框、对话框、提示等常用组件
- 📦 **开箱即用**: TypeScript 支持，类型提示完善

---

## 📦 安装

确保你的项目已经安装了 React Native 或 Expo。

```bash
# 本地使用 (在 kitchenflow-app 中)
# 无需安装，直接导入即可
```

---

## 🚀 快速开始

### 1. 导入组件

```tsx
import { GlassButton, GlassCard, GlassInput } from '@/liquid-glass-native';
```

### 2. 添加 Toast 容器 (可选)

在你的 App 根组件中添加 `ToastContainer`:

```tsx
import { ToastContainer } from '@/liquid-glass-native';

export default function App() {
  return (
    <>
      {/* 你的应用内容 */}
      <NavigationContainer>
        {/* ... */}
      </NavigationContainer>
      
      {/* Toast 容器 */}
      <ToastContainer />
    </>
  );
}
```

---

## 📚 组件文档

### GlassButton - 玻璃态按钮

```tsx
import { GlassButton } from '@/liquid-glass-native';

// 基础用法
<GlassButton onPress={() => console.log('点击')}>
  按钮文本
</GlassButton>

// 完整示例
<GlassButton
  variant="default"  // 'default' | 'glass' | 'outline' | 'ghost'
  size="md"          // 'sm' | 'md' | 'lg'
  loading={false}
  disabled={false}
  icon={<Icon name="plus" />}
  onPress={handlePress}
>
  确认
</GlassButton>
```

**Props:**
- `variant`: 按钮变体 (`'default'` | `'glass'` | `'outline'` | `'ghost'`)
- `size`: 按钮尺寸 (`'sm'` | `'md'` | `'lg'`)
- `loading`: 是否显示加载状态
- `disabled`: 是否禁用
- `icon`: 左侧图标
- `rightIcon`: 右侧图标
- `onPress`: 点击事件
- `style`: 自定义样式

---

### GlassCard - 玻璃态卡片

```tsx
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardDescription,
  GlassCardContent,
  GlassCardFooter,
} from '@/liquid-glass-native';

<GlassCard hoverable onPress={handlePress}>
  <GlassCardHeader>
    <GlassCardTitle>卡片标题</GlassCardTitle>
    <GlassCardDescription>卡片描述</GlassCardDescription>
  </GlassCardHeader>
  
  <GlassCardContent>
    <Text>卡片内容区域</Text>
  </GlassCardContent>
  
  <GlassCardFooter>
    <GlassButton size="sm">操作</GlassButton>
  </GlassCardFooter>
</GlassCard>
```

**Props:**
- `hoverable`: 是否可点击（带缩放动画）
- `onPress`: 点击事件（仅在 `hoverable` 为 `true` 时有效）
- `style`: 自定义样式

---

### GlassInput - 玻璃态输入框

```tsx
import { GlassInput } from '@/liquid-glass-native';

<GlassInput
  label="用户名"
  placeholder="请输入用户名"
  value={username}
  onChangeText={setUsername}
  error={hasError}
  errorMessage="用户名不能为空"
  leftIcon={<Icon name="user" />}
/>
```

**Props:**
- `label`: 输入框标签
- `error`: 是否显示错误状态
- `errorMessage`: 错误提示信息
- `leftIcon`: 左侧图标
- `rightIcon`: 右侧图标
- `containerStyle`: 容器样式
- `inputStyle`: 输入框样式
- 继承所有 React Native `TextInput` 的 props

---

### GlassDialog - 玻璃态对话框

```tsx
import { GlassDialog, GlassButton } from '@/liquid-glass-native';

<GlassDialog
  visible={isVisible}
  onClose={() => setIsVisible(false)}
  title="确认删除"
  closeOnBackdropPress={true}
  footer={
    <>
      <GlassButton variant="ghost" onPress={() => setIsVisible(false)}>
        取消
      </GlassButton>
      <GlassButton onPress={handleConfirm}>
        确认
      </GlassButton>
    </>
  }
>
  <Text>确定要删除这个项目吗？此操作无法撤销。</Text>
</GlassDialog>
```

**Props:**
- `visible`: 是否显示对话框
- `onClose`: 关闭对话框回调
- `title`: 对话框标题
- `footer`: 底部按钮区域
- `closeOnBackdropPress`: 点击背景是否关闭（默认 `true`）
- `containerStyle`: 容器样式

---

### Toast - 提示消息

```tsx
import { Toast } from '@/liquid-glass-native';

// 基础用法
Toast.success('操作成功！');
Toast.error('操作失败！');
Toast.warning('警告信息');
Toast.info('提示信息');

// 完整配置
Toast.show({
  message: '自定义消息',
  type: 'success',
  duration: 3000,
  position: 'bottom', // 'top' | 'center' | 'bottom'
});
```

---

## 🎨 主题系统

### 使用预定义颜色

```tsx
import { colors } from '@/liquid-glass-native';

<View style={{ backgroundColor: colors.primary }}>
  <Text style={{ color: colors.textWhite }}>主色调文本</Text>
</View>
```

### 使用预定义间距

```tsx
import { spacing } from '@/liquid-glass-native';

<View style={{ padding: spacing.m, marginTop: spacing.l }}>
  {/* 内容 */}
</View>
```

### 使用排版样式

```tsx
import { typography } from '@/liquid-glass-native';

<Text style={typography.h1}>标题 1</Text>
<Text style={typography.body}>正文</Text>
<Text style={typography.caption}>说明文字</Text>
```

### 使用阴影

```tsx
import { shadows } from '@/liquid-glass-native';

<View style={[styles.card, shadows.medium]}>
  {/* 内容 */}
</View>
```

---

## 🎯 玻璃效果样式

直接使用预定义的玻璃态样式:

```tsx
import { glassCard, glassButton, glassNavBar } from '@/liquid-glass-native';

// 自定义组件使用玻璃效果
<View style={glassCard}>
  <Text>玻璃卡片效果</Text>
</View>

<View style={glassNavBar}>
  <Text>导航栏玻璃效果</Text>
</View>
```

---

## 💡 使用示例

### 完整的登录表单

```tsx
import {
  GlassCard,
  GlassInput,
  GlassButton,
  Toast,
  spacing,
} from '@/liquid-glass-native';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      // 登录逻辑
      await login(email, password);
      Toast.success('登录成功！');
    } catch (error) {
      Toast.error('登录失败，请检查账号密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard style={{ padding: spacing.l }}>
      <GlassInput
        label="邮箱"
        placeholder="请输入邮箱"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <GlassInput
        label="密码"
        placeholder="请输入密码"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ marginTop: spacing.m }}
      />
      
      <GlassButton
        onPress={handleLogin}
        loading={loading}
        disabled={!email || !password}
        style={{ marginTop: spacing.l }}
      >
        登录
      </GlassButton>
    </GlassCard>
  );
}
```

---

## 🔧 自定义主题

你可以直接修改 `styles/theme.ts` 来自定义主题:

```typescript
// styles/theme.ts
export const colors = {
  primary: '#007AFF', // 修改主色调
  // ... 其他颜色
};
```

---

## 📱 平台差异

- **iOS**: 使用 `shadowColor`, `shadowOffset`, `shadowOpacity`, `shadowRadius`
- **Android**: 使用 `elevation`

组件已自动处理平台差异，无需额外配置。

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📄 许可

MIT License

---

## 🎉 致谢

灵感来源于现代 iOS 设计语言和 Web 端的 Glass UI 设计。
