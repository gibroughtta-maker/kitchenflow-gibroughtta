# Scanner模块集成计划

> **日期**: 2026-01-21
> **目标**: 将scanner模块集成到KitchenFlow React Native应用
> **预计时间**: 4-6小时

---

## 📊 现状分析

### 现有应用结构

**已实现功能**：
- ✅ Device-based Authentication (设备ID认证)
- ✅ Cravings 管理 (手动添加、笔记、归档)
- ✅ Shopping List (添加、勾选、分类)
- ✅ Pantry Staples (常备品管理，100分制)
- ✅ Share Link (分享购物清单)
- ✅ Realtime Sync (实时同步)

**技术栈**：
- React Native + Expo
- Supabase (PostgreSQL + Realtime)
- TypeScript
- Gemini API (在 .env 中已配置)

### Scanner模块功能

**核心功能**：
1. **冰箱快照扫描** - 拍照识别食材 + 新鲜度
2. **Craving菜谱分析** - 解析菜谱需要的食材
3. **智能购物清单** - 基于库存和需求生成清单
4. **Receipt扫描** - 价格学习
5. **AR反向查菜谱** - 超市扫描推荐菜谱
6. **语音命令解析** - Siri/Google Assistant集成

---

## 🎯 集成策略

### 原则

1. **最小侵入性** - 不破坏现有功能
2. **渐进式集成** - 分阶段实施
3. **保持向后兼容** - 现有数据库schema不变
4. **优先MVP功能** - 先实现核心扫描

### 分阶段计划

#### Phase 1: 核心扫描功能（本次实现）
- ✅ 集成scanner service到React Native
- ✅ 实现Camera组件（拍照扫描）
- ✅ 冰箱快照扫描UI
- ✅ 保存扫描结果到Supabase

#### Phase 2: 增强现有功能
- ⏸️ Craving菜谱分析集成
- ⏸️ 智能购物清单生成
- ⏸️ 扩展Shopping Item显示reason

#### Phase 3: 高级功能
- ⏸️ Receipt扫描
- ⏸️ AR反向查菜谱
- ⏸️ 语音命令集成

---

## 🔧 技术实施

### 1. 数据库Schema扩展

**新增表：fridge_snapshots**

```sql
CREATE TABLE fridge_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
  items JSONB NOT NULL,  -- FreshItem[]
  scan_quality TEXT CHECK (scan_quality IN ('good', 'medium', 'poor')),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE fridge_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own snapshots"
  ON fridge_snapshots FOR SELECT
  USING (device_id = current_setting('app.device_id', true)::uuid);

CREATE POLICY "Users can insert own snapshots"
  ON fridge_snapshots FOR INSERT
  WITH CHECK (device_id = current_setting('app.device_id', true)::uuid);

-- Index
CREATE INDEX idx_fridge_snapshots_device_expires
  ON fridge_snapshots(device_id, expires_at DESC);

-- Auto-delete expired snapshots
CREATE OR REPLACE FUNCTION delete_expired_snapshots()
RETURNS trigger AS $$
BEGIN
  DELETE FROM fridge_snapshots WHERE expires_at < NOW();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_delete_expired_snapshots
  AFTER INSERT ON fridge_snapshots
  EXECUTE FUNCTION delete_expired_snapshots();
```

**扩展现有表：cravings**

```sql
-- 添加字段以支持菜谱分析
ALTER TABLE cravings ADD COLUMN IF NOT EXISTS required_ingredients JSONB;
ALTER TABLE cravings ADD COLUMN IF NOT EXISTS cuisine TEXT;
ALTER TABLE cravings ADD COLUMN IF NOT EXISTS difficulty TEXT
  CHECK (difficulty IN ('easy', 'medium', 'hard'));
```

### 2. 类型定义适配

**创建：`src/services/scanner/types.ts`**

```typescript
// 从scanner模块导入核心类型
export interface FreshItem {
  name: string;
  quantity: number;
  unit: string;
  freshness: 'fresh' | 'use-soon' | 'priority';
  confidence: number;
  visualNotes?: string;
}

export interface FridgeSnapshot {
  id: string;
  device_id: string;
  items: FreshItem[];
  scan_quality: 'good' | 'medium' | 'poor';
  expires_at: string;
  created_at: string;
}

// 扩展现有Craving类型
export interface CravingAnalysis {
  dishName: string;
  requiredIngredients: string[];
  cuisine?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}
```

### 3. Scanner Service集成

**创建：`src/services/scanner/scannerService.ts`**

- 适配Web版scanner service到React Native
- 使用`expo-image-picker`获取图片
- 转换图片为base64
- 调用Gemini API
- 保存结果到Supabase

**关键修改**：
```typescript
// 不使用fetch，使用expo的API
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

// 获取EXPO_PUBLIC_GEMINI_API_KEY
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

export const scanFridgeSnapshot = async (
  imageUris: string[]
): Promise<FridgeSnapshot | null> => {
  // 1. 转换图片到base64
  const images = await Promise.all(
    imageUris.map(async (uri) => {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return {
        base64,
        mimeType: 'image/jpeg',
      };
    })
  );

  // 2. 调用Gemini API (复用scanner逻辑)
  const prompt = generateKitchenFlowPrompt(images.length);
  const text = await callGemini({ prompt, images });
  const result = validateKitchenFlowResult(text);

  // 3. 保存到Supabase
  if (result) {
    const { data, error } = await supabase
      .from('fridge_snapshots')
      .insert({
        device_id: await getOrCreateDeviceId(),
        items: result.items,
        scan_quality: result.scanQuality,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  return null;
};
```

### 4. Camera UI组件

**创建：`src/components/CameraView.tsx`**

```typescript
import React, { useState, useRef } from 'react';
import { Camera, CameraType } from 'expo-camera';
import { View, TouchableOpacity, Text, Image } from 'react-native';

export const CameraView: React.FC<{
  onCapture: (uri: string) => void;
  onClose: () => void;
}> = ({ onCapture, onClose }) => {
  const [type, setType] = useState(CameraType.back);
  const cameraRef = useRef<Camera>(null);

  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      onCapture(photo.uri);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Camera style={{ flex: 1 }} type={type} ref={cameraRef}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={takePicture}>
            <Text style={styles.text}>拍照</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.text}>取消</Text>
          </TouchableOpacity>
        </View>
      </Camera>
    </View>
  );
};
```

**创建：`src/screens/FridgeScanScreen.tsx`**

```typescript
export const FridgeScanScreen: React.FC = ({ navigation }) => {
  const [images, setImages] = useState<string[]>([]);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<FridgeSnapshot | null>(null);

  const handleScan = async () => {
    setScanning(true);
    try {
      const snapshot = await scanFridgeSnapshot(images);
      setResult(snapshot);
    } catch (error) {
      Alert.alert('Error', 'Scan failed');
    } finally {
      setScanning(false);
    }
  };

  return (
    <View>
      {/* 显示已拍摄的图片 */}
      {/* 扫描按钮 */}
      {/* 结果显示 */}
    </View>
  );
};
```

### 5. 导航集成

**修改：`App.tsx`**

```typescript
import { FridgeScanScreen } from './src/screens/FridgeScanScreen';

<Stack.Screen name="FridgeScan" component={FridgeScanScreen} />
```

**修改：`src/screens/HomeScreen.tsx`**

```typescript
// 添加"扫描冰箱"按钮
<TouchableOpacity
  style={styles.scanButton}
  onPress={() => navigation.navigate('FridgeScan')}
>
  <Text>📸 扫描冰箱</Text>
</TouchableOpacity>
```

---

## 📋 实施清单

### Step 1: 准备工作 (30分钟)

- [ ] 安装依赖包
  ```bash
  cd kitchenflow-app
  npx expo install expo-camera expo-image-picker expo-file-system
  ```

- [ ] 配置Camera权限 (app.json)
  ```json
  {
    "expo": {
      "plugins": [
        [
          "expo-camera",
          {
            "cameraPermission": "Allow $(PRODUCT_NAME) to access your camera to scan fridge items."
          }
        ]
      ]
    }
  }
  ```

- [ ] 执行数据库migration (Supabase Dashboard)

### Step 2: 核心Service (1小时)

- [ ] 创建 `src/services/scanner/` 目录
- [ ] 复制并适配 `kitchenflow-prompts.ts`
- [ ] 创建 `scannerService.ts` (React Native版)
- [ ] 创建 `types.ts`
- [ ] 测试Gemini API调用

### Step 3: UI组件 (1.5小时)

- [ ] 创建 `CameraView.tsx`
- [ ] 创建 `FridgeScanScreen.tsx`
- [ ] 创建 `SnapshotResultCard.tsx`
- [ ] 添加导航路由

### Step 4: 数据持久化 (45分钟)

- [ ] 创建 `fridgeService.ts` (Supabase CRUD)
- [ ] 实现保存快照
- [ ] 实现获取最新快照
- [ ] 添加过期提醒逻辑

### Step 5: 测试 (1小时)

- [ ] 测试拍照功能
- [ ] 测试扫描识别
- [ ] 测试保存到数据库
- [ ] 测试过期删除
- [ ] 端到端测试

---

## 🎨 UI设计草图

### FridgeScanScreen

```
┌─────────────────────────────┐
│  ← Back     扫描冰箱  📸      │
├─────────────────────────────┤
│                             │
│   [已拍照片预览区域]          │
│   ┌───┐ ┌───┐ ┌───┐        │
│   │ 1 │ │ 2 │ │ 3 │        │
│   └───┘ └───┘ └───┘        │
│                             │
│   [+ 添加照片] (最多5张)      │
│                             │
├─────────────────────────────┤
│  [🔍 开始扫描]              │
│                             │
│  提示：拍摄整个冰箱内部，      │
│  确保光线充足                │
└─────────────────────────────┘
```

### SnapshotResult

```
┌─────────────────────────────┐
│  扫描结果                    │
├─────────────────────────────┤
│  扫描质量: ⭐⭐⭐ Good       │
│  有效期: 23小时剩余           │
├─────────────────────────────┤
│  🟢 新鲜食材 (3)            │
│  ┌─────────────────────────┤
│  │ 🥬 小白菜  500g         │
│  │ 🍅 西红柿  3个          │
│  │ 🥕 胡萝卜  2根          │
│  └─────────────────────────┤
│                             │
│  🟡 尽快食用 (2)            │
│  ┌─────────────────────────┤
│  │ 🥩 牛肉    300g         │
│  │ 备注：颜色略深            │
│  │                         │
│  │ 🐟 鲈鱼    1条          │
│  └─────────────────────────┤
│                             │
│  🔴 优先使用 (1)            │
│  ┌─────────────────────────┤
│  │ 🍞 面包    半个          │
│  │ 备注：表面有点硬          │
│  └─────────────────────────┤
│                             │
│  [✅ 保存快照]              │
└─────────────────────────────┘
```

---

## 🚀 未来扩展

### Phase 2: Craving菜谱分析

当用户添加Craving时：
1. 调用 `analyzeCraving(dishName)`
2. 保存 `required_ingredients` 到数据库
3. 在Craving卡片显示所需食材

### Phase 3: 智能购物清单

添加"生成智能清单"按钮：
1. 获取最新fridge_snapshot
2. 获取pending cravings
3. 调用 `generateSmartShoppingList()`
4. 显示推荐购买清单

---

## ⚠️ 注意事项

### 权限处理

```typescript
// 在使用Camera前请求权限
const { status } = await Camera.requestCameraPermissionsAsync();
if (status !== 'granted') {
  Alert.alert('需要相机权限');
  return;
}
```

### 图片大小优化

```typescript
// 压缩图片以节省API调用成本
const manipulatedImage = await ImageManipulator.manipulateAsync(
  uri,
  [{ resize: { width: 1024 } }],
  { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
);
```

### 成本控制

- Gemini Flash模型：约 $0.000125/次 (< 1分钱)
- 每月免费额度：1500次请求
- 建议：添加本地缓存，避免重复扫描

---

## 📊 成功指标

- [ ] 扫描成功率 > 90%
- [ ] 食材识别准确率 > 80%
- [ ] 扫描时间 < 5秒
- [ ] 用户每周至少扫描1次

---

## 📝 总结

这个计划提供了完整的集成路径，优先实现核心扫描功能，为后续高级功能打好基础。

**预计时间线**：
- Week 1: Phase 1 (核心扫描)
- Week 2-3: Phase 2 (增强功能)
- Week 4+: Phase 3 (高级特性)

**下一步**: 开始 Step 1 - 安装依赖和配置权限
