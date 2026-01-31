# ⚡ Quick Test Guide - KitchenFlow

**5分钟快速测试指南**

---

## 🎯 测试目标

验证3个核心功能:
1. ✅ 图片上传到云端
2. ✅ 冰箱扫描 (AI识别食材)
3. ✅ 小票扫描 (OCR提取价格)

---

## 🚀 快速测试步骤

### Test 1: 冰箱扫描 (2分钟)

```
1. 启动 App
   cd kitchenflow-app
   npm start

2. 在首页点击 "Upload" 按钮
   → 选择 3 张冰箱照片

3. 自动跳转到 FridgeScan 页面
   → 点击 "Start Scan"

4. 观察进度:
   ✓ "Uploading images..." (2-3秒)
   ✓ "Analyzing images with AI..." (5-8秒)
   ✓ 显示识别结果

5. 检查结果:
   ✓ 食材名称正确
   ✓ 新鲜度标识 (🟢🟡🔴)
   ✓ 数量和单位合理

6. 点击 "Save Snapshot"
   ✓ 显示成功提示
   ✓ 返回首页
```

**预期结果:**
- ✅ 3张图片上传成功
- ✅ AI识别出5-15个食材
- ✅ 数据保存到数据库

---

### Test 2: 小票扫描 (2分钟)

```
1. 在首页点击 "Scan Receipt" 按钮

2. 拍摄一张小票照片
   (或从相册选择)

3. 点击 "Scan Receipt"

4. 观察进度:
   ✓ "Uploading receipt image..." (1-2秒)
   ✓ "Analyzing receipt with AI..." (3-5秒)
   ✓ 显示扫描结果

5. 检查结果:
   ✓ 商店名称正确
   ✓ 日期格式: YYYY-MM-DD
   ✓ 商品列表完整
   ✓ 价格准确
   ✓ 总金额正确

6. 点击 "Save Receipt"
   ✓ 显示成功提示
   ✓ 返回首页
```

**预期结果:**
- ✅ 图片上传成功
- ✅ OCR提取所有商品和价格
- ✅ 数据保存到数据库

---

### Test 3: 数据库验证 (1分钟)

```sql
-- 在 Supabase SQL Editor 运行

-- 1. 检查冰箱快照
SELECT 
  id,
  device_id,
  scan_quality,
  array_length(image_urls, 1) as image_count,
  jsonb_array_length(items) as item_count,
  created_at
FROM fridge_snapshots
ORDER BY created_at DESC
LIMIT 3;

-- 2. 检查小票记录
SELECT 
  id,
  shop_name,
  scan_date,
  total_amount,
  jsonb_array_length(items) as item_count,
  ocr_confidence,
  created_at
FROM receipt_scans
ORDER BY created_at DESC
LIMIT 3;

-- 3. 检查图片存储
SELECT 
  name,
  bucket_id,
  created_at
FROM storage.objects
WHERE bucket_id = 'kitchenflow-images'
ORDER BY created_at DESC
LIMIT 10;
```

**预期结果:**
- ✅ fridge_snapshots 有新记录
- ✅ receipt_scans 有新记录
- ✅ storage.objects 有图片文件

---

## 🐛 常见问题排查

### 问题 1: 上传失败
```
错误: "Upload failed: ..."

检查:
1. 网络连接是否正常
2. Supabase URL 和 Key 是否配置
3. Storage bucket 是否创建
4. RLS 策略是否启用

解决:
- 检查 .env 文件
- 运行 docs/database/setup-storage-bucket.sql
```

### 问题 2: AI 扫描失败
```
错误: "Scan failed: ..."

检查:
1. GEMINI_API_KEY 是否配置
2. API Key 是否有效
3. 网络是否能访问 Google API

解决:
- 检查 .env 文件中的 EXPO_PUBLIC_GEMINI_API_KEY
- 访问 https://aistudio.google.com/apikey 验证 Key
```

### 问题 3: 保存失败
```
错误: "Save failed: ..."

检查:
1. 数据库表是否存在
2. RLS 策略是否正确
3. device_id 是否有效

解决:
- 运行 docs/database/add-image-columns.sql
- 检查 RLS 策略
```

---

## ✅ 成功标准

### 最低要求
- [x] 图片能上传到 Supabase Storage
- [x] 冰箱扫描能识别至少 3 个食材
- [x] 小票扫描能提取商店名和总金额
- [x] 数据能保存到数据库

### 理想状态
- [x] 上传速度 < 5秒 (3张图)
- [x] AI 扫描速度 < 10秒
- [x] 识别准确率 > 80%
- [x] 无崩溃和错误

---

## 📊 测试报告模板

```
测试日期: 2026-01-26
测试人员: [你的名字]
设备: [iPhone 12 / Android 11]

冰箱扫描测试:
- 上传速度: ___ 秒
- 扫描速度: ___ 秒
- 识别食材数: ___ 个
- 准确率: ____%
- 问题: [无 / 描述问题]

小票扫描测试:
- 上传速度: ___ 秒
- 扫描速度: ___ 秒
- 提取商品数: ___ 个
- 价格准确: [是 / 否]
- 问题: [无 / 描述问题]

数据库验证:
- fridge_snapshots: [✓ / ✗]
- receipt_scans: [✓ / ✗]
- storage.objects: [✓ / ✗]

总体评价:
- [✓ 通过 / ✗ 失败]
- 备注: ___________
```

---

## 🎉 测试通过!

如果所有测试通过:
1. ✅ 功能正常工作
2. ✅ 准备进入下一阶段
3. ✅ 可以开始用户测试

如果有问题:
1. 查看详细测试指南: `docs/TESTING_GUIDE.md`
2. 检查实施报告: `docs/PHASE*_IMPLEMENTATION_COMPLETE.md`
3. 查看错误日志并调试

---

**快速测试完成时间: ~5分钟**  
**详细测试时间: ~30分钟**  
**完整测试时间: ~2小时**
