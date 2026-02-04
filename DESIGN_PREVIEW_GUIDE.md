# 🎨 设计预览屏幕使用指南

## 如何访问设计预览

### 方式 1：通过深链接 (Deep Linking)

在终端运行以下命令来启动应用并直接打开设计预览：

```bash
# iOS
npx expo start --ios
# 然后访问: kitchenflow://dev/design-preview

# Android
npx expo start --android
# 然后访问: kitchenflow://dev/design-preview
```

### 方式 2：通过代码导航

在任何屏幕中添加以下代码进行导航：

```typescript
navigation.navigate('DesignPreview');
```

### 方式 3：在应用启动时打开 (临时调试)

编辑 `App.tsx` 中的主屏幕为 DesignPreview：

```typescript
<Stack.Navigator screenOptions={{ headerShown: false }}>
  <Stack.Screen name="DesignPreview" component={DesignPreviewScreen} />
  {/* 其他屏幕 */}
</Stack.Navigator>
```

## 📱 屏幕功能

### 1. 📷 Camera Mode (相机模式)
- 全屏取景框
- 底部居中浮动按钮
- 相机、相册、设置按钮

### 2. 🖼️ Photo Review (照片审核)
- 展示已保存的照片
- 顶部标题栏 + 返回/重拍按钮
- 底部确认/删除按钮（居中）

### 3. 🥫 Pantry (食品库)
- 库存管理
- 低库存警告
- 库存进度条
- 添加新项目按钮

### 4. 🛒 Shopping (购物清单)
- 按商店分组
- 可勾选的购物项目
- 价格显示
- 路线优化按钮

### 5. ✨ Cravings (食谱推荐)
- AI 推荐食谱卡片
- 食材匹配度显示
- 烹饪时间
- 评分

## 🎨 设计系统

### 色彩方案
- **主色**: #D98324 (焦糖橙)
- **背景**: #EADDCD (米色)
- **成功**: #2d5a27 (深绿)
- **错误**: #8B2914 (深红)

### 字体
- **主字体**: Libre Baskerville (标题、正文)
- **辅助字体**: Lato (功能性文字)

### 间距
- XS: 4px
- S: 8px
- M: 16px
- L: 24px

## 🔧 技术细节

### 文件位置
- 实现: `src/screens/DesignPreviewScreen.tsx`
- 导航注册: `App.tsx`
- 样式: 使用 `theme-parchment.ts` 和 `glassmorphism.ts`

### 依赖
- React Native
- React Navigation
- Expo

## ✅ 验证清单

- [x] 所有屏幕响应式布局
- [x] 颜色系统一致
- [x] 字体正确应用
- [x] 按钮居中
- [x] 深链接配置

## 📝 下一步

1. 在真实手机上测试
2. 根据反馈调整设计
3. 集成到实际屏幕中
4. 添加交互和动画
