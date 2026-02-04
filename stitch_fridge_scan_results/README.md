# 设计稿 CSS / Tailwind 设计系统

本目录包含由设计稿提取的 **CSS**、**Tailwind 主题配置** 与 **React Native 设计 token**，便于在 KitchenFlow 项目中复用「冰箱扫描结果」「购物清单」「Cravings Queue」等页面的视觉风格。

## 是否可用于 KitchenFlow 项目？

| 项目类型 | 是否可直接用 | 说明 |
|----------|--------------|------|
| **Web / HTML 项目** | ✅ 可直接用 | 引入 `design-system.css` + 在 `tailwind.config.js` 中合并 `tailwind-theme.js` |
| **kitchenflow-app（Expo/React Native）** | ⚠️ 间接使用 | 应用使用 StyleSheet，不用 CSS 类名；请用 **`design-tokens.ts`** 同步颜色、圆角、阴影到 `src/styles/theme.ts` 与玻璃样式，实现与设计稿一致的视觉 |

- **design-system.css**、**tailwind-theme.js**：面向 Web（类名 + Tailwind）。
- **design-tokens.ts**：面向 React Native，导出颜色、圆角、阴影等数值，供 `theme.ts` / `glassmorphism` 引用或对齐。

## 文件说明

| 文件 | 说明 |
|------|------|
| `design-system.css` | 所有设计稿中的自定义样式（液态玻璃卡片、标签、弹窗、液滴等）— **Web** |
| `tailwind-theme.js` | Tailwind `theme.extend` 配置（颜色、圆角、阴影、字体、动画等）— **Web** |
| `design-tokens.ts` | 设计稿颜色、圆角、阴影等，供 **React Native** theme/glass 对齐 |
| `fridge_scan_results_*/`、`family_shopping_list_*/` 等 | 原始设计稿 HTML + 截图 |

## 使用方式

### 1. 引入设计系统 CSS

在入口 HTML 或主样式文件中引入：

```html
<link rel="stylesheet" href="./stitch_fridge_scan_results/design-system.css" />
```

若使用构建工具（如 Vite/Next），可在 JS 入口或根组件中：

```js
import './stitch_fridge_scan_results/design-system.css';
```

### 2. 合并 Tailwind 主题

在 `tailwind.config.js` 中合并主题扩展：

```js
const stitchTheme = require('./stitch_fridge_scan_results/tailwind-theme.js');

module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,html}'],
  darkMode: 'class',
  theme: {
    extend: stitchTheme,
  },
  plugins: [],
};
```

若已有 `extend`，可手动合并：

```js
const stitchTheme = require('./stitch_fridge_scan_results/tailwind-theme.js');

module.exports = {
  theme: {
    extend: {
      ...stitchTheme,
      // 你的其他 extend
    },
  },
};
```

### 3. 字体（可选）

设计稿使用 **Inter** 和 **Material Symbols Outlined**，建议在 HTML 中保留：

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
```

## 主要 CSS 类一览

- **沉浸式背景**：`immersive-bg`、`immersive-overlay`
- **液态玻璃卡片**：`liquid-card`、`liquid-bubble-icon`、`liquid-bar`
- **状态标签**：`liquid-tag-green`、`liquid-tag-yellow`、`liquid-tag-red`
- **玻璃框/文字**：`glass-frame`、`text-glass-primary`、`text-glass-secondary`
- **弹窗/按钮**：`milky-glass-modal`、`pill-button`
- **浅色玻璃**：`glass-panel`、`glass-panel-thick`、`glass-card`、`glass-card-overlay`
- **购物清单**：`liquid-droplet`、`liquid-pill-header`、`expand-icon`、`safe-area-bottom`
- **通知/深色**：`liquid-glass-bg`、`droplet-card`、`fluid-icon`、`wet-shimmer`
- **新拟态**：`liquid-droplet-neo`、`liquid-pill-neo`、`liquid-button-circle-neo`
- **工具**：`no-scrollbar`

## Tailwind 工具类示例

合并主题后可直接使用扩展的 token，例如：

```html
<!-- 颜色 -->
<div class="bg-primary text-background-light dark:bg-background-dark"></div>
<span class="text-tesco-blue">Tesco</span>
<span class="bg-asda-green/20 text-asda-green">ASDA</span>

<!-- 阴影 -->
<div class="shadow-glass-card shadow-icon-glow-green"></div>

<!-- 动画 -->
<div class="animate-fade-in animate-float"></div>
```

设计稿中的内联 Tailwind 类（如 `rounded-3xl`、`backdrop-blur-xl`、`flex`、`gap-4` 等）保持不变，与 `design-system.css` 中的自定义类一起使用即可。

---

## 在 kitchenflow-app（React Native）中使用

应用是 **Expo/React Native**，使用 `StyleSheet` 和 `src/styles/theme.ts`、`glassmorphism.ts`，不能直接使用 CSS 文件或 Tailwind 类名。可通过 **设计 token** 对齐设计稿：

### 1. 引用设计 token

在需要与设计稿一致的屏幕或组件中：

```ts
import { stitchColors, stitchBorderRadius, stitchShadows } from '../../stitch_fridge_scan_results/design-tokens';
```

然后在 `StyleSheet.create` 里使用，例如：

- 主色：`stitchColors.primary`、`stitchColors.tescoBlue`、`stitchColors.asdaGreen`
- 圆角：`stitchBorderRadius['2xl']`、`stitchBorderRadius['3xl']`
- 状态标签/发光：`stitchShadows.iconGlowGreen` 等

### 2. 与现有 theme 对齐（可选）

若希望整 app 与设计稿统一，可在 `kitchenflow-app/src/styles/theme.ts` 中：

- 将 `colors.primary` 改为与设计稿一致（如 `#3b82f6` 或保留 `#007AFF` 按产品选择）
- 从 `design-tokens.ts` 复制或 re-export `stitchColors`、`stitchBorderRadius`，在 theme 中统一引用

这样 **设计稿的数值** 可用于 KitchenFlow 项目，视觉与设计稿一致，代码仍保持 RN 的 StyleSheet 写法。
