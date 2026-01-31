# 📋 功能实施计划: 图片上传 & 存储位置管理

**创建时间:** 2026-01-26  
**目标:** 
1. 添加图片和小票上传功能
2. 实现按存储位置(Fridge/Pantry)查看库存

---

## 🎯 功能 1: 图片和小票上传

### 1.1 需求分析

#### 当前状态
- ✅ FridgeScanScreen 已支持相机拍照和相册选择
- ✅ 已有 ImagePicker 集成
- ❌ 缺少小票专用上传入口
- ❌ 图片未上传到云存储(仅本地 URI)
- ❌ 没有图片历史记录查看

#### 目标功能
1. **通用图片上传组件**
   - 支持拍照 📷
   - 支持从相册选择 🖼️
   - 支持多图上传(最多5张)
   - 图片预览和删除
   - 上传进度显示

2. **小票扫描专用功能**
   - 优化小票识别(OCR)
   - 自动提取商品信息
   - 学习购物习惯
   - 关联到购物清单

3. **云存储集成**
   - 使用 Supabase Storage
   - 图片压缩和优化
   - 生成缩略图
   - CDN 加速访问

### 1.2 技术方案

#### A. Supabase Storage 配置

**存储桶结构:**
```
kitchenflow-images/
├── fridge-scans/
│   ├── {userId}/
│   │   └── {snapshotId}/
│   │       ├── original-1.jpg
│   │       ├── original-2.jpg
│   │       └── thumbnail-1.jpg
├── receipts/
│   ├── {userId}/
│   │   └── {receiptId}/
│   │       └── receipt.jpg
└── items/
    └── {userId}/
        └── {itemId}.jpg
```

**RLS 策略:**
```sql
-- 用户只能访问自己的图片
CREATE POLICY "Users can upload their own images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'kitchenflow-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own images"
ON storage.objects FOR SELECT
USING (bucket_id = 'kitchenflow-images' AND auth.uid()::text = (storage.foldername(name))[1]);
```

#### B. 图片上传服务

**新建文件:** `src/services/imageUploadService.ts`

```typescript
interface UploadOptions {
  compress?: boolean;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

interface UploadResult {
  url: string;
  path: string;
  thumbnailUrl?: string;
}

// 上传图片到 Supabase Storage
async function uploadImage(
  uri: string,
  folder: 'fridge-scans' | 'receipts' | 'items',
  userId: string,
  options?: UploadOptions
): Promise<UploadResult>

// 批量上传
async function uploadMultipleImages(
  uris: string[],
  folder: string,
  userId: string
): Promise<UploadResult[]>

// 删除图片
async function deleteImage(path: string): Promise<void>

// 生成缩略图
async function generateThumbnail(
  uri: string,
  maxSize: number
): Promise<string>
```

#### C. 通用图片上传组件

**新建文件:** `src/components/ImageUploader.tsx`

```typescript
interface ImageUploaderProps {
  maxImages?: number;
  onImagesSelected: (uris: string[]) => void;
  uploadImmediately?: boolean;
  folder?: 'fridge-scans' | 'receipts' | 'items';
  showPreview?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps>
```

**功能:**
- 拍照按钮
- 相册选择按钮
- 图片网格预览
- 删除按钮
- 上传进度条
- 错误处理

#### D. 小票扫描优化

**更新文件:** `src/screens/ReceiptScanScreen.tsx` (新建)

```typescript
// 专门的小票扫描屏幕
export const ReceiptScanScreen: React.FC
```

**功能:**
1. 引导用户拍摄清晰小票
2. 自动裁剪和增强
3. OCR 识别商品信息
4. 智能匹配到购物清单
5. 学习购物习惯

**Gemini Prompt 优化:**
```typescript
const RECEIPT_SCAN_PROMPT = `
你是一个专业的购物小票识别助手。

任务：从小票图片中提取以下信息：
1. 商店名称
2. 购买日期
3. 商品清单（名称、数量、单价、总价）
4. 总金额

输出格式：JSON
{
  "shopName": "超市名称",
  "date": "2026-01-26",
  "items": [
    {
      "name": "商品名称",
      "quantity": 1,
      "unit": "个",
      "unitPrice": 10.5,
      "totalPrice": 10.5
    }
  ],
  "totalAmount": 100.5,
  "confidence": 0.95
}

注意事项：
- 识别中文商品名
- 处理模糊或倾斜的图片
- 智能推断单位
- 标注识别置信度
`;
```

### 1.3 数据库更新

#### 更新 fridge_snapshots 表

```sql
ALTER TABLE fridge_snapshots 
ADD COLUMN image_urls TEXT[] DEFAULT '{}',
ADD COLUMN thumbnail_urls TEXT[] DEFAULT '{}';

COMMENT ON COLUMN fridge_snapshots.image_urls IS '原始图片 URLs';
COMMENT ON COLUMN fridge_snapshots.thumbnail_urls IS '缩略图 URLs';
```

#### 更新 receipt_scans 表

```sql
ALTER TABLE receipt_scans
ADD COLUMN image_url TEXT,
ADD COLUMN thumbnail_url TEXT,
ADD COLUMN ocr_confidence DECIMAL(3,2);

COMMENT ON COLUMN receipt_scans.image_url IS '小票图片 URL';
COMMENT ON COLUMN receipt_scans.ocr_confidence IS 'OCR 识别置信度 0-1';
```

### 1.4 UI/UX 设计

#### 图片上传流程

```
[拍照按钮] [相册按钮]
     ↓           ↓
  [预览网格显示]
     ↓
  [上传进度]
     ↓
  [上传成功 ✓]
```

#### 小票扫描流程

```
[扫描小票按钮]
     ↓
[拍照/选择图片]
     ↓
[图片预览 + 裁剪]
     ↓
[AI 识别中...]
     ↓
[识别结果确认]
     ↓
[保存到购物记录]
```

### 1.5 实施步骤

#### 阶段 1: 基础设施 (2-3小时)
- [ ] 配置 Supabase Storage 存储桶
- [ ] 设置 RLS 策略
- [ ] 创建 imageUploadService.ts
- [ ] 实现图片压缩和缩略图生成

#### 阶段 2: 通用组件 (2-3小时)
- [ ] 创建 ImageUploader 组件
- [ ] 实现图片预览网格
- [ ] 添加上传进度显示
- [ ] 错误处理和重试机制

#### 阶段 3: 集成到现有功能 (2小时)
- [ ] 更新 FridgeScanScreen 使用云存储
- [ ] 更新数据库表结构
- [ ] 迁移现有数据

#### 阶段 4: 小票扫描 (3-4小时)
- [ ] 创建 ReceiptScanScreen
- [ ] 优化 Gemini OCR prompt
- [ ] 实现商品信息提取
- [ ] 关联到购物清单

#### 阶段 5: 测试和优化 (2小时)
- [ ] 测试各种图片格式
- [ ] 测试网络异常情况
- [ ] 性能优化
- [ ] 用户体验优化

---

## 🎯 功能 2: 按存储位置查看库存

### 2.1 需求分析

#### 当前状态
- ✅ PantryScreen 显示常备品
- ✅ FridgeScanScreen 扫描冰箱
- ❌ 没有统一的库存视图
- ❌ 无法按位置筛选
- ❌ 没有存储位置概念

#### 目标功能
1. **存储位置管理**
   - Fridge (冰箱)
   - Freezer (冷冻室)
   - Pantry (储藏室)
   - Counter (台面)
   - 自定义位置

2. **统一库存视图**
   - 按位置分组显示
   - 快速切换位置
   - 搜索和筛选
   - 库存统计

3. **智能建议**
   - 根据位置推荐存储
   - 过期提醒(冰箱优先)
   - 库存优化建议

### 2.2 技术方案

#### A. 数据模型扩展

**新增存储位置枚举:**
```typescript
export type StorageLocation = 
  | 'fridge'      // 冰箱
  | 'freezer'     // 冷冻室
  | 'pantry'      // 储藏室
  | 'counter'     // 台面
  | 'custom';     // 自定义

export interface StorageLocationInfo {
  id: StorageLocation;
  name: string;
  icon: string;
  defaultShelfLife: number; // 默认保质期(天)
  temperature: 'cold' | 'frozen' | 'room';
}

export const STORAGE_LOCATIONS: Record<StorageLocation, StorageLocationInfo> = {
  fridge: {
    id: 'fridge',
    name: '冰箱',
    icon: '🧊',
    defaultShelfLife: 7,
    temperature: 'cold',
  },
  freezer: {
    id: 'freezer',
    name: '冷冻室',
    icon: '❄️',
    defaultShelfLife: 90,
    temperature: 'frozen',
  },
  pantry: {
    id: 'pantry',
    name: '储藏室',
    icon: '🥫',
    defaultShelfLife: 180,
    temperature: 'room',
  },
  counter: {
    id: 'counter',
    name: '台面',
    icon: '🍎',
    defaultShelfLife: 3,
    temperature: 'room',
  },
  custom: {
    id: 'custom',
    name: '其他',
    icon: '📦',
    defaultShelfLife: 30,
    temperature: 'room',
  },
};
```

#### B. 数据库更新

**更新 fridge_snapshots 表:**
```sql
ALTER TABLE fridge_snapshots
RENAME TO inventory_snapshots;

ALTER TABLE inventory_snapshots
ADD COLUMN storage_location TEXT DEFAULT 'fridge',
ADD COLUMN location_notes TEXT;

CREATE INDEX idx_inventory_location ON inventory_snapshots(storage_location);

COMMENT ON COLUMN inventory_snapshots.storage_location IS '存储位置: fridge, freezer, pantry, counter, custom';
```

**更新 pantry_staples 表:**
```sql
ALTER TABLE pantry_staples
ADD COLUMN storage_location TEXT DEFAULT 'pantry',
ADD COLUMN typical_location TEXT;

COMMENT ON COLUMN pantry_staples.storage_location IS '当前存储位置';
COMMENT ON COLUMN pantry_staples.typical_location IS '通常存储位置';
```

**创建统一库存视图:**
```sql
CREATE OR REPLACE VIEW unified_inventory AS
SELECT 
  'snapshot' as source,
  id,
  user_id,
  storage_location,
  items,
  created_at,
  expires_at
FROM inventory_snapshots
WHERE expires_at > NOW()

UNION ALL

SELECT 
  'pantry' as source,
  id,
  user_id,
  storage_location,
  jsonb_build_array(
    jsonb_build_object(
      'name', name,
      'category', category,
      'score', usage_score
    )
  ) as items,
  updated_at as created_at,
  NULL as expires_at
FROM pantry_staples;
```

#### C. 新建统一库存屏幕

**新建文件:** `src/screens/InventoryScreen.tsx`

```typescript
export const InventoryScreen: React.FC = ({ navigation }) => {
  const [selectedLocation, setSelectedLocation] = useState<StorageLocation>('fridge');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 功能:
  // 1. 顶部位置选择器 (Tab 或 Segmented Control)
  // 2. 按位置筛选的库存列表
  // 3. 搜索栏
  // 4. 统计信息 (总数, 即将过期数)
  // 5. 快速添加按钮
}
```

**UI 布局:**
```
┌─────────────────────────────────┐
│  🧊 冰箱  ❄️ 冷冻  🥫 储藏  🍎 台面 │ ← 位置选择器
├─────────────────────────────────┤
│  [搜索框]                  [筛选] │
├─────────────────────────────────┤
│  📊 统计: 32项 | 3项即将过期      │
├─────────────────────────────────┤
│  🟢 新鲜 (12)                    │
│  ├─ 🥬 生菜 500g                │
│  ├─ 🥕 胡萝卜 3根               │
│  └─ ...                         │
│                                 │
│  🟡 尽快使用 (8)                 │
│  ├─ 🥩 牛肉 300g (2天后过期)    │
│  └─ ...                         │
│                                 │
│  🔴 今天使用 (3)                 │
│  └─ 🥛 牛奶 1L (今天过期)       │
└─────────────────────────────────┘
```

#### D. 位置选择器组件

**新建文件:** `src/components/LocationSelector.tsx`

```typescript
interface LocationSelectorProps {
  selected: StorageLocation;
  onSelect: (location: StorageLocation) => void;
  showCount?: boolean;
  counts?: Record<StorageLocation, number>;
}

export const LocationSelector: React.FC<LocationSelectorProps>
```

**样式:**
- 使用 Liquid Glass Native 的 GlassButton
- 横向滚动
- 选中状态高亮
- 显示每个位置的物品数量

#### E. 库存服务更新

**更新文件:** `src/services/inventoryService.ts` (新建)

```typescript
// 获取指定位置的库存
async function getInventoryByLocation(
  userId: string,
  location: StorageLocation
): Promise<InventoryItem[]>

// 获取所有位置的库存统计
async function getInventoryStats(
  userId: string
): Promise<Record<StorageLocation, {
  total: number;
  expiringSoon: number;
  expired: number;
}>>

// 移动物品到其他位置
async function moveItemToLocation(
  itemId: string,
  newLocation: StorageLocation
): Promise<void>

// 智能推荐存储位置
async function suggestStorageLocation(
  itemName: string
): Promise<StorageLocation>
```

### 2.3 智能功能

#### A. 自动位置识别

使用 Gemini 根据物品名称推荐存储位置:

```typescript
const LOCATION_SUGGESTION_PROMPT = `
根据食材名称,推荐最佳存储位置。

食材: {itemName}

可选位置:
- fridge: 冰箱 (需要冷藏的新鲜食材)
- freezer: 冷冻室 (需要冷冻保存的食材)
- pantry: 储藏室 (干货、罐头、调味料)
- counter: 台面 (水果、面包等常温食材)

输出 JSON:
{
  "location": "fridge",
  "reason": "生菜需要冷藏保鲜",
  "shelfLife": 7
}
`;
```

#### B. 过期预警

按位置优先级提醒:
1. 冰箱 → 3天内过期提醒
2. 台面 → 1天内过期提醒
3. 冷冻室 → 30天内过期提醒
4. 储藏室 → 根据物品类型

#### C. 库存优化建议

```typescript
interface OptimizationSuggestion {
  type: 'move' | 'use' | 'freeze';
  itemName: string;
  currentLocation: StorageLocation;
  suggestedLocation?: StorageLocation;
  reason: string;
  urgency: 'high' | 'medium' | 'low';
}

// 示例:
{
  type: 'freeze',
  itemName: '鸡肉',
  currentLocation: 'fridge',
  suggestedLocation: 'freezer',
  reason: '3天内用不完,建议冷冻保存',
  urgency: 'medium'
}
```

### 2.4 UI/UX 增强

#### A. 快速操作

长按物品卡片显示操作菜单:
- 📍 移动到其他位置
- ✏️ 编辑信息
- 🗑️ 删除
- 📊 查看历史

#### B. 拖拽移动

支持拖拽物品到不同位置 Tab:
```
[拖动物品] → [目标位置 Tab] → [松手] → [确认移动]
```

#### C. 批量操作

选择多个物品进行批量操作:
- 批量移动
- 批量删除
- 批量标记已使用

### 2.5 实施步骤

#### 阶段 1: 数据模型 (1-2小时)
- [ ] 定义 StorageLocation 类型
- [ ] 更新数据库表结构
- [ ] 创建统一库存视图
- [ ] 数据迁移脚本

#### 阶段 2: 基础服务 (2-3小时)
- [ ] 创建 inventoryService.ts
- [ ] 实现按位置查询
- [ ] 实现位置移动
- [ ] 实现统计功能

#### 阶段 3: UI 组件 (3-4小时)
- [ ] 创建 LocationSelector 组件
- [ ] 创建 InventoryScreen
- [ ] 实现位置切换
- [ ] 实现搜索和筛选

#### 阶段 4: 智能功能 (2-3小时)
- [ ] 实现自动位置推荐
- [ ] 实现过期预警
- [ ] 实现优化建议
- [ ] Gemini prompt 优化

#### 阶段 5: 集成和优化 (2小时)
- [ ] 更新现有屏幕
- [ ] 添加快速操作
- [ ] 性能优化
- [ ] 用户体验优化

---

## 📊 总体时间估算

### 功能 1: 图片上传 (11-15小时)
- 基础设施: 2-3h
- 通用组件: 2-3h
- 功能集成: 2h
- 小票扫描: 3-4h
- 测试优化: 2h

### 功能 2: 存储位置 (10-14小时)
- 数据模型: 1-2h
- 基础服务: 2-3h
- UI 组件: 3-4h
- 智能功能: 2-3h
- 集成优化: 2h

**总计: 21-29 小时**

---

## 🎯 优先级建议

### 高优先级 (MVP 必需)
1. ✅ 基础图片上传到云存储
2. ✅ 存储位置数据模型
3. ✅ 按位置查看库存
4. ✅ 位置选择器组件

### 中优先级 (增强体验)
1. 🔶 小票 OCR 识别
2. 🔶 自动位置推荐
3. 🔶 过期预警优化
4. 🔶 拖拽移动

### 低优先级 (未来优化)
1. 🔹 批量操作
2. 🔹 库存优化建议
3. 🔹 图片历史记录
4. 🔹 自定义位置

---

## 🚀 快速启动建议

### 第一周: 图片上传基础
1. Day 1-2: Supabase Storage + imageUploadService
2. Day 3: ImageUploader 组件
3. Day 4: 集成到 FridgeScanScreen
4. Day 5: 测试和优化

### 第二周: 存储位置管理
1. Day 1: 数据模型和数据库更新
2. Day 2-3: inventoryService + InventoryScreen
3. Day 4: LocationSelector + UI 优化
4. Day 5: 智能功能和测试

---

## 📝 注意事项

### 技术风险
1. **图片大小**: 需要压缩,避免流量浪费
2. **上传失败**: 需要重试机制和离线缓存
3. **OCR 准确度**: 小票识别可能不准确,需要人工确认
4. **性能**: 大量图片加载需要优化

### 用户体验
1. **加载反馈**: 上传过程要有明确进度
2. **错误提示**: 失败时给出清晰的错误信息
3. **操作便捷**: 减少点击次数,流程简化
4. **视觉一致**: 使用 Liquid Glass Native 统一风格

### 数据安全
1. **权限控制**: RLS 策略确保数据隔离
2. **图片隐私**: 用户图片仅自己可见
3. **数据备份**: 定期备份云存储数据
4. **GDPR 合规**: 支持用户删除所有数据

---

## ✅ 验收标准

### 功能 1: 图片上传
- [ ] 可以拍照和选择相册
- [ ] 图片成功上传到 Supabase Storage
- [ ] 生成缩略图
- [ ] 显示上传进度
- [ ] 错误处理和重试
- [ ] 小票 OCR 识别准确率 > 80%

### 功能 2: 存储位置
- [ ] 可以按位置查看库存
- [ ] 位置切换流畅
- [ ] 统计数据准确
- [ ] 可以移动物品位置
- [ ] 自动位置推荐准确率 > 85%
- [ ] 过期提醒及时

---

**准备好开始实施了吗?我可以帮你:**
1. 🚀 立即开始实施某个功能
2. 📝 细化某个部分的技术方案
3. 💡 讨论替代方案或优化建议
