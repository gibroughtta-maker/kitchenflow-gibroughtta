# 🔧 强制修复函数冲突

**问题:** `function name "insert_fridge_snapshot" is not unique`  
**原因:** 需要使用更强力的清理方法  
**需要时间:** 1分钟  
**难度:** ⭐ 非常简单

---

## 🎯 方法 1: 使用 CASCADE (推荐)

### 在 Supabase SQL Editor 中运行:

```sql
-- ============================================
-- 强制删除所有 insert_fridge_snapshot 函数
-- ============================================

-- 使用 CASCADE 删除所有依赖
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN 
        SELECT 
            routine_schema,
            routine_name,
            specific_name,
            routine_definition
        FROM information_schema.routines
        WHERE routine_name = 'insert_fridge_snapshot'
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || r.routine_schema || '.' || r.routine_name || ' CASCADE';
    END LOOP;
END $$;

-- ============================================
-- 创建新的函数 (5个参数)
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

-- 添加注释和权限
COMMENT ON FUNCTION insert_fridge_snapshot IS 'Insert fridge snapshot with image URLs, bypassing RLS';
GRANT EXECUTE ON FUNCTION insert_fridge_snapshot TO anon, authenticated;
```

---

## 🎯 方法 2: 手动查找并删除 (如果方法1失败)

### 步骤 1: 查找所有版本

在 SQL Editor 中运行:
```sql
SELECT 
    routine_schema,
    routine_name,
    specific_name,
    data_type,
    routine_definition
FROM information_schema.routines
WHERE routine_name = 'insert_fridge_snapshot';
```

### 步骤 2: 根据结果手动删除

如果看到多个函数,复制下面的 SQL 并根据需要调整:

```sql
-- 根据查询结果,可能需要运行以下命令之一:

-- 如果函数在 public schema
DROP FUNCTION public.insert_fridge_snapshot CASCADE;

-- 或者指定完整的函数签名
DROP FUNCTION public.insert_fridge_snapshot(text, jsonb, text) CASCADE;
DROP FUNCTION public.insert_fridge_snapshot(text, jsonb, text, text[]) CASCADE;
DROP FUNCTION public.insert_fridge_snapshot(text, jsonb, text, text[], text[]) CASCADE;
```

### 步骤 3: 创建新函数

运行方法1中的 `CREATE OR REPLACE FUNCTION` 部分。

---

## 🎯 方法 3: 使用 Supabase Dashboard (最简单)

### 步骤 1: 在 Dashboard 中删除

1. 打开 Supabase Dashboard
2. 点击左侧 **Database**
3. 点击 **Functions** 标签
4. 找到 `insert_fridge_snapshot` 函数
5. 点击删除按钮 (可能需要删除多次)

### 步骤 2: 创建新函数

在 SQL Editor 中运行方法1的 `CREATE OR REPLACE FUNCTION` 部分。

---

## ✅ 验证

运行以下 SQL 确认只有一个函数:
```sql
SELECT 
    routine_name,
    routine_type,
    specific_name,
    data_type
FROM information_schema.routines
WHERE routine_name = 'insert_fridge_snapshot';
```

**预期结果:** 只看到 **1 个函数** ✅

---

## 🚀 完成后

1. 在应用中按 `r` 重新加载
2. 尝试扫描冰箱
3. 应该能成功保存了! ✨

---

## 📝 为什么需要 CASCADE?

`CASCADE` 会删除所有依赖于该函数的对象。这确保:
- ✅ 删除函数本身
- ✅ 删除所有引用
- ✅ 清理所有依赖
- ✅ 避免冲突

---

## 💡 推荐顺序

1. **先试方法1** (使用 DO 块和 CASCADE) - 最自动化
2. **如果失败,试方法3** (使用 Dashboard) - 最直观
3. **最后试方法2** (手动删除) - 最精确

---

## 🔍 DO 块解释

```sql
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- 循环查找所有同名函数
    FOR r IN 
        SELECT * FROM information_schema.routines
        WHERE routine_name = 'insert_fridge_snapshot'
    LOOP
        -- 动态删除每个函数
        EXECUTE 'DROP FUNCTION ... CASCADE';
    END LOOP;
END $$;
```

这个脚本会:
1. 查找所有名为 `insert_fridge_snapshot` 的函数
2. 逐个删除它们
3. 使用 CASCADE 确保彻底删除

---

## 📖 相关文档

- `FIX_FUNCTION_CONFLICT.md` - 之前的尝试
- `FIX_DATABASE_FUNCTION.md` - 原始修复文档

---

**推荐使用方法1!复制 SQL 并运行,应该能解决问题!** 🎉
