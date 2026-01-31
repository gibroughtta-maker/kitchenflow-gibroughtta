-- ============================================================================
-- 一键修复 RLS 错误 - 创建服务器端函数
-- 复制此文件全部内容到 Supabase SQL Editor 并执行
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

-- 5. 验证安装（显示结果）
SELECT 
  routine_name as "✅ Function Created",
  routine_type as "Type"
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'insert_fridge_snapshot',
    'get_fridge_snapshots',
    'delete_fridge_snapshot'
  )
ORDER BY routine_name;
