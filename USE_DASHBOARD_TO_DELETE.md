# 🎯 终极解决方案:使用 Dashboard 删除

**问题:** SQL 命令无法删除多个同名函数  
**解决:** 使用 Supabase Dashboard 可视化删除  
**需要时间:** 2分钟  
**难度:** ⭐ 超级简单

---

## 🎯 步骤 1: 在 Dashboard 中删除函数

### 操作步骤:

1. **打开** https://supabase.com/dashboard
2. **选择** 你的 KitchenFlow 项目
3. **点击** 左侧菜单 **Database**
4. **点击** 顶部标签 **Functions**
5. **找到** `insert_fridge_snapshot` 函数
6. **点击** 函数名右侧的 **三个点 (...)** 或删除图标
7. **点击** "Delete" 或 "Remove"
8. **确认** 删除

### 重要提示:
- 📌 可能会看到 **多个** `insert_fridge_snapshot` 函数
- 📌 需要 **逐个删除** 每一个
- 📌 删除时可能会显示不同的参数签名
- 📌 **全部删除**,不要留下任何一个

---

## 🎯 步骤 2: 创建新函数

删除所有旧函数后,在 **SQL Editor** 中运行:

```sql
-- ============================================
-- 创建新的 insert_fridge_snapshot 函数
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

## ✅ 步骤 3: 验证

在 SQL Editor 中运行:
```sql
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines
WHERE routine_name = 'insert_fridge_snapshot';
```

**预期结果:** 只看到 **1 个函数** ✅

---

## 🚀 步骤 4: 测试应用

1. 在应用中按 `r` 重新加载
2. 尝试扫描冰箱
3. **应该能成功保存了!** ✨

---

## 📸 可视化指南

### 在 Dashboard 中你会看到:

```
Database
├── Tables
├── Functions  ← 点这里
│   ├── insert_fridge_snapshot (text, jsonb, text)          ← 删除这个
│   ├── insert_fridge_snapshot (text, jsonb, text, text[])  ← 删除这个
│   └── insert_fridge_snapshot (text, jsonb, text, text[], text[]) ← 删除这个
├── Extensions
└── ...
```

**重要:** 删除 **所有** `insert_fridge_snapshot` 函数!

---

## 💡 为什么这个方法最可靠?

### SQL 命令的问题:
```sql
-- ❌ 不能处理多个同名函数
DROP FUNCTION IF EXISTS insert_fridge_snapshot;

-- ❌ 需要精确的参数列表
DROP FUNCTION insert_fridge_snapshot(TEXT, JSONB, TEXT);

-- ❌ 但你不知道有多少个版本和它们的参数
```

### Dashboard 的优势:
- ✅ **可视化** - 能看到所有版本
- ✅ **点击删除** - 不需要写 SQL
- ✅ **逐个删除** - 确保删除干净
- ✅ **没有语法错误** - 不会出错

---

## 🔍 如果找不到 Functions 标签

### 可能的位置:
1. **Database** → **Functions**
2. **Database** → **Stored Procedures**
3. **SQL Editor** → 右侧面板 → **Schema** → **Functions**

### 备用方法:
如果实在找不到,在 SQL Editor 中运行:
```sql
-- 查看所有版本
SELECT 
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'insert_fridge_snapshot'
AND n.nspname = 'public';
```

然后根据输出,手动删除每一个:
```sql
-- 根据查询结果,可能需要运行:
DROP FUNCTION public.insert_fridge_snapshot(text, jsonb, text);
DROP FUNCTION public.insert_fridge_snapshot(text, jsonb, text, text[]);
DROP FUNCTION public.insert_fridge_snapshot(text, jsonb, text, text[], text[]);
```

---

## 📊 完成检查清单

- [ ] 打开 Supabase Dashboard
- [ ] 进入 Database → Functions
- [ ] 找到所有 `insert_fridge_snapshot` 函数
- [ ] 逐个删除 (可能有 2-3 个)
- [ ] 在 SQL Editor 中创建新函数
- [ ] 验证只有 1 个函数
- [ ] 在应用中重新加载
- [ ] 测试扫描功能

---

## 🎯 预期结果

### 删除前:
```
Functions:
- insert_fridge_snapshot (3个不同版本)
```

### 删除后:
```
Functions:
- (空)
```

### 创建新函数后:
```
Functions:
- insert_fridge_snapshot (text, jsonb, text, text[], text[])  ✅
```

---

## 📞 需要帮助?

如果在 Dashboard 中找不到函数或遇到其他问题:
1. 截图 Dashboard 界面
2. 告诉我你看到了什么
3. 我会提供更详细的指导

---

**这是最可靠的方法!使用 Dashboard 可视化删除,不会出错!** 🎉

---

## ⏱️ 时间估算

- 打开 Dashboard: 10秒
- 找到 Functions: 20秒
- 删除所有版本: 30秒
- 创建新函数: 30秒
- 验证: 10秒

**总计: 2分钟** ⏰

---

**开始吧!打开 Dashboard,删除所有旧函数,然后创建新的!** 💪
