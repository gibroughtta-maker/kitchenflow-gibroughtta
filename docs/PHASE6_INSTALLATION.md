# Phase 6: 安装依赖指南

## 需要安装的依赖

Phase 6 需要安装 `react-native-webview` 包。

## 安装步骤

### 方法 1: 使用 Expo（推荐）

```bash
cd kitchenflow-app
npx expo install react-native-webview
```

### 方法 2: 使用 npm

```bash
cd kitchenflow-app
npm install react-native-webview
```

### 方法 3: 使用 yarn

```bash
cd kitchenflow-app
yarn add react-native-webview
```

## 验证安装

安装完成后，检查 `package.json` 中是否包含：

```json
{
  "dependencies": {
    "react-native-webview": "^13.x.x"
  }
}
```

## 注意事项

1. **expo-clipboard 已安装**
   - 检查 `package.json`，`expo-clipboard` 应该已经存在（版本 ^8.0.8）

2. **重新启动开发服务器**
   - 安装新依赖后，需要重新启动 Expo 开发服务器：
   ```bash
   npm start
   ```

3. **原生构建**
   - 如果使用原生构建（iOS/Android），可能需要重新构建应用

## 已完成的工作

✅ 创建了 `FloatingShoppingList` 组件
✅ 创建了 `ShoppingWebViewScreen` 屏幕
✅ 在 `ShoppingListScreen` 中添加了 "Shop Online" 按钮
✅ 在 `App.tsx` 中添加了路由配置

## 下一步

安装依赖后，您可以：

1. 测试 WebView 功能
2. 测试浮动购物清单
3. 验证在线购物流程

## 功能说明

### FloatingShoppingList
- 显示当前商店的购物清单项
- 可以展开/收起
- 支持勾选物品
- 支持复制物品名称到剪贴板
- 显示剩余物品数量

### ShoppingWebViewScreen
- 在 WebView 中打开超市网站
- 显示浮动购物清单
- 支持前进/后退/刷新
- 支持在购物时勾选物品
