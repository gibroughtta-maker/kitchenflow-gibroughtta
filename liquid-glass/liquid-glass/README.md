# Liquid Glass UI

KitchenFlow 的可复用玻璃态设计系统。

## 特性

- 💎 **高级玻璃态效果**: 使用 CSS Backdrop Filters 和 SVG 滤镜实现的真实玻璃质感。
- 🎨 **主题系统**: 内置深色/浅色模式支持，基于 Tailwind CSS 变量。
- ⚡ **高性能**: 优化的 CSS 和 React 组件，无运行时样式开销。
- 🧩 **组件丰富**: 包含按钮、卡片、输入框、对话框、表格等核心组件。

## 快速开始

### 安装

确保已安装依赖：

```bash
npm install clsx tailwind-merge
```

### 引入样式

在项目入口文件（如 `main.tsx` 或 `App.tsx`）中引入样式：

```typescript
import '@kitchenflow/ui/styles/glass-effects.css';
import '@kitchenflow/ui/styles/animations.css';
import '@kitchenflow/ui/styles/themes.css';
```

### 全局滤镜

在 `App.tsx` 或根布局中添加 SVG 滤镜组件（只需添加一次）：

```tsx
import { LiquidGlassFilters } from '@kitchenflow/ui';

function App() {
  return (
    <>
      <LiquidGlassFilters />
      {/* 你的路由和组件 */}
    </>
  );
}
```

## 组件使用

### 按钮 (GlassButton)

```tsx
import { GlassButton } from '@kitchenflow/ui';

<GlassButton variant="default" size="md" onClick={handleClick}>
  主要按钮
</GlassButton>
```

### 卡片 (GlassCard)

```tsx
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from '@kitchenflow/ui';

<GlassCard hoverable>
  <GlassCardHeader>
    <GlassCardTitle>卡片标题</GlassCardTitle>
  </GlassCardHeader>
  <GlassCardContent>
    内容区域...
  </GlassCardContent>
</GlassCard>
```

### 输入框 (GlassInput)

```tsx
import { GlassInput } from '@kitchenflow/ui';

<GlassInput placeholder="请输入..." error={hasError} errorMessage="错误提示" />
```

### 对话框 (GlassDialog)

```tsx
import { GlassDialog } from '@kitchenflow/ui';

<GlassDialog open={isOpen} onClose={() => setIsOpen(false)} title="提示">
  这里是对话框内容...
</GlassDialog>
```

## 主题定制

使用 CSS 变量自定义主题：

```css
:root {
  --glass-blur: 20px;
  --glass-opacity: 0.7;
  --primary: 142.1 76.2% 36.3%; /* 绿色 */
}
```
