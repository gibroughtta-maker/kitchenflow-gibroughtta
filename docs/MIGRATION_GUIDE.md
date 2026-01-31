# 购物清单功能 - 数据库迁移指南

## 📋 迁移步骤

### 1. 在 Supabase Dashboard 中运行迁移

1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 选择你的项目
3. 进入 **SQL Editor**
4. 点击 **New Query**
5. 复制并粘贴以下 SQL（来自 `docs/sql/shopping_list_migration.sql`）：

```sql
-- Shopping List Feature - Database Migration
-- Adds store categorization and enhanced tracking to shopping_items table
-- Date: 2026-01-27

-- Add new columns to shopping_items
ALTER TABLE shopping_items 
ADD COLUMN IF NOT EXISTS store_id TEXT,
ADD COLUMN IF NOT EXISTS unit TEXT,
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS source_craving_id UUID REFERENCES cravings(id),
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create index for store filtering
CREATE INDEX IF NOT EXISTS idx_shopping_items_store ON shopping_items(store_id);

-- Create index for source tracking
CREATE INDEX IF NOT EXISTS idx_shopping_items_source ON shopping_items(source, source_craving_id);

-- Add comment for documentation
COMMENT ON COLUMN shopping_items.store_id IS 'UK supermarket ID: sainsburys, asda, morrisons, lidl, waitrose, aldi, coop, iceland, marks';
COMMENT ON COLUMN shopping_items.unit IS 'Unit of measurement: g, L, pcs, etc.';
COMMENT ON COLUMN shopping_items.source IS 'How item was added: manual, craving, or ai';
COMMENT ON COLUMN shopping_items.source_craving_id IS 'Reference to craving if item came from craving';
COMMENT ON COLUMN shopping_items.notes IS 'User notes for the item';
```

6. 点击 **Run** 执行迁移
7. 确认没有错误

### 2. 验证迁移成功

在 SQL Editor 中运行以下查询验证：

```sql
-- 检查新列是否存在
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'shopping_items'
  AND column_name IN ('store_id', 'unit', 'source', 'source_craving_id', 'notes')
ORDER BY column_name;

-- 检查索引是否创建
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'shopping_items'
  AND indexname IN ('idx_shopping_items_store', 'idx_shopping_items_source');
```

预期结果：
- 应该看到 5 个新列
- 应该看到 2 个新索引

## ✅ 迁移后测试清单

### 功能测试

- [ ] **首次使用引导**
  - 打开购物清单页面
  - 应该显示商店选择模态框
  - 选择至少 1 个商店
  - 点击继续，模态框应该消失

- [ ] **添加商品（带商店）**
  - 使用 QuickAddBar 添加商品
  - 商品应该自动分配到上次使用的商店
  - 商品应该显示在对应的商店分组下

- [ ] **按商店分组显示**
  - 添加多个不同商店的商品
  - 商品应该按商店分组显示
  - 每个商店分组应该显示商店图标和名称

- [ ] **勾选和自动删除**
  - 勾选一个商品
  - 3 秒后应该自动删除
  - 应该显示 "Undo" 按钮
  - 点击 Undo 应该恢复商品

- [ ] **商店偏好保存**
  - 关闭并重新打开应用
  - 商店偏好应该被保存
  - 上次使用的商店应该被记住

## 🐛 常见问题

### 问题 1: 迁移失败 - "column already exists"
**解决**: 这是正常的，`IF NOT EXISTS` 会跳过已存在的列。可以安全忽略。

### 问题 2: 迁移失败 - "relation does not exist"
**解决**: 确保 `shopping_items` 表已经存在。如果不存在，需要先运行基础数据库设置脚本。

### 问题 3: 迁移失败 - "permission denied"
**解决**: 确保使用 Supabase Dashboard 的 SQL Editor，而不是通过应用连接。

### 问题 4: 应用报错 - "column store_id does not exist"
**解决**: 
1. 确认迁移已成功运行
2. 检查 Supabase 项目是否正确
3. 重启应用以刷新连接

## 📝 回滚步骤（如果需要）

如果需要回滚迁移：

```sql
-- 删除索引
DROP INDEX IF EXISTS idx_shopping_items_store;
DROP INDEX IF EXISTS idx_shopping_items_source;

-- 删除列（注意：这会删除数据）
ALTER TABLE shopping_items 
DROP COLUMN IF EXISTS store_id,
DROP COLUMN IF EXISTS unit,
DROP COLUMN IF EXISTS source,
DROP COLUMN IF EXISTS source_craving_id,
DROP COLUMN IF EXISTS notes;
```

**警告**: 回滚会删除所有新列中的数据！
