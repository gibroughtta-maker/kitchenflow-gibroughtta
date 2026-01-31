# 修复 "Cannot call a class as a function" 错误

## 🔧 快速修复步骤

### 步骤 1: 清除 Metro Bundler 缓存

```bash
cd kitchenflow-app
npx expo start --clear
```

或者：

```bash
cd kitchenflow-app
npm start -- --reset-cache
```

### 步骤 2: 清除所有缓存（如果步骤 1 无效）

```bash
cd kitchenflow-app

# 清除 Metro 缓存
rm -rf node_modules/.cache

# 清除 Expo 缓存
npx expo start --clear

# 如果使用 npm
npm start -- --reset-cache
```

### 步骤 3: 重新安装依赖（如果步骤 2 无效）

```bash
cd kitchenflow-app

# 删除 node_modules 和 lock 文件
rm -rf node_modules
rm package-lock.json  # 或 yarn.lock

# 重新安装
npm install

# 启动
npm start
```

### 步骤 4: 检查特定问题

如果错误仍然存在，检查以下内容：

#### 4.1 检查组件导入

确保所有组件都是函数组件，不是类组件：

```typescript
// ✅ 正确
export const MyComponent: React.FC = () => { ... }

// ❌ 错误（如果被当作函数调用）
export class MyComponent extends React.Component { ... }
```

#### 4.2 检查循环依赖

确保没有循环导入。检查：
- `ShoppingListScreen.tsx`
- `StoreOnboarding.tsx`
- `QuickAddBar.tsx`
- `ShoppingItemCard.tsx`

#### 4.3 检查 React 版本

确保 React 版本兼容：

```bash
npm list react react-native
```

应该使用：
- React: 19.1.0
- React Native: 0.81.5

## 🐛 常见原因

### 原因 1: Metro Bundler 缓存

最常见的原因。清除缓存通常可以解决。

### 原因 2: 组件导入/导出不匹配

确保：
- 组件使用 `export const ComponentName: React.FC = ...`
- 导入使用 `import { ComponentName } from ...`

### 原因 3: React Native 版本问题

某些 React Native 版本可能有已知问题。确保使用兼容的版本。

### 原因 4: 热重载问题

有时热重载会导致状态不一致。完全重启应用。

## ✅ 验证修复

修复后，验证：

1. 应用可以正常启动
2. 购物清单页面可以打开
3. 商店选择模态框可以显示
4. 可以添加商品

## 📝 如果问题仍然存在

1. **检查错误堆栈**：查看完整的错误信息，找到具体是哪个组件
2. **检查控制台**：查看是否有其他相关错误
3. **检查导入路径**：确保所有导入路径正确
4. **检查 TypeScript 编译**：运行 `npx tsc --noEmit` 检查类型错误

## 🔍 调试技巧

### 查看完整错误信息

在终端中查看完整的错误堆栈，找到具体是哪个文件/组件导致的问题。

### 临时禁用新功能

如果问题持续，可以临时注释掉新添加的组件：

```typescript
// 在 ShoppingListScreen.tsx 中
// import { StoreOnboarding } from '../components/StoreOnboarding';
// import { QuickAddBar } from '../components/QuickAddBar';

// 在 render 中
// <StoreOnboarding ... />
// <QuickAddBar ... />
```

然后逐步取消注释，找到问题组件。
