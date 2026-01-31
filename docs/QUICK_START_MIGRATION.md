# 购物清单功能 - 快速开始

## ⚡ 3 步完成迁移和测试

### 步骤 1: 运行数据库迁移 (2 分钟)

1. 打开 [Supabase Dashboard](https://app.supabase.com) → 你的项目
2. 点击左侧 **SQL Editor**
3. 点击 **New Query**
4. 复制以下 SQL 并粘贴：

```sql
-- Shopping List Feature - Database Migration
ALTER TABLE shopping_items 
ADD COLUMN IF NOT EXISTS store_id TEXT,
ADD COLUMN IF NOT EXISTS unit TEXT,
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS source_craving_id UUID REFERENCES cravings(id),
ADD COLUMN IF NOT EXISTS notes TEXT;

CREATE INDEX IF NOT EXISTS idx_shopping_items_store ON shopping_items(store_id);
CREATE INDEX IF NOT EXISTS idx_shopping_items_source ON shopping_items(source, source_craving_id);
```

5. 点击 **Run** (或按 Cmd/Ctrl + Enter)
6. 确认看到 "Success" ✅

### 步骤 2: 验证迁移 (30 秒)

在同一个 SQL Editor 中运行：

```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'shopping_items' 
  AND column_name IN ('store_id', 'unit', 'source', 'source_craving_id', 'notes');
```

应该看到 5 行结果。

### 步骤 3: 测试应用 (1 分钟)

```bash
cd kitchenflow-app
npm start
```

在应用中：
1. 导航到 **Shopping List** 页面
2. 应该看到商店选择模态框（首次使用）
3. 选择至少 1 个商店，点击继续
4. 使用底部输入框添加商品
5. 商品应该按商店分组显示

## 🧪 运行自动化测试

### 方式 1: 使用测试屏幕

在应用中访问：`kitchenflow://dev/test-shopping`

或从代码中导航到 `ShoppingListTest` 屏幕，点击 "Run All Tests"

### 方式 2: 检查控制台

打开应用后，在控制台应该看到测试结果。

## ✅ 验证清单

- [ ] 迁移 SQL 成功运行
- [ ] 5 个新列存在
- [ ] 应用启动无错误
- [ ] 首次使用显示商店选择
- [ ] 可以添加商品
- [ ] 商品按商店分组
- [ ] 勾选商品后 3 秒自动删除（带 Undo）

## 📚 详细文档

- **完整迁移指南**: [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)
- **测试指南**: [TESTING_GUIDE.md](./TESTING_GUIDE.md)
- **实施文档**: [SHOPPING_LIST_IMPLEMENTATION.md](./SHOPPING_LIST_IMPLEMENTATION.md)

## 🐛 遇到问题？

### 迁移失败？
- 检查是否在 Supabase Dashboard 的 SQL Editor 中运行
- 确认 `shopping_items` 表已存在
- 查看错误消息，通常是权限问题

### 应用报错？
- 确认迁移已成功运行
- 检查 Supabase 环境变量是否正确
- 重启应用

### 测试失败？
- 查看控制台错误信息
- 检查数据库连接
- 确认 deviceId 已创建

## 🎉 完成！

迁移和测试完成后，你可以：
- 继续实施 Phase 4-6（编辑功能、Craving 集成、WebView）
- 或开始使用新功能
