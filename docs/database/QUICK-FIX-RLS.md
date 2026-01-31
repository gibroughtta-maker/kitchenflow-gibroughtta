# 🚨 快速修复 RLS 错误

## 当前错误
```
Could not find the function public.insert_fridge_snapshot
```

## ⚡ 快速修复步骤（5 分钟）

### 步骤 1：打开 Supabase Dashboard
1. 访问：https://supabase.com/dashboard
2. 登录您的账号
3. 选择 `kitchenflow` 项目

### 步骤 2：打开 SQL Editor
- 在左侧菜单栏找到 **SQL Editor** 图标（看起来像 `</>`）
- 点击打开

### 步骤 3：复制并执行 SQL 脚本

**复制以下完整内容**，粘贴到 SQL Editor 中：

```sql
-- ============================================================================
-- 修复 RLS 策略 - 创建服务器端函数
-- ============================================================================

-- 1. 创建插入快照函数
CREATE OR REPLACE FUNCTION insert_fridge_snapshot(
  p_device_id UUID,
  p_items JSONB,
  p_scan_quality TEXT
)
RETURNS fridge_snapshots AS $$
DECLARE
  v_snapshot fridge_snapshots;
BEGIN
  -- 验证 device_id 存在
  IF NOT EXISTS (SELECT 1 FROM devices WHERE id = p_device_id) THEN
    RAISE EXCEPTION 'Device ID does not exist';
  END IF;

  -- 验证 scan_quality
  IF p_scan_quality NOT IN ('good', 'medium', 'poor') THEN
    RAISE EXCEPTION 'Invalid scan_quality value';
  END IF;

  -- 插入快照
  INSERT INTO fridge_snapshots (device_id, items, scan_quality)
  VALUES (p_device_id, p_items, p_scan_quality)
  RETURNING * INTO v_snapshot;

  RETURN v_snapshot;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 创建查询快照函数
CREATE OR REPLACE FUNCTION get_fridge_snapshots(
  p_device_id UUID,
  p_limit INTEGER DEFAULT 10,
  p_only_valid BOOLEAN DEFAULT false
)
RETURNS SETOF fridge_snapshots AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM devices WHERE id = p_device_id) THEN
    RAISE EXCEPTION 'Device ID does not exist';
  END IF;

  IF p_only_valid THEN
    RETURN QUERY
    SELECT * FROM fridge_snapshots
    WHERE device_id = p_device_id
      AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT p_limit;
  ELSE
    RETURN QUERY
    SELECT * FROM fridge_snapshots
    WHERE device_id = p_device_id
    ORDER BY created_at DESC
    LIMIT p_limit;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 创建删除快照函数
CREATE OR REPLACE FUNCTION delete_fridge_snapshot(
  p_snapshot_id UUID,
  p_device_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM fridge_snapshots
  WHERE id = p_snapshot_id
    AND device_id = p_device_id;

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  RETURN v_deleted_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 授予执行权限
GRANT EXECUTE ON FUNCTION insert_fridge_snapshot(UUID, JSONB, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_fridge_snapshots(UUID, INTEGER, BOOLEAN) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION delete_fridge_snapshot(UUID, UUID) TO anon, authenticated;

-- 5. 验证安装
SELECT 
  routine_name as function_name,
  'Created successfully' as status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'insert_fridge_snapshot',
    'get_fridge_snapshots',
    'delete_fridge_snapshot'
  );
```

### 步骤 4：执行脚本
1. 点击右下角的绿色 **Run** 按钮（或按 `Ctrl+Enter`）
2. 等待执行完成
3. 应该在结果窗口看到 3 行结果，每行显示 "Created successfully"

### 步骤 5：验证成功
在 SQL Editor 中再执行一次验证查询：

```sql
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%fridge_snapshot%';
```

应该返回 3 个函数。

## ✅ 完成！

现在回到应用：
1. 重启您的 Expo 应用（如果正在运行）
2. 扫描冰箱
3. 点击 **💾 Save Snapshot** 按钮
4. 应该成功保存！

## 🔧 如果仍然失败

### 检查 1：确认 devices 表存在
```sql
SELECT COUNT(*) FROM devices;
```

如果报错 "relation does not exist"，需要先创建 devices 表。

### 检查 2：确认 fridge_snapshots 表存在
```sql
SELECT COUNT(*) FROM fridge_snapshots;
```

如果报错，需要先运行 `migration-fridge-snapshots-clean.sql`

### 检查 3：查看应用日志
在终端查看详细错误信息，看是否还有其他问题。

## 📞 需要帮助？
如果以上步骤都完成但仍有问题，请将以下信息提供：
1. SQL 执行后的输出结果
2. 应用中的完整错误消息
3. Supabase 项目的 URL（不要包含密钥）
