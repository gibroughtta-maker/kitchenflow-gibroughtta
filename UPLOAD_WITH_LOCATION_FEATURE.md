# 📤 Upload with Storage Location Selection

**实施日期:** 2026-01-27  
**功能:** 上传照片时选择存储位置  
**状态:** ✅ 完成

---

## 🎯 功能概述

用户在从相册上传照片时,会先看到一个位置选择器模态框,选择存储位置后再进入扫描流程。这样可以在扫描前就明确食材的存储位置。

---

## ✨ 新功能

### 1. 上传流程改进

#### 之前:
```
点击 Upload → 选择照片 → 直接进入 FridgeScan → 扫描 → 选择位置 → 保存
```

#### 现在:
```
点击 Upload → 选择照片 → 选择位置 → 进入 FridgeScan (位置已预选) → 扫描 → 保存
```

### 2. 位置选择器模态框

新增 `StorageLocationPicker` 组件:

```
┌─────────────────────────────────┐
│                                 │
│  📍 Where will you store        │
│     these items?                │
│                                 │
│  ┌──────────┐  ┌──────────┐   │
│  │    ❄️    │  │    🧊    │   │
│  │  Fridge  │  │ Freezer  │   │
│  └──────────┘  └──────────┘   │
│                                 │
│  ┌──────────┐  ┌──────────┐   │
│  │    🏺    │  │    📦    │   │
│  │  Pantry  │  │  Other   │   │
│  └──────────┘  └──────────┘   │
│                                 │
│  [        Cancel        ]       │
│                                 │
└─────────────────────────────────┘
```

---

## 🔄 修改的文件

### 1. StorageLocationPicker.tsx (新增)

**位置:** `src/components/StorageLocationPicker.tsx`

#### 功能:
- ✅ 模态框显示 4 个位置选项
- ✅ 大图标和标签
- ✅ 取消按钮
- ✅ 半透明背景遮罩

#### Props:
```typescript
interface StorageLocationPickerProps {
  visible: boolean;
  onSelect: (location: StorageLocation) => void;
  onCancel: () => void;
}

type StorageLocation = 'fridge' | 'freezer' | 'pantry' | 'other';
```

#### 使用示例:
```typescript
<StorageLocationPicker
  visible={showLocationPicker}
  onSelect={(location) => {
    console.log('Selected:', location);
    // Navigate to scan screen with location
  }}
  onCancel={() => {
    console.log('Cancelled');
  }}
/>
```

---

### 2. HomeScreen.tsx (修改)

#### 新增状态:
```typescript
const [showLocationPicker, setShowLocationPicker] = useState(false);
const [pendingImages, setPendingImages] = useState<string[]>([]);
```

#### 修改上传逻辑:
```typescript
const handleUploadFromGallery = async () => {
  // ... 选择照片 ...
  
  if (!result.canceled && result.assets.length > 0) {
    // 不再直接导航,而是显示位置选择器
    setPendingImages(result.assets.map(asset => asset.uri));
    setShowLocationPicker(true);
  }
};
```

#### 新增位置选择处理:
```typescript
const handleLocationSelect = (location: StorageLocation) => {
  setShowLocationPicker(false);
  
  if (pendingImages.length > 0) {
    navigation.navigate('FridgeScan', { 
      preloadedImages: pendingImages,
      preselectedLocation: location,  // ← 传递预选位置
    });
    Toast.success(`${pendingImages.length} photo(s) selected for ${location}`);
    setPendingImages([]);
  }
};

const handleLocationCancel = () => {
  setShowLocationPicker(false);
  setPendingImages([]);
};
```

---

### 3. FridgeScanScreen.tsx (修改)

#### 接收预选位置:
```typescript
// Get preloaded images and preselected location from route params
const preloadedImages = route.params?.preloadedImages || [];
const preselectedLocation = route.params?.preselectedLocation || 'fridge';

// 使用预选位置初始化状态
const [storageLocation, setStorageLocation] = useState<
  'fridge' | 'freezer' | 'pantry' | 'other'
>(preselectedLocation);
```

#### 效果:
- ✅ 进入扫描屏幕时,位置选择器已经预选了用户之前选择的位置
- ✅ 用户仍然可以在扫描后修改位置
- ✅ 保存时使用最终选择的位置

---

## 📊 数据流

```
1. 用户点击 "Upload" 按钮
    ↓
2. 选择照片 (1-5张)
    ↓
3. 照片选择成功
    ↓
4. 显示位置选择器模态框
    ↓
5. 用户选择位置 (Fridge/Freezer/Pantry/Other)
    ↓
6. 导航到 FridgeScan 屏幕
    ↓
7. 传递参数:
   - preloadedImages: [uri1, uri2, ...]
   - preselectedLocation: 'freezer'
    ↓
8. FridgeScan 初始化:
   - 加载照片
   - 预选位置为 'freezer'
    ↓
9. 用户点击 "Start Scan"
    ↓
10. AI 扫描识别食材
    ↓
11. 显示结果 + 位置选择器 (已预选 'freezer')
    ↓
12. 用户可以修改位置或直接保存
    ↓
13. 保存到数据库,包含位置信息
```

---

## 🎯 用户体验

### 优点:

1. **提前决策**
   - ✅ 用户在选择照片时就知道要扫描什么
   - ✅ 提前选择位置更符合心理预期
   - ✅ 减少后续操作步骤

2. **清晰的流程**
   - ✅ 照片选择 → 位置选择 → 扫描
   - ✅ 每一步都有明确的目的
   - ✅ 不会忘记选择位置

3. **灵活性**
   - ✅ 位置会预选,但仍可修改
   - ✅ 如果选错了,扫描后还能改
   - ✅ 兼顾效率和灵活性

4. **视觉反馈**
   - ✅ 大图标和标签清晰
   - ✅ 模态框设计美观
   - ✅ Toast 提示包含位置信息

---

## 🎨 UI 设计

### 位置选择器样式:

```typescript
// 遮罩层
overlay: {
  flex: 1,
  backgroundColor: 'rgba(0, 0, 0, 0.7)',  // 半透明黑色
  justifyContent: 'center',
  alignItems: 'center',
}

// 容器
container: {
  backgroundColor: colors.background,
  borderRadius: borderRadius.l,
  padding: spacing.l,
  width: '100%',
  maxWidth: 400,
}

// 位置按钮
locationButton: {
  flex: 1,
  minWidth: '45%',  // 2列布局
  backgroundColor: colors.glassBackground,
  borderWidth: 2,
  borderColor: colors.glassBorder,
  padding: spacing.l,
  alignItems: 'center',
}

// 图标
locationIcon: {
  fontSize: 48,  // 大图标
  marginBottom: spacing.s,
}
```

### 视觉效果:
- ✅ 玻璃态背景
- ✅ 大图标 (48px)
- ✅ 2x2 网格布局
- ✅ 半透明遮罩
- ✅ 圆角边框

---

## 🔍 技术细节

### 路由参数:

```typescript
// HomeScreen → FridgeScan
navigation.navigate('FridgeScan', {
  preloadedImages: [
    'file:///path/to/image1.jpg',
    'file:///path/to/image2.jpg',
  ],
  preselectedLocation: 'freezer',  // ← 新增
});

// FridgeScan 接收
const preloadedImages = route.params?.preloadedImages || [];
const preselectedLocation = route.params?.preselectedLocation || 'fridge';
```

### 状态管理:

```typescript
// HomeScreen
const [showLocationPicker, setShowLocationPicker] = useState(false);
const [pendingImages, setPendingImages] = useState<string[]>([]);

// 流程:
// 1. 选择照片 → setPendingImages([...])
// 2. 显示选择器 → setShowLocationPicker(true)
// 3. 选择位置 → 导航 + 清空状态
// 4. 取消 → 清空状态
```

---

## ✅ 优点

1. **用户体验**
   - ✅ 流程更清晰
   - ✅ 减少遗忘
   - ✅ 提前决策

2. **代码质量**
   - ✅ 组件化设计
   - ✅ 可复用的模态框
   - ✅ 类型安全

3. **灵活性**
   - ✅ 预选但可修改
   - ✅ 兼容旧流程
   - ✅ 易于扩展

4. **一致性**
   - ✅ 与扫描后选择位置的 UI 一致
   - ✅ 相同的位置选项
   - ✅ 统一的交互模式

---

## 🔄 兼容性

### 向后兼容:
- ✅ 如果没有 `preselectedLocation`,默认为 'fridge'
- ✅ 不影响其他进入 FridgeScan 的路径
- ✅ 扫描后仍可修改位置

### 代码:
```typescript
// 安全的默认值
const preselectedLocation = route.params?.preselectedLocation || 'fridge';
```

---

## 📝 使用方式

### 1. 上传照片
```
主屏幕 → 点击 "Upload" 按钮 → 选择照片 (1-5张)
```

### 2. 选择位置
```
位置选择器弹出 → 点击位置 (例如: Freezer)
```

### 3. 扫描
```
进入 FridgeScan 屏幕 → 位置已预选为 Freezer → 点击 "Start Scan"
```

### 4. 确认或修改
```
查看结果 → 确认位置 (或修改) → 点击 "Save Snapshot"
```

### 5. 查看
```
返回主屏幕 → 点击 "Inventory" → 筛选 Freezer → 查看保存的食材
```

---

## 🎯 未来增强

### Phase 2: 记住上次选择
- 记录用户的上次选择
- 下次上传时默认选中
- 提高效率

### Phase 3: 智能推荐
- 基于时间推荐 (晚上 → Fridge)
- 基于历史习惯
- 机器学习优化

### Phase 4: 批量上传不同位置
- 支持多次上传
- 每次选择不同位置
- 更灵活的工作流

---

## ✅ 测试清单

- [x] 创建 StorageLocationPicker 组件
- [x] 更新 HomeScreen 上传逻辑
- [x] 更新 FridgeScan 接收逻辑
- [x] 添加状态管理
- [x] 添加样式
- [x] 代码质量检查
- [ ] 用户测试
- [ ] 性能测试

---

## 🐛 已知问题

### 1. 取消后照片丢失
**问题:** 用户选择照片后点击取消,照片会丢失  
**现状:** 这是预期行为,用户取消表示不想继续  
**改进:** 可以考虑添加确认对话框

### 2. 位置选择器覆盖相机
**问题:** 模态框会覆盖相机预览  
**现状:** 这是预期行为,模态框应该吸引注意力  
**改进:** 无需改进

---

## 📊 统计数据

### 代码量:
- 新增组件: ~130 行 (StorageLocationPicker)
- 修改 HomeScreen: ~40 行
- 修改 FridgeScan: ~5 行

### 文件变化:
- 新增文件: 1 个
- 修改文件: 2 个

---

## 📚 相关文档

- `src/components/StorageLocationPicker.tsx` - 位置选择器组件
- `src/screens/HomeScreen.tsx` - 主屏幕
- `src/screens/FridgeScanScreen.tsx` - 扫描屏幕
- `STORAGE_LOCATION_FEATURE.md` - 扫描时选择位置功能

---

## 🎉 总结

### 实施完成:
1. ✅ 创建位置选择器组件
2. ✅ 更新上传流程
3. ✅ 添加状态管理
4. ✅ 传递预选位置
5. ✅ 通过代码质量检查

### 用户价值:
1. ✅ 更清晰的上传流程
2. ✅ 提前决策,减少遗忘
3. ✅ 更好的用户体验
4. ✅ 灵活但高效

### 技术质量:
1. ✅ 组件化设计
2. ✅ 类型安全
3. ✅ 向后兼容
4. ✅ 无 Linter 错误

---

**实施完成!** 🎉

用户现在可以:
1. 上传照片时选择存储位置
2. 享受更流畅的上传体验
3. 减少操作步骤和遗忘

---

## 🧪 测试指南

### 快速测试:
1. 打开应用 (主屏幕)
2. 点击 "Upload" 按钮
3. 选择 2-3 张照片
4. **确认:** 看到位置选择器模态框
5. **选择:** 点击 "Freezer"
6. **确认:** 进入 FridgeScan 屏幕
7. **确认:** 位置选择器已预选 "Freezer"
8. **确认:** Toast 提示 "2 photo(s) selected for freezer"
9. 点击 "Start Scan"
10. 扫描完成后查看位置选择器
11. **确认:** 仍然选中 "Freezer"
12. 点击 "Save Snapshot"
13. **确认:** 提示 "Snapshot saved to freezer!"
14. 返回主屏幕 → Inventory → Freezer
15. **确认:** 看到刚才保存的食材

### 取消测试:
1. 打开应用
2. 点击 "Upload"
3. 选择照片
4. **点击:** "Cancel"
5. **确认:** 模态框关闭
6. **确认:** 没有导航到 FridgeScan

**预期:** 一切正常,上传流程更流畅! ✨
