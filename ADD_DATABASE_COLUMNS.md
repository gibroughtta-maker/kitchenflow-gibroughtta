# 🔧 添加数据库列

**问题:** `column "image_urls" of relation "fridge_snapshots" does not exist`  
**原因:** 数据库表缺少图片 URL 列  
**需要时间:** 30秒  
**难度:** ⭐ 非常简单

---

## 🎯 快速修复

### 在 Supabase SQL Editor 中运行:

```sql
-- ============================================
-- 添加图片 URL 列到 fridge_snapshots 表
-- ============================================

ALTER TABLE fridge_snapshots 
ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS thumbnail_urls TEXT[] DEFAULT '{}';

-- 添加注释
COMMENT ON COLUMN fridge_snapshots.image_urls IS 'Array of full-size image URLs from Supabase Storage';
COMMENT ON COLUMN fridge_snapshots.thumbnail_urls IS 'Array of thumbnail image URLs from Supabase Storage';
```

---

## ✅ 验证

运行以下 SQL 确认列已添加:
```sql
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'fridge_snapshots' 
  AND column_name IN ('image_urls', 'thumbnail_urls');
```

**预期结果:** 看到 2 个列 ✅
- `image_urls` (ARRAY, text[])
- `thumbnail_urls` (ARRAY, text[])

---

## 🚀 完成后

1. 在应用中按 `r` 重新加载
2. 尝试扫描冰箱
3. **应该能成功保存了!** ✨

---

## 📝 这是什么?

### 问题原因
代码尝试保存图片 URLs 到数据库:
```typescript
INSERT INTO fridge_snapshots (
  device_id,
  items,
  scan_quality,
  image_urls,      ← 这个列不存在!
  thumbnail_urls,  ← 这个列不存在!
  scanned_at
)
```

但 `fridge_snapshots` 表只有旧的列:
- `device_id`
- `items`
- `scan_quality`
- `scanned_at`

### 解决方案
添加新列:
- `image_urls` - 存储完整图片 URLs (数组)
- `thumbnail_urls` - 存储缩略图 URLs (数组)

---

## 🔍 为什么使用数组?

```sql
image_urls TEXT[]  ← 数组类型,可以存储多张图片
```

**优点:**
- ✅ 支持多张图片 (用户可以上传多张冰箱照片)
- ✅ 保持数据在一条记录中
- ✅ 查询方便
- ✅ 符合 PostgreSQL 最佳实践

**示例数据:**
```json
{
  "image_urls": [
    "https://...storage.../image1.jpg",
    "https://...storage.../image2.jpg",
    "https://...storage.../image3.jpg"
  ],
  "thumbnail_urls": [
    "https://...storage.../thumb1.jpg",
    "https://...storage.../thumb2.jpg",
    "https://...storage.../thumb3.jpg"
  ]
}
```

---

## 📊 完整的 Schema 更新

如果你想一次性添加所有相关的表和列,可以运行完整脚本:

**文件:** `docs/database/add-image-columns.sql`

这个脚本会:
1. ✅ 添加 `image_urls` 和 `thumbnail_urls` 到 `fridge_snapshots`
2. ✅ 创建 `receipt_scans` 表 (用于小票扫描)
3. ✅ 添加索引 (提高查询速度)
4. ✅ 配置 RLS 策略 (数据安全)
5. ✅ 创建视图 (价格历史分析)

---

## 🎯 最小修复 vs 完整修复

### 最小修复 (推荐,快速)
只添加必需的列:
```sql
ALTER TABLE fridge_snapshots 
ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS thumbnail_urls TEXT[] DEFAULT '{}';
```
**时间:** 5秒

### 完整修复 (可选,全面)
运行 `docs/database/add-image-columns.sql` 的全部内容
**时间:** 30秒

---

## 📖 相关文档

- `docs/database/add-image-columns.sql` - 完整 SQL 脚本
- `docs/PHASE1_IMPLEMENTATION_COMPLETE.md` - Phase 1 文档

---

## 🔄 进度更新

```
✅ 代码开发       100%
✅ Bug修复        100%
✅ 环境配置       100%
✅ Storage创建    100%
✅ RLS策略        100%
✅ 数据库函数     100%
🟡 数据库Schema    50% ← 当前步骤
⏳ 功能测试        0%
```

---

**执行这个 SQL,添加缺失的列,然后就能测试了!** 🎉

---

## ⏱️ 时间估算

- 复制 SQL: 5秒
- 粘贴并运行: 5秒
- 验证: 5秒

**总计: 15秒** ⏰

---

**这是最后一个数据库配置!完成后就能真正开始测试了!** 💪
