-- ============================================================================
-- 修复 RLS 策略问题 - 使用服务器端函数绕过限制
-- 适用于基于 device_id 的匿名访问场景
-- ============================================================================

-- 1. 创建插入快照函数（SECURITY DEFINER 绕过RLS）
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

-- 2. 创建查询快照函数（SECURITY DEFINER 绕过RLS）
CREATE OR REPLACE FUNCTION get_fridge_snapshots(
  p_device_id UUID,
  p_limit INTEGER DEFAULT 10,
  p_only_valid BOOLEAN DEFAULT false
)
RETURNS SETOF fridge_snapshots AS $$
BEGIN
  -- 验证 device_id 存在
  IF NOT EXISTS (SELECT 1 FROM devices WHERE id = p_device_id) THEN
    RAISE EXCEPTION 'Device ID does not exist';
  END IF;

  IF p_only_valid THEN
    -- 只返回未过期的快照
    RETURN QUERY
    SELECT * FROM fridge_snapshots
    WHERE device_id = p_device_id
      AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT p_limit;
  ELSE
    -- 返回所有快照（包括过期的）
    RETURN QUERY
    SELECT * FROM fridge_snapshots
    WHERE device_id = p_device_id
    ORDER BY created_at DESC
    LIMIT p_limit;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 创建删除快照函数（SECURITY DEFINER 绕过RLS）
CREATE OR REPLACE FUNCTION delete_fridge_snapshot(
  p_snapshot_id UUID,
  p_device_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  -- 删除快照（只能删除属于指定设备的快照）
  DELETE FROM fridge_snapshots
  WHERE id = p_snapshot_id
    AND device_id = p_device_id;

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  RETURN v_deleted_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 授予执行权限给所有用户（包括匿名用户）
GRANT EXECUTE ON FUNCTION insert_fridge_snapshot(UUID, JSONB, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_fridge_snapshots(UUID, INTEGER, BOOLEAN) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION delete_fridge_snapshot(UUID, UUID) TO anon, authenticated;

-- 5. 测试函数（替换成实际的 device_id）
/*
-- 测试插入
SELECT insert_fridge_snapshot(
  'YOUR_DEVICE_ID_HERE'::uuid,
  '[{"name":"Test Item","quantity":1,"unit":"pcs","freshness":"fresh","confidence":0.9}]'::jsonb,
  'good'
);

-- 测试查询
SELECT * FROM get_fridge_snapshots('YOUR_DEVICE_ID_HERE'::uuid, 10, true);

-- 测试删除
SELECT delete_fridge_snapshot('SNAPSHOT_ID_HERE'::uuid, 'YOUR_DEVICE_ID_HERE'::uuid);
*/

-- ============================================================================
-- 说明
-- ============================================================================
-- 
-- 这些函数使用 SECURITY DEFINER 标记，意味着它们以函数创建者的权限运行，
-- 从而绕过了 RLS 策略。这对于基于 device_id 而非 auth.uid() 的场景很有用。
-- 
-- 使用方法：
-- 1. 在 Supabase SQL Editor 中运行此脚本
-- 2. 在客户端代码中使用 supabase.rpc() 调用这些函数
-- 3. 不再需要直接操作 fridge_snapshots 表
--
