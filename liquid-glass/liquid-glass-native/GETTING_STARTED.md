# 🚀 Liquid Glass Native - 快速开始

5 分钟上手指南

---

## 1️⃣ 第一步: 配置路径别名

在 `kitchenflow-app/tsconfig.json` 中添加:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/liquid-glass-native": ["../liquid-glass/liquid-glass-native"]
    }
  }
}
```

✅ **已完成** - 路径别名已配置

---

## 2️⃣ 第二步: 添加 Toast 容器

在 `App.tsx` 中:

```tsx
import { ToastContainer } from '@/liquid-glass-native';

export default function App() {
  return (
    <>
      {/* 你的应用内容 */}
      <NavigationContainer>
        {/* ... */}
      </NavigationContainer>
      
      {/* 添加这一行 */}
      <ToastContainer />
    </>
  );
}
```

✅ **已完成** - ToastContainer 已添加

---

## 3️⃣ 第三步: 开始使用组件

### 最简单的例子

```tsx
import { GlassButton } from '@/liquid-glass-native';

function MyScreen() {
  return (
    <GlassButton onPress={() => console.log('点击!')}>
      点我
    </GlassButton>
  );
}
```

### 常用组件示例

```tsx
import {
  GlassCard,
  GlassCardTitle,
  GlassCardContent,
  GlassButton,
  GlassInput,
  Toast,
  spacing,
} from '@/liquid-glass-native';

function MyScreen() {
  const [text, setText] = useState('');

  return (
    <View style={{ padding: spacing.m }}>
      {/* 卡片 */}
      <GlassCard>
        <GlassCardTitle>欢迎</GlassCardTitle>
        <GlassCardContent>
          <Text>这是一个玻璃态卡片</Text>
        </GlassCardContent>
      </GlassCard>

      {/* 输入框 */}
      <GlassInput
        placeholder="输入文本"
        value={text}
        onChangeText={setText}
        style={{ marginTop: spacing.m }}
      />

      {/* 按钮 */}
      <GlassButton
        onPress={() => Toast.success('成功!')}
        style={{ marginTop: spacing.m }}
      >
        提交
      </GlassButton>
    </View>
  );
}
```

---

## 4️⃣ 第四步: 运行应用

```bash
cd kitchenflow-app
npm start
```

然后按 `i` (iOS) 或 `a` (Android)

---

## 📚 下一步

- [完整文档](./README.md)
- [快速参考](./QUICK_REFERENCE.md)
- [示例代码](./EXAMPLES.md)
- [集成指南](./INTEGRATION_GUIDE.md)

---

## 💡 常用代码片段

### 按钮

```tsx
// 主要按钮
<GlassButton variant="default">主要</GlassButton>

// 玻璃按钮
<GlassButton variant="glass">玻璃</GlassButton>

// 轮廓按钮
<GlassButton variant="outline">轮廓</GlassButton>

// 幽灵按钮
<GlassButton variant="ghost">幽灵</GlassButton>
```

### 卡片

```tsx
<GlassCard hoverable onPress={() => {}}>
  <GlassCardTitle>标题</GlassCardTitle>
  <GlassCardContent>
    <Text>内容</Text>
  </GlassCardContent>
</GlassCard>
```

### Toast

```tsx
Toast.success('成功!');
Toast.error('错误!');
Toast.warning('警告!');
Toast.info('提示!');
```

### 样式

```tsx
import { colors, spacing, typography } from '@/liquid-glass-native';

<View style={{ 
  padding: spacing.m,
  backgroundColor: colors.background 
}}>
  <Text style={[typography.h1, { color: colors.textPrimary }]}>
    标题
  </Text>
</View>
```

---

## 🎨 完整组件清单

- ✅ GlassButton
- ✅ GlassCard (+ Header, Title, Description, Content, Footer)
- ✅ GlassInput
- ✅ GlassDialog
- ✅ Toast (+ ToastContainer)

---

## 🆘 遇到问题?

### TypeScript 报错?
确保 tsconfig.json 中的路径配置正确

### Toast 不显示?
确保在 App.tsx 中添加了 `<ToastContainer />`

### 样式不生效?
检查是否从 `@/liquid-glass-native` 导入了样式

---

就这么简单! 🎉 现在开始使用吧!
