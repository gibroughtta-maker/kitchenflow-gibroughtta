# 🔧 最终修复:数据库函数

**问题:** SQL 语法错误 - `$$` 符号冲突  
**原因:** DO 块和函数定义使用了相同的分隔符  
**需要时间:** 30秒  
**难度:** ⭐ 非常简单

---

## 🎯 最简单的方法:直接用 CASCADE

### 在 Supabase SQL Editor 中运行:

```sql
-- ============================================
-- 第1步: 强制删除函数 (使用 CASCADE)
-- ============================================

DROP FUNCTION IF EXISTS public.insert_fridge_snapshot CASCADE;

-- ============================================
-- 第2步: 创建新函数 (5个参数)
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

运行以下 SQL 确认函数已创建:
```sql
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines
WHERE routine_name = 'insert_fridge_snapshot';
```

**预期结果:** 看到 **1 个函数** ✅

---

## 🚀 完成后

1. 在应用中按 `r` 重新加载
2. 尝试扫描冰箱
3. **应该能成功保存了!** ✨

---

## 📝 为什么这个能工作?

### 之前的问题
```sql
DO $$ 
...
END $$;  ← 这个 $$ 与下面的函数 $$ 冲突

CREATE FUNCTION ... AS $$
...
END $$;  ← 这个 $$ 导致语法错误
```

### 现在的解决方案
```sql
-- 简单直接:不使用 DO 块
DROP FUNCTION IF EXISTS public.insert_fridge_snapshot CASCADE;

-- CASCADE 会删除所有版本和依赖
-- 然后创建新函数
CREATE OR REPLACE FUNCTION ...
```

---

## 💡 CASCADE 的作用

`CASCADE` 会:
- ✅ 删除所有同名函数 (不管参数)
- ✅ 删除所有依赖
- ✅ 强制清理
- ✅ 避免冲突

---

## 🎯 如果还是报错 "not unique"

那就在 Supabase Dashboard 中手动删除:

1. 打开 Supabase Dashboard
2. 点击 **Database** → **Functions**
3. 找到 `insert_fridge_snapshot`
4. **点击删除** (可能需要点多次)
5. 然后运行上面的 `CREATE OR REPLACE FUNCTION` 部分

---

## 📖 相关文档

- `FORCE_FIX_FUNCTION.md` - 之前的尝试 (DO 块有语法错误)
- `FIX_FUNCTION_CONFLICT.md` - 第一次尝试
- `FIX_DATABASE_FUNCTION.md` - 原始文档

---

**这是最简单的版本!复制 SQL 并运行!** 🎉

---

## 🔍 为什么之前失败?

1. **第一次尝试:** `DROP FUNCTION IF EXISTS` 不能处理多个同名函数
2. **第二次尝试:** `DO $$ ... END $$;` 与 `CREATE FUNCTION ... AS $$ ... END $$;` 的 `$$` 符号冲突
3. **这次:** 直接使用 `DROP ... CASCADE` - 简单有效!

---

**如果这个还不行,就用 Dashboard 手动删除!** 💪
