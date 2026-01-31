# 📋 更新后的功能实施计划: 图片上传 & 小票扫描

**创建时间:** 2026-01-26  
**基于现有代码:** ✅ scanner 文件夹已有图片压缩和 Gemini API 调用

---

## 🎯 现有基础设施分析

### ✅ 已有功能

#### 1. 图片处理 (`scannerService.ts`)
```typescript
// 已实现: 图片压缩和 base64 转换
export async function processImageForGemini(uri: string): Promise<GeminiImage> {
  const manipulated = await manipulateAsync(
    uri,
    [{ resize: { width: 1024 } }],
    { compress: 0.8, format: SaveFormat.JPEG }
  );
  
  const base64 = await FileSystem.readAsStringAsync(manipulated.uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  
  return { base64, mimeType: 'image/jpeg' };
}
```

**优点:**
- ✅ 自动压缩到 1024px 宽度
- ✅ JPEG 格式,质量 0.8
- ✅ 转换为 base64 供 Gemini 使用
- ✅ 支持批量处理(最多5张)

#### 2. Gemini API 调用 (`scannerService.ts`)
```typescript
async function callGemini(payload: GeminiPayload): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  
  const contents = [{
    parts: [
      { text: payload.prompt },
      ...payload.images.map(img => ({
        inline_data: { mime_type: img.mimeType, data: img.base64 }
      }))
    ]
  }];
  
  const response = await fetch(url, { method: 'POST', ... });
  return data.candidates?.[0]?.content?.parts?.[0]?.text;
}
```

**优点:**
- ✅ 统一的 API 调用接口
- ✅ 支持多图上传
- ✅ 完整的错误处理
- ✅ 日志记录

#### 3. 现有 Prompts (`kitchenflow-prompts.ts`)
- ✅ `generateKitchenFlowPrompt` - 冰箱扫描
- ✅ `generateCravingAnalysisPrompt` - 菜谱分析
- ✅ `generateShoppingListPrompt` - 购物清单
- ✅ `generateReceiptPricePrompt` - 小票价格识别
- ✅ `generateVoiceParsePrompt` - 语音解析

### ❌ 缺少的功能

1. **Supabase Storage 集成** - 图片仅在本地,未上传云端
2. **小票专用屏幕** - 没有独立的小票扫描入口
3. **图片历史记录** - 无法查看之前上传的图片
4. **通用图片上传组件** - FridgeScanScreen 耦合度高

---

## 🚀 实施计划 (基于现有代码优化)

### 阶段 1: Supabase Storage 集成 (2-3小时)

#### 1.1 创建图片上传服务

**新建文件:** `kitchenflow-app/src/services/imageUploadService.ts`

```typescript
import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { supabase } from './supabase';
import { processImageForGemini } from './scanner/scannerService';

/**
 * 上传选项
 */
export interface UploadOptions {
  compress?: boolean;
  maxWidth?: number;
  quality?: number;
  generateThumbnail?: boolean;
}

/**
 * 上传结果
 */
export interface UploadResult {
  url: string;           // 公开访问 URL
  path: string;          // Storage 路径
  thumbnailUrl?: string; // 缩略图 URL (如果生成)
}

/**
 * 上传图片到 Supabase Storage
 * 
 * @param uri - 本地图片 URI
 * @param folder - 存储文件夹 ('fridge-scans' | 'receipts' | 'items')
 * @param userId - 用户 ID
 * @param options - 上传选项
 */
export async function uploadImage(
  uri: string,
  folder: 'fridge-scans' | 'receipts' | 'items',
  userId: string,
  options: UploadOptions = {}
): Promise<UploadResult> {
  try {
    // 1. 压缩图片 (复用现有逻辑)
    const maxWidth = options.maxWidth || 1024;
    const quality = options.quality || 0.8;

    const manipulated = await manipulateAsync(
      uri,
      [{ resize: { width: maxWidth } }],
      { compress: quality, format: SaveFormat.JPEG }
    );

    // 2. 读取为 base64
    const base64 = await FileSystem.readAsStringAsync(manipulated.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // 3. 生成唯一文件名
    const timestamp = Date.now();
    const fileName = `${timestamp}.jpg`;
    const filePath = `${folder}/${userId}/${fileName}`;

    // 4. 上传到 Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('kitchenflow-images')
      .upload(filePath, decode(base64), {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // 5. 获取公开 URL
    const { data: urlData } = supabase.storage
      .from('kitchenflow-images')
      .getPublicUrl(filePath);

    const result: UploadResult = {
      url: urlData.publicUrl,
      path: filePath,
    };

    // 6. 生成缩略图 (可选)
    if (options.generateThumbnail) {
      const thumbnail = await generateThumbnail(uri, 200);
      const thumbPath = `${folder}/${userId}/thumb_${fileName}`;

      const thumbBase64 = await FileSystem.readAsStringAsync(thumbnail, {
        encoding: FileSystem.EncodingType.Base64,
      });

      await supabase.storage
        .from('kitchenflow-images')
        .upload(thumbPath, decode(thumbBase64), {
          contentType: 'image/jpeg',
        });

      const { data: thumbUrlData } = supabase.storage
        .from('kitchenflow-images')
        .getPublicUrl(thumbPath);

      result.thumbnailUrl = thumbUrlData.publicUrl;
    }

    return result;
  } catch (error: any) {
    console.error('Image upload failed:', error);
    throw error;
  }
}

/**
 * 批量上传图片
 */
export async function uploadMultipleImages(
  uris: string[],
  folder: 'fridge-scans' | 'receipts' | 'items',
  userId: string,
  options: UploadOptions = {}
): Promise<UploadResult[]> {
  const results = await Promise.all(
    uris.map((uri) => uploadImage(uri, folder, userId, options))
  );
  return results;
}

/**
 * 删除图片
 */
export async function deleteImage(path: string): Promise<void> {
  const { error } = await supabase.storage
    .from('kitchenflow-images')
    .remove([path]);

  if (error) {
    throw new Error(`Delete failed: ${error.message}`);
  }
}

/**
 * 生成缩略图
 */
async function generateThumbnail(
  uri: string,
  maxSize: number
): Promise<string> {
  const manipulated = await manipulateAsync(
    uri,
    [{ resize: { width: maxSize } }],
    { compress: 0.7, format: SaveFormat.JPEG }
  );

  return manipulated.uri;
}

/**
 * Base64 解码为 ArrayBuffer
 */
function decode(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}
```

#### 1.2 Supabase Storage 配置

**在 Supabase Dashboard 执行:**

```sql
-- 1. 创建存储桶
INSERT INTO storage.buckets (id, name, public)
VALUES ('kitchenflow-images', 'kitchenflow-images', true);

-- 2. 设置 RLS 策略
-- 用户可以上传自己的图片
CREATE POLICY "Users can upload their own images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'kitchenflow-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 用户可以查看自己的图片
CREATE POLICY "Users can view their own images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'kitchenflow-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 用户可以删除自己的图片
CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'kitchenflow-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

#### 1.3 更新数据库表

```sql
-- 更新 fridge_snapshots 表
ALTER TABLE fridge_snapshots 
ADD COLUMN image_urls TEXT[] DEFAULT '{}',
ADD COLUMN thumbnail_urls TEXT[] DEFAULT '{}';

COMMENT ON COLUMN fridge_snapshots.image_urls IS '原始图片 Supabase Storage URLs';
COMMENT ON COLUMN fridge_snapshots.thumbnail_urls IS '缩略图 URLs';

-- 更新 receipt_scans 表
ALTER TABLE receipt_scans
ADD COLUMN image_url TEXT,
ADD COLUMN thumbnail_url TEXT,
ADD COLUMN ocr_confidence DECIMAL(3,2) DEFAULT 0.0;

COMMENT ON COLUMN receipt_scans.image_url IS '小票图片 URL';
COMMENT ON COLUMN receipt_scans.ocr_confidence IS 'OCR 识别置信度 0-1';
```

---

### 阶段 2: 更新 FridgeScanScreen 使用云存储 (1-2小时)

**修改文件:** `kitchenflow-app/src/screens/FridgeScanScreen.tsx`

```typescript
import { uploadMultipleImages } from '../services/imageUploadService';
import { useDevice } from '../hooks/useDevice';

export const FridgeScanScreen: React.FC = ({ navigation }) => {
  const { deviceId } = useDevice();
  const [images, setImages] = useState<string[]>([]);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  
  // ... 现有的 pickImage, takePhoto 逻辑保持不变

  // 修改扫描逻辑
  const handleScan = async () => {
    if (images.length === 0) {
      Alert.alert('No Photos', 'Please add at least one photo first');
      return;
    }

    setScanning(true);
    setUploading(true);

    try {
      // 1. 上传图片到 Supabase Storage
      console.log('Uploading images to cloud...');
      const uploadResults = await uploadMultipleImages(
        images,
        'fridge-scans',
        deviceId,
        { generateThumbnail: true }
      );

      const urls = uploadResults.map(r => r.url);
      const thumbUrls = uploadResults.map(r => r.thumbnailUrl || r.url);
      
      setUploadedUrls(urls);
      setUploading(false);

      // 2. 扫描图片 (使用现有的 scanFridgeSnapshot)
      console.log('Scanning images with Gemini...');
      const scanResult = await scanFridgeSnapshot(images);

      if (!scanResult.success || !scanResult.data) {
        Alert.alert('Scan Failed', scanResult.error || 'Unknown error');
        return;
      }

      // 3. 保存结果到数据库 (包含图片 URLs)
      await saveFridgeSnapshotWithImages(
        deviceId,
        scanResult.data.items,
        scanResult.data.scanQuality,
        urls,
        thumbUrls
      );

      // 显示结果
      setResult(scanResult.data.items);
      setScanQuality(scanResult.data.scanQuality);

      Alert.alert('Scan Complete!', `Found ${scanResult.data.items.length} items`);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Scan failed');
    } finally {
      setScanning(false);
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* ... 现有 UI ... */}
      
      {/* 上传进度显示 */}
      {uploading && (
        <View style={styles.uploadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.uploadingText}>上传图片中...</Text>
        </View>
      )}
    </View>
  );
};
```

**更新服务:** `kitchenflow-app/src/services/fridgeService.ts`

```typescript
// 新增: 保存快照时包含图片 URLs
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
    thumbnail_urls: thumbnailUrls, // 新增
  });

  if (error) {
    throw new Error(`Failed to save snapshot: ${error.message}`);
  }
}
```

---

### 阶段 3: 小票扫描功能 (3-4小时)

#### 3.1 创建小票扫描屏幕

**新建文件:** `kitchenflow-app/src/screens/ReceiptScanScreen.tsx`

```typescript
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, typography, glassNavBar, GlassButton, GlassCard, GlassCardContent, Toast } from '../liquid-glass-native';
import { useDevice } from '../hooks/useDevice';
import { processImageForGemini } from '../services/scanner/scannerService';
import { uploadImage } from '../services/imageUploadService';
import { scanReceiptForPrices } from '../../scanner/kitchenflow-scanner-service';
import { saveReceiptScan } from '../services/receiptService';

interface ReceiptItem {
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

interface ReceiptResult {
  shopName: string;
  date: string;
  items: ReceiptItem[];
  totalAmount: number;
  confidence: number;
}

export const ReceiptScanScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { deviceId } = useDevice();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ReceiptResult | null>(null);

  // 拍照
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('权限被拒绝', '需要相机权限来拍摄小票');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.9,
      aspect: [3, 4], // 小票通常是竖向的
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  // 从相册选择
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('权限被拒绝', '需要相册权限');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.9,
      aspect: [3, 4],
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  // 扫描小票
  const handleScan = async () => {
    if (!imageUri) {
      Alert.alert('未选择图片', '请先拍照或选择小票图片');
      return;
    }

    setScanning(true);
    setUploading(true);

    try {
      // 1. 上传到云存储
      console.log('上传小票图片...');
      const uploadResult = await uploadImage(
        imageUri,
        'receipts',
        deviceId,
        { generateThumbnail: true }
      );
      setUploading(false);

      // 2. 处理图片为 Gemini 格式
      const geminiImage = await processImageForGemini(imageUri);

      // 3. 调用 OCR 识别
      console.log('识别小票内容...');
      const scanResult = await scanReceiptForPrices(
        geminiImage.base64,
        geminiImage.mimeType
      );

      if (!scanResult) {
        Alert.alert('识别失败', '无法识别小票内容,请确保图片清晰');
        return;
      }

      // 4. 保存到数据库
      await saveReceiptScan(
        deviceId,
        scanResult.shopName,
        scanResult.date,
        scanResult.items,
        scanResult.totalAmount,
        uploadResult.url,
        uploadResult.thumbnailUrl,
        scanResult.confidence
      );

      // 5. 显示结果
      setResult(scanResult);
      Toast.success('小票识别成功!');

    } catch (error: any) {
      console.error('小票扫描失败:', error);
      Alert.alert('扫描失败', error.message || '未知错误');
    } finally {
      setScanning(false);
      setUploading(false);
    }
  };

  // 重新扫描
  const handleReset = () => {
    setImageUri(null);
    setResult(null);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[glassNavBar, styles.header]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← 返回</Text>
        </TouchableOpacity>
        <Text style={styles.title}>扫描小票 🧾</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* 内容区域 */}
      {!imageUri ? (
        // 选择图片
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🧾</Text>
          <Text style={styles.emptyTitle}>扫描购物小票</Text>
          <Text style={styles.emptyText}>
            自动识别商品和价格{'\n'}
            学习你的购物习惯
          </Text>

          <View style={styles.buttonGroup}>
            <GlassButton
              onPress={takePhoto}
              icon="📷"
              style={styles.actionButton}
            >
              拍照
            </GlassButton>

            <GlassButton
              onPress={pickImage}
              variant="outline"
              icon="🖼️"
              style={styles.actionButton}
            >
              相册
            </GlassButton>
          </View>

          <View style={styles.tipsCard}>
            <GlassCard>
              <GlassCardContent>
                <Text style={styles.tipsTitle}>📝 拍摄提示</Text>
                <Text style={styles.tipsText}>• 确保小票平整,光线充足</Text>
                <Text style={styles.tipsText}>• 文字清晰可见</Text>
                <Text style={styles.tipsText}>• 避免反光和阴影</Text>
              </GlassCardContent>
            </GlassCard>
          </View>
        </View>
      ) : !result ? (
        // 预览和扫描
        <View style={styles.previewContainer}>
          <Image source={{ uri: imageUri }} style={styles.previewImage} />

          <View style={styles.actionBar}>
            <GlassButton
              variant="outline"
              onPress={handleReset}
              disabled={scanning}
            >
              重新选择
            </GlassButton>

            <GlassButton
              onPress={handleScan}
              disabled={scanning}
              loading={scanning}
            >
              {uploading ? '上传中...' : scanning ? '识别中...' : '开始扫描'}
            </GlassButton>
          </View>
        </View>
      ) : (
        // 显示结果
        <View style={styles.resultContainer}>
          <GlassCard style={styles.resultCard}>
            <GlassCardContent>
              <Text style={styles.resultShop}>🏪 {result.shopName}</Text>
              <Text style={styles.resultDate}>📅 {result.date}</Text>
              <Text style={styles.resultConfidence}>
                识别准确度: {(result.confidence * 100).toFixed(0)}%
              </Text>
            </GlassCardContent>
          </GlassCard>

          <Text style={styles.sectionTitle}>商品清单 ({result.items.length})</Text>

          {result.items.map((item, index) => (
            <GlassCard key={index} style={styles.itemCard}>
              <GlassCardContent>
                <View style={styles.itemRow}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemPrice}>¥{item.totalPrice.toFixed(2)}</Text>
                </View>
                <Text style={styles.itemDetails}>
                  {item.quantity} {item.unit} × ¥{item.unitPrice.toFixed(2)}
                </Text>
              </GlassCardContent>
            </GlassCard>
          ))}

          <GlassCard style={styles.totalCard}>
            <GlassCardContent>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>总计</Text>
                <Text style={styles.totalAmount}>¥{result.totalAmount.toFixed(2)}</Text>
              </View>
            </GlassCardContent>
          </GlassCard>

          <GlassButton
            onPress={handleReset}
            variant="outline"
            style={styles.doneButton}
          >
            扫描下一张
          </GlassButton>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: spacing.m,
    paddingHorizontal: spacing.m,
  },
  backButton: {
    ...typography.body,
    color: colors.primary,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: spacing.m,
  },
  emptyTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.s,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: spacing.m,
    marginBottom: spacing.xl,
  },
  actionButton: {
    minWidth: 120,
  },
  tipsCard: {
    width: '100%',
    maxWidth: 400,
  },
  tipsTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: spacing.s,
  },
  tipsText: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  previewContainer: {
    flex: 1,
    padding: spacing.m,
  },
  previewImage: {
    flex: 1,
    borderRadius: 12,
    marginBottom: spacing.m,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.m,
  },
  resultContainer: {
    flex: 1,
    padding: spacing.m,
  },
  resultCard: {
    marginBottom: spacing.m,
  },
  resultShop: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  resultDate: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  resultConfidence: {
    ...typography.caption,
    color: colors.primary,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    marginVertical: spacing.m,
  },
  itemCard: {
    marginBottom: spacing.s,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  itemName: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    flex: 1,
  },
  itemPrice: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '700',
  },
  itemDetails: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  totalCard: {
    marginTop: spacing.m,
    marginBottom: spacing.l,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  totalAmount: {
    ...typography.h2,
    color: colors.primary,
    fontWeight: '700',
  },
  doneButton: {
    marginTop: spacing.m,
  },
});
```

#### 3.2 创建小票服务

**新建文件:** `kitchenflow-app/src/services/receiptService.ts`

```typescript
import { supabase } from './supabase';

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
    throw new Error(`Failed to save receipt: ${error.message}`);
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
    throw new Error(`Failed to fetch receipts: ${error.message}`);
  }

  return data || [];
}
```

#### 3.3 添加导航路由

**修改文件:** `kitchenflow-app/App.tsx` 或导航配置文件

```typescript
import { ReceiptScanScreen } from './src/screens/ReceiptScanScreen';

// 在 Stack.Navigator 中添加
<Stack.Screen 
  name="ReceiptScan" 
  component={ReceiptScanScreen}
  options={{ headerShown: false }}
/>
```

#### 3.4 添加入口按钮

**修改文件:** `kitchenflow-app/src/screens/SettingsScreen.tsx`

在"快捷操作"部分添加:

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

## ✅ 实施检查清单

### 阶段 1: Supabase Storage (2-3h)
- [ ] 创建 `imageUploadService.ts`
- [ ] 在 Supabase 创建 `kitchenflow-images` 存储桶
- [ ] 配置 RLS 策略
- [ ] 更新数据库表 (添加 image_urls 字段)
- [ ] 测试图片上传和删除

### 阶段 2: 更新 FridgeScanScreen (1-2h)
- [ ] 集成 `uploadMultipleImages`
- [ ] 添加上传进度显示
- [ ] 更新 `saveFridgeSnapshot` 保存图片 URLs
- [ ] 测试完整流程

### 阶段 3: 小票扫描 (3-4h)
- [ ] 创建 `ReceiptScanScreen.tsx`
- [ ] 创建 `receiptService.ts`
- [ ] 添加导航路由
- [ ] 在 Settings 添加入口
- [ ] 测试小票识别准确度

### 阶段 4: 测试和优化 (1-2h)
- [ ] 测试各种图片格式
- [ ] 测试网络异常情况
- [ ] 优化上传速度
- [ ] 优化 UI/UX

---

## 📊 时间估算

- **阶段 1:** 2-3小时
- **阶段 2:** 1-2小时
- **阶段 3:** 3-4小时
- **阶段 4:** 1-2小时

**总计: 7-11 小时**

---

## 🎯 关键优势

### 复用现有代码
1. ✅ **图片压缩** - 直接使用 `processImageForGemini`
2. ✅ **Gemini API** - 复用 `callGemini` 和现有 prompts
3. ✅ **类型定义** - 使用现有的 `FreshItem`, `GeminiImage` 等

### 新增功能
1. 🆕 **云存储** - Supabase Storage 持久化
2. 🆕 **小票专用屏幕** - 独立的 OCR 流程
3. 🆕 **图片历史** - 可查看之前上传的图片

### 技术亮点
- 📦 **模块化** - 服务层分离,易于维护
- 🎨 **统一 UI** - 使用 Liquid Glass Native
- 🔒 **安全** - RLS 策略保护用户数据
- ⚡ **性能** - 图片压缩 + 缩略图优化

---

## 💡 下一步

准备好开始实施了吗?我可以:

1. **🚀 立即开始阶段 1** - 创建 `imageUploadService.ts`
2. **📝 细化某个阶段** - 深入讨论技术细节
3. **🧪 先做测试** - 验证 Supabase Storage 配置

告诉我你想从哪里开始! 🎨✨
