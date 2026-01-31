# 🔧 修复数据库函数

**问题:** `Could not find the function public.insert_fridge_snapshot(...) in the schema cache`  
**原因:** 数据库函数参数不匹配  
**需要时间:** 1分钟  
**难度:** ⭐ 非常简单

---

## 🎯 快速修复

### 在 Supabase SQL Editor 中运行:

1. 打开 https://supabase.com/dashboard
2. 选择你的项目
3. 点击左侧 **SQL Editor**
4. 点击 **New query**
5. 复制粘贴下面的 SQL
6. 点击 **Run**

```sql
-- ============================================
-- 更新 insert_fridge_snapshot 函数
-- 添加 image_urls 和 thumbnail_urls 参数
-- ============================================

-- 1. 删除旧函数
DROP FUNCTION IF EXISTS insert_fridge_snapshot(TEXT, JSONB, TEXT);

-- 2. 创建新函数 (包含图片 URL 参数)
CREATE OR REPLACE FUNCTION insert_fridge_snapshot(
  p_device_id TEXT,
  p_items JSONB,
  p_scan_quality TEXT,
  p_image_urls TEXT[] DEFAULT '{}',
  p_thumbnail_urls TEXT[] DEFAULT '{}'
)
RETURNS fridge_snapshots
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_snapshot fridge_snapshots;
BEGIN
  -- 插入新快照
  INSERT INTO fridge_snapshots (
    device_id,
    items,
    scan_quality,
    image_urls,
    thumbnail_urls,
    scanned_at
  )
  VALUES (
    p_device_id,
    p_items,
    p_scan_quality::scan_quality_type,
    p_image_urls,
    p_thumbnail_urls,
    NOW()
  )
  RETURNING * INTO v_snapshot;

  RETURN v_snapshot;
END;
$$;

-- 3. 添加注释
COMMENT ON FUNCTION insert_fridge_snapshot IS 'Insert fridge snapshot with image URLs, bypassing RLS';

-- 4. 授予权限
GRANT EXECUTE ON FUNCTION insert_fridge_snapshot TO anon, authenticated;
```

---

## ✅ 验证

在 SQL Editor 中运行:
```sql
SELECT 
  routine_name,
  routine_type,
  data_type,
  routine_definition
FROM information_schema.routines
WHERE routine_name = 'insert_fridge_snapshot';
```

应该看到函数已创建 ✅

---

## 🚀 完成后

1. 在应用中按 `r` 重新加载
2. 尝试扫描冰箱
3. 应该能成功保存了! ✨

---

## 📝 这是什么?

### 问题原因
代码调用函数时传递了 5 个参数:
- `p_device_id`
- `p_image_urls` ← 新增
- `p_items`
- `p_scan_quality`
- `p_thumbnail_urls` ← 新增

但数据库中的旧函数只有 3 个参数:
- `p_device_id`
- `p_items`
- `p_scan_quality`

### 解决方案
更新数据库函数,添加 `p_image_urls` 和 `p_thumbnail_urls` 参数。

---

## 🔄 函数变化

### 旧版本 (3个参数)
```sql
insert_fridge_snapshot(
  p_device_id TEXT,
  p_items JSONB,
  p_scan_quality TEXT
)
```

### 新版本 (5个参数)
```sql
insert_fridge_snapshot(
  p_device_id TEXT,
  p_items JSONB,
  p_scan_quality TEXT,
  p_image_urls TEXT[] DEFAULT '{}',      ← 新增
  p_thumbnail_urls TEXT[] DEFAULT '{}'   ← 新增
)
```

---

## 📊 数据流

```
应用上传图片 → Supabase Storage
     ↓
获取图片 URLs
     ↓
调用 insert_fridge_snapshot(device_id, items, quality, image_urls, thumbnails)
     ↓
保存到 fridge_snapshots 表
```

---

## 📖 相关文档

- `docs/database/update-insert-fridge-snapshot-function.sql` - 完整 SQL 脚本
- `docs/database/add-image-columns.sql` - 数据库 schema

---

**执行这个 SQL,然后重新加载应用,保存功能就能工作了!** 🎉
