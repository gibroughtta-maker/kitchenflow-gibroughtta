# Supabase 数据库设置指南

## 🚨 修复 RLS 错误

如果您遇到以下错误：
```
new row violates row-level security policy for table "fridge_snapshots"
```

这是因为 Row-Level Security (RLS) 策略需要额外的配置。我们提供了一个简单的解决方案。

## 📝 执行步骤

### 1. 登录 Supabase Dashboard
访问 [https://supabase.com/dashboard](https://supabase.com/dashboard)

### 2. 选择您的项目
找到 `kitchenflow` 项目并点击进入

### 3. 打开 SQL Editor
在左侧菜单中找到 **SQL Editor** 并点击

### 4. 执行修复脚本

复制以下文件的内容并执行：

#### 方案A：使用服务器端函数（推荐）✅

**文件：`docs/database/fix-rls-with-functions.sql`**

这个脚本会创建三个服务器端函数：
- `insert_fridge_snapshot()` - 插入快照
- `get_fridge_snapshots()` - 查询快照
- `delete_fridge_snapshot()` - 删除快照

这些函数使用 `SECURITY DEFINER` 绕过 RLS 限制，适合基于 `device_id` 的匿名访问场景。

**执行步骤**：
1. 打开 `docs/database/fix-rls-with-functions.sql`
2. 复制全部内容
3. 在 Supabase SQL Editor 中粘贴
4. 点击 **Run** 按钮执行
5. 确认显示 "Success" 消息

### 5. 验证安装

执行以下 SQL 验证函数已创建：

```sql
-- 检查函数是否存在
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'insert_fridge_snapshot',
    'get_fridge_snapshots',
    'delete_fridge_snapshot'
  );
```

应该返回 3 行结果。

### 6. 测试（可选）

```sql
-- 1. 首先获取一个有效的 device_id
SELECT id FROM devices LIMIT 1;

-- 2. 使用该 device_id 测试插入（替换 YOUR_DEVICE_ID）
SELECT insert_fridge_snapshot(
  'YOUR_DEVICE_ID'::uuid,
  '[{"name":"Test Item","quantity":1,"unit":"pcs","freshness":"fresh","confidence":0.9}]'::jsonb,
  'good'
);

-- 3. 测试查询
SELECT * FROM get_fridge_snapshots('YOUR_DEVICE_ID'::uuid, 10, true);
```

## ✅ 完成！

现在您的应用应该可以成功保存冰箱快照了。

## 🔧 故障排除

### 如果仍然遇到错误

1. **确认 devices 表存在**：
```sql
SELECT * FROM devices LIMIT 5;
```

2. **确认函数权限**：
```sql
SELECT grantee, privilege_type
FROM information_schema.routine_privileges
WHERE routine_name = 'insert_fridge_snapshot';
```

应该看到 `anon` 和 `authenticated` 都有 `EXECUTE` 权限。

3. **检查代码是否使用新函数**：
   - 确认 `fridgeService.ts` 中使用 `supabase.rpc('insert_fridge_snapshot', ...)`
   - 而不是 `supabase.from('fridge_snapshots').insert(...)`

## 📚 相关文件

- `docs/database/fix-rls-with-functions.sql` - 主修复脚本
- `docs/database/migration-fridge-snapshots.sql` - 原始迁移脚本
- `docs/database/migration-fridge-snapshots-clean.sql` - 清理并重建脚本
- `kitchenflow-app/src/services/fridgeService.ts` - 客户端服务代码

## 🆘 需要帮助？

如果遇到问题，请检查：
1. Supabase 项目是否正常运行
2. `.env` 文件中的 Supabase URL 和 Key 是否正确
3. SQL 脚本是否成功执行（无错误消息）
