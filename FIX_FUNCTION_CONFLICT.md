# 🔧 修复函数冲突

**问题:** `function name "insert_fridge_snapshot" is not unique`  
**原因:** 数据库中存在多个同名函数  
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
-- 第1步: 删除所有版本的 insert_fridge_snapshot 函数
-- ============================================

-- 删除可能存在的所有版本
DROP FUNCTION IF EXISTS insert_fridge_snapshot(TEXT, JSONB, TEXT);
DROP FUNCTION IF EXISTS insert_fridge_snapshot(TEXT, JSONB, TEXT, TEXT[]);
DROP FUNCTION IF EXISTS insert_fridge_snapshot(TEXT, JSONB, TEXT, TEXT[], TEXT[]);
DROP FUNCTION IF EXISTS public.insert_fridge_snapshot(TEXT, JSONB, TEXT);
DROP FUNCTION IF EXISTS public.insert_fridge_snapshot(TEXT, JSONB, TEXT, TEXT[]);
DROP FUNCTION IF EXISTS public.insert_fridge_snapshot(TEXT, JSONB, TEXT, TEXT[], TEXT[]);

-- ============================================
-- 第2步: 创建新的函数 (5个参数)
-- ============================================

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

-- ============================================
-- 第3步: 添加注释和权限
-- ============================================

COMMENT ON FUNCTION insert_fridge_snapshot IS 'Insert fridge snapshot with image URLs, bypassing RLS';

GRANT EXECUTE ON FUNCTION insert_fridge_snapshot TO anon, authenticated;
```

---

## ✅ 验证

在 SQL Editor 中运行:
```sql
-- 检查是否只有一个函数
SELECT 
  routine_name,
  routine_type,
  specific_name,
  data_type
FROM information_schema.routines
WHERE routine_name = 'insert_fridge_snapshot';
```

**预期结果:** 应该只看到 **1 个函数** ✅

---

## 🚀 完成后

1. 在应用中按 `r` 重新加载
2. 尝试扫描冰箱
3. 应该能成功保存了! ✨

---

## 📝 这是什么?

### 问题原因
数据库中存在多个版本的 `insert_fridge_snapshot` 函数:
- 旧版本 (3个参数)
- 可能的中间版本 (4个参数)
- 新版本 (5个参数)

PostgreSQL 不知道该使用哪一个,所以报错。

### 解决方案
1. 删除所有可能存在的版本
2. 只创建一个新版本 (5个参数)

---

## 🔍 删除的函数版本

```sql
-- 版本1: 3个参数 (原始版本)
DROP FUNCTION IF EXISTS insert_fridge_snapshot(TEXT, JSONB, TEXT);

-- 版本2: 4个参数 (可能的中间版本)
DROP FUNCTION IF EXISTS insert_fridge_snapshot(TEXT, JSONB, TEXT, TEXT[]);

-- 版本3: 5个参数 (目标版本)
DROP FUNCTION IF EXISTS insert_fridge_snapshot(TEXT, JSONB, TEXT, TEXT[], TEXT[]);
```

---

## 💡 为什么会有多个版本?

可能的原因:
1. 之前执行过部分 SQL 脚本
2. 函数被创建了多次
3. 使用了 `CREATE OR REPLACE` 但参数不匹配

PostgreSQL 允许同名函数只要参数不同 (函数重载),但这里我们只需要一个版本。

---

## 📖 相关文档

- `FIX_DATABASE_FUNCTION.md` - 原始修复文档
- `docs/database/update-insert-fridge-snapshot-function.sql` - 完整 SQL 脚本

---

**执行这个 SQL,清理所有旧版本,然后创建新版本!** 🎉
