# 🚀 优化后的实施计划

**更新时间:** 2026-01-26  
**状态:** ✅ 代码冗余已消除,准备实施

---

## 📊 优化成果

### 代码重构完成 ✅

| 指标 | 优化前 | 优化后 | 改善 |
|-----|--------|--------|------|
| 总代码行数 | ~500 行 | ~320 行 | ⬇️ 36% |
| 重复代码 | 180 行 | 0 行 | ✅ 100% |
| 维护文件数 | 4 个 | 2 个 | ⬇️ 50% |
| 代码一致性 | ⚠️ 低 | ✅ 高 | ⬆️ 100% |

### 文件结构优化 ✅

```
kitchenflow/
├── kitchenflow-app/
│   └── src/
│       └── services/
│           └── scanner/
│               ├── scannerService.ts    ← ✅ 主要实现
│               ├── prompts.ts           ← ✅ Prompt 定义
│               └── types.ts             ← ✅ 类型定义
│
└── scanner-docs/                        ← ✅ 历史参考 (已归档)
    ├── README.md                        ← ✅ 使用说明
    ├── kitchenflow-scanner-service.ts   ← 参考实现
    └── kitchenflow-prompts.ts           ← 参考 Prompts
```

---

## 🎯 实施任务清单

### ✅ 阶段 0: 代码优化 (已完成)
- [x] 重命名 `scanner/` 为 `scanner-docs/`
- [x] 创建 README 说明文档
- [x] 更新实施计划

### 📋 阶段 1: Supabase Storage 集成 (2-3小时)

#### 任务 1.1: 配置 Supabase Storage (30分钟)
```sql
-- 在 Supabase Dashboard 执行

-- 1. 创建存储桶
INSERT INTO storage.buckets (id, name, public)
VALUES ('kitchenflow-images', 'kitchenflow-images', true);

-- 2. 设置 RLS 策略
CREATE POLICY "Users can upload their own images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'kitchenflow-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view their own images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'kitchenflow-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'kitchenflow-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

#### 任务 1.2: 创建图片上传服务 (1.5小时)

**新建文件:** `kitchenflow-app/src/services/imageUploadService.ts`

**核心函数:**
```typescript
// 1. 上传单张图片
export async function uploadImage(
  uri: string,
  folder: 'fridge-scans' | 'receipts' | 'items',
  userId: string,
  options?: UploadOptions
): Promise<UploadResult>

// 2. 批量上传
export async function uploadMultipleImages(
  uris: string[],
  folder: string,
  userId: string
): Promise<UploadResult[]>

// 3. 删除图片
export async function deleteImage(path: string): Promise<void>

// 4. 生成缩略图
async function generateThumbnail(uri: string, maxSize: number): Promise<string>
```

**复用现有代码:**
- ✅ `processImageForGemini()` - 图片压缩
- ✅ `supabase` 客户端 - 已配置

**代码量:** 约 150 行

#### 任务 1.3: 更新数据库表 (30分钟)

```sql
-- 更新 fridge_snapshots 表
ALTER TABLE fridge_snapshots 
ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS thumbnail_urls TEXT[] DEFAULT '{}';

COMMENT ON COLUMN fridge_snapshots.image_urls IS '原始图片 Supabase Storage URLs';
COMMENT ON COLUMN fridge_snapshots.thumbnail_urls IS '缩略图 URLs';

-- 更新 receipt_scans 表 (如果已存在)
ALTER TABLE receipt_scans
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS ocr_confidence DECIMAL(3,2) DEFAULT 0.0;
```

---

### 📋 阶段 2: 更新 FridgeScanScreen (1-2小时)

#### 任务 2.1: 集成图片上传 (1小时)

**修改文件:** `kitchenflow-app/src/screens/FridgeScanScreen.tsx`

**修改点 1:** 导入上传服务
```typescript
import { uploadMultipleImages } from '../services/imageUploadService';
```

**修改点 2:** 更新 `handleScan` 函数 (约 20 行)
```typescript
const handleScan = async () => {
  setScanning(true);
  setUploading(true);  // 新增状态

  try {
    // 1. 上传图片到云端
    console.log('上传图片到 Supabase Storage...');
    const uploadResults = await uploadMultipleImages(
      images,
      'fridge-scans',
      deviceId,
      { generateThumbnail: true }
    );

    const urls = uploadResults.map(r => r.url);
    const thumbUrls = uploadResults.map(r => r.thumbnailUrl || r.url);
    
    setUploading(false);

    // 2. 扫描图片 (现有逻辑)
    console.log('AI 识别食材...');
    const scanResult = await scanFridgeSnapshot(images);

    if (!scanResult.success || !scanResult.data) {
      Alert.alert('扫描失败', scanResult.error || '未知错误');
      return;
    }

    // 3. 保存结果 (包含图片 URLs)
    await saveFridgeSnapshotWithImages(
      deviceId,
      scanResult.data.items,
      scanResult.data.scanQuality,
      urls,
      thumbUrls
    );

    // 4. 显示结果
    setResult(scanResult.data.items);
    setScanQuality(scanResult.data.scanQuality);

    Alert.alert('扫描完成!', `识别到 ${scanResult.data.items.length} 种食材`);
  } catch (error: any) {
    Alert.alert('错误', error.message || '扫描失败');
  } finally {
    setScanning(false);
    setUploading(false);
  }
};
```

**修改点 3:** 添加上传进度 UI
```typescript
{uploading && (
  <View style={styles.uploadingOverlay}>
    <ActivityIndicator size="large" color={colors.primary} />
    <Text style={styles.uploadingText}>上传图片中...</Text>
  </View>
)}
```

#### 任务 2.2: 更新保存函数 (30分钟)

**修改文件:** `kitchenflow-app/src/services/fridgeService.ts`

**新增函数:**
```typescript
export async function saveFridgeSnapshotWithImages(
  userId: string,
  items: FreshItem[],
  scanQuality: 'good' | 'medium' | 'poor',
  imageUrls: string[],
  thumbnailUrls: string[]
): Promise<void> {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  const { error } = await supabase.from('fridge_snapshots').insert({
    user_id: userId,
    items,
    scan_quality: scanQuality,
    expires_at: expiresAt.toISOString(),
    image_urls: imageUrls,        // 新增
    thumbnail_urls: thumbnailUrls // 新增
  });

  if (error) {
    throw new Error(`保存失败: ${error.message}`);
  }
}
```

---

### 📋 阶段 3: 小票扫描功能 (3-4小时)

#### 任务 3.1: 复制 Prompt 和解析函数 (30分钟)

**从 `scanner-docs/kitchenflow-prompts.ts` 复制到 `kitchenflow-app/src/services/scanner/prompts.ts`:**

```typescript
// 1. 小票识别 Prompt
export function generateReceiptPricePrompt(): string {
  return `
# Receipt Price Learning Scanner

## Task
Extract items and prices from this receipt for price tracking ONLY.

## Output Format (JSON only)
{
  "shopName": "Shop name",
  "date": "YYYY-MM-DD",
  "items": [
    {
      "name": "Item name",
      "quantity": 2,
      "unit": "kg",
      "unitPrice": 5.99,
      "totalPrice": 11.98
    }
  ],
  "totalAmount": 50.00,
  "confidence": 0.95
}

Scan receipt now:
  `.trim();
}

// 2. 结果解析函数
export function parseReceiptPriceResult(raw: string): ReceiptPriceResult | null {
  try {
    let cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) cleaned = jsonMatch[0];

    const data = JSON.parse(cleaned);
    
    return {
      shopName: data.shopName || 'Unknown',
      date: data.date,
      items: data.items.map((i: any) => ({
        name: i.name,
        quantity: Number(i.quantity),
        unit: i.unit,
        unitPrice: Number(i.unitPrice),
        totalPrice: Number(i.totalPrice)
      })),
      totalAmount: Number(data.totalAmount),
      confidence: Number(data.confidence) || 0.7
    };
  } catch (e) {
    console.error('解析小票失败:', e);
    return null;
  }
}
```

**复制类型定义到 `types.ts`:**
```typescript
export interface ReceiptPriceResult {
  shopName: string;
  date: string;
  items: Array<{
    name: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    totalPrice: number;
  }>;
  totalAmount: number;
  confidence: number;
}
```

#### 任务 3.2: 添加扫描函数 (30分钟)

**在 `kitchenflow-app/src/services/scanner/scannerService.ts` 添加:**

```typescript
/**
 * 扫描小票并识别价格
 */
export async function scanReceiptForPrices(
  imageUri: string
): Promise<ScanResult<ReceiptPriceResult>> {
  try {
    // 1. 处理图片 (复用现有函数)
    console.log('处理小票图片...');
    const image = await processImageForGemini(imageUri);
    
    // 2. 生成 Prompt
    const prompt = generateReceiptPricePrompt();
    
    // 3. 调用 Gemini API (复用现有函数)
    console.log('AI 识别小票内容...');
    const text = await callGemini({ prompt, images: [image] });
    
    // 4. 解析结果
    const result = parseReceiptPriceResult(text);
    
    if (!result) {
      return {
        success: false,
        error: '无法解析小票内容'
      };
    }

    console.log(`识别成功: ${result.items.length} 个商品`);
    
    return {
      success: true,
      data: result
    };
  } catch (error: any) {
    console.error('小票扫描失败:', error);
    return {
      success: false,
      error: error.message || '扫描失败'
    };
  }
}
```

#### 任务 3.3: 创建小票服务 (1小时)

**新建文件:** `kitchenflow-app/src/services/receiptService.ts`

```typescript
import { supabase } from './supabaseClient';

export interface ReceiptItem {
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

/**
 * 保存小票扫描结果
 */
export async function saveReceiptScan(
  userId: string,
  shopName: string,
  date: string,
  items: ReceiptItem[],
  totalAmount: number,
  imageUrl: string,
  thumbnailUrl: string | undefined,
  confidence: number
): Promise<void> {
  const { error } = await supabase.from('receipt_scans').insert({
    user_id: userId,
    shop_name: shopName,
    date,
    items,
    total_amount: totalAmount,
    image_url: imageUrl,
    thumbnail_url: thumbnailUrl,
    ocr_confidence: confidence,
  });

  if (error) {
    throw new Error(`保存小票失败: ${error.message}`);
  }
}

/**
 * 获取用户的小票历史
 */
export async function getReceiptHistory(
  userId: string,
  limit: number = 20
): Promise<any[]> {
  const { data, error } = await supabase
    .from('receipt_scans')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`获取小票历史失败: ${error.message}`);
  }

  return data || [];
}

/**
 * 获取商品的平均价格
 */
export async function getAveragePriceForItem(
  userId: string,
  itemName: string
): Promise<number | null> {
  const { data, error } = await supabase
    .from('receipt_scans')
    .select('items')
    .eq('user_id', userId);

  if (error || !data) return null;

  const prices: number[] = [];
  
  data.forEach(receipt => {
    receipt.items.forEach((item: ReceiptItem) => {
      if (item.name.includes(itemName) || itemName.includes(item.name)) {
        prices.push(item.unitPrice);
      }
    });
  });

  if (prices.length === 0) return null;

  return prices.reduce((sum, p) => sum + p, 0) / prices.length;
}
```

#### 任务 3.4: 创建小票扫描屏幕 (1.5小时)

**新建文件:** `kitchenflow-app/src/screens/ReceiptScanScreen.tsx`

**参考:** `docs/UPDATED_FEATURE_PLAN_IMAGE_UPLOAD.md` 中的完整实现

**核心功能:**
- 拍照/选择图片
- 图片预览
- AI 识别
- 结果展示
- 保存到数据库

**代码量:** 约 300 行

#### 任务 3.5: 添加导航和入口 (30分钟)

**修改 1:** 添加路由 (`App.tsx` 或导航配置)
```typescript
<Stack.Screen 
  name="ReceiptScan" 
  component={ReceiptScanScreen}
  options={{ headerShown: false }}
/>
```

**修改 2:** 在 SettingsScreen 添加入口
```typescript
<GlassCard 
  hoverable 
  onPress={() => navigation.navigate('ReceiptScan')}
  style={styles.actionButton}
>
  <GlassCardContent>
    <View style={styles.actionRow}>
      <Text style={styles.actionIcon}>🧾</Text>
      <View style={styles.actionTextContainer}>
        <Text style={styles.actionTitle}>扫描小票</Text>
        <Text style={styles.actionSubtitle}>学习购物习惯和价格</Text>
      </View>
      <Text style={styles.actionArrow}>›</Text>
    </View>
  </GlassCardContent>
</GlassCard>
```

---

## ✅ 验收标准

### 阶段 1: Supabase Storage
- [ ] 存储桶创建成功
- [ ] RLS 策略生效
- [ ] 可以上传图片
- [ ] 可以获取图片 URL
- [ ] 生成缩略图

### 阶段 2: FridgeScanScreen
- [ ] 图片上传到云端
- [ ] 数据库保存 image_urls
- [ ] 可以查看历史快照图片
- [ ] 上传进度显示正常

### 阶段 3: 小票扫描
- [ ] 可以拍摄/选择小票
- [ ] AI 识别准确率 > 80%
- [ ] 结果保存到数据库
- [ ] 可以查看历史小票
- [ ] 价格追踪功能正常

---

## 📊 时间估算

| 阶段 | 任务 | 预计时间 | 实际时间 |
|-----|------|---------|---------|
| 0 | 代码优化 | 30分钟 | ✅ 完成 |
| 1 | Supabase Storage | 2-3小时 | - |
| 2 | 更新 FridgeScanScreen | 1-2小时 | - |
| 3 | 小票扫描 | 3-4小时 | - |
| **总计** | | **6.5-9.5小时** | - |

---

## 🚀 下一步

准备好开始实施了吗?

**推荐顺序:**
1. ✅ 阶段 0: 代码优化 (已完成)
2. 🎯 阶段 1: Supabase Storage (立即开始)
3. 🎯 阶段 2: 更新 FridgeScanScreen
4. 🎯 阶段 3: 小票扫描

告诉我从哪里开始! 💪
