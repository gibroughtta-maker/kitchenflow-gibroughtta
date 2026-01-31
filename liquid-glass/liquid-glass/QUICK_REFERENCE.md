# Liquid Glass UI - 快速参考手册

## CSS 工具类

| 类名 | 描述 |
|-------|-------------|
| `glass-effect` | 基础玻璃背景和模糊效果 |
| `glass-hover` | 悬停效果 (缩放 + 上浮) |
| `glass-active` | 激活/点击效果 (缩小) |
| `glass-content` | 确保玻璃内部内容的层级 z-index |
| `glass-distortion` | 应用 SVG 扭曲滤镜 |

## 组件

### 按钮 (GlassButton)

Props:
- `variant`: `'default' | 'glass' | 'outline' | 'ghost'` (默认 | 玻璃 | 轮廓 | 幽灵)
- `size`: `'sm' | 'md' | 'lg'` (小 | 中 | 大)
- `loading`: `boolean` (加载中)
- `icon`: `ReactNode` (图标)

### 卡片 (GlassCard)

Props:
- `hoverable`: `boolean` (可悬停)

子组件: `Header`, `Title`, `Description`, `Content`, `Footer`

### 输入框 (GlassInput)

Props:
- `error`: `boolean` (错误状态)
- `errorMessage`: `string` (错误信息)

### 对话框 (GlassDialog)

Props:
- `open`: `boolean` (是否打开)
- `onClose`: `() => void` (关闭回调)
- `title`: `string` (标题)
- `footer`: `ReactNode` (底部内容)

### 表格 (GlassTable)

Props:
- `columns`: `Column<T>[]` (列定义)
- `dataSource`: `T[]` (数据源)
- `loading`: `boolean` (加载中)
- `onRowClick`: `(record: T) => void` (行点击回调)

### 通知 (Toast)

用法:
```ts
Toast.success('成功信息');
Toast.error('错误信息');
Toast.info('提示信息');
Toast.warning('警告信息');
```

## Hooks

### useTheme (主题)

用法:
```ts
const { theme, toggleTheme, setTheme } = useTheme();
// theme: 'light' | 'dark'
```
