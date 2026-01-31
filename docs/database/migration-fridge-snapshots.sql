-- ============================================================================
-- Fridge Snapshots Migration
-- 用于Scanner功能：保存冰箱扫描结果
-- ============================================================================

-- 创建fridge_snapshots表
CREATE TABLE IF NOT EXISTS fridge_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  items JSONB NOT NULL,  -- FreshItem[] 数组
  scan_quality TEXT NOT NULL CHECK (scan_quality IN ('good', 'medium', 'poor')),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_fridge_snapshots_device_expires
  ON fridge_snapshots(device_id, expires_at DESC);

CREATE INDEX IF NOT EXISTS idx_fridge_snapshots_created
  ON fridge_snapshots(created_at DESC);

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

ALTER TABLE fridge_snapshots ENABLE ROW LEVEL SECURITY;

-- Policy: 用户只能查看自己的快照
CREATE POLICY "Users can view own snapshots"
  ON fridge_snapshots FOR SELECT
  USING (device_id = current_setting('app.device_id', true)::uuid);

-- Policy: 用户只能插入自己的快照
CREATE POLICY "Users can insert own snapshots"
  ON fridge_snapshots FOR INSERT
  WITH CHECK (device_id = current_setting('app.device_id', true)::uuid);

-- Policy: 用户只能删除自己的快照
CREATE POLICY "Users can delete own snapshots"
  ON fridge_snapshots FOR DELETE
  USING (device_id = current_setting('app.device_id', true)::uuid);

-- ============================================================================
-- 自动清理过期快照（可选，减少存储空间）
-- ============================================================================

-- 创建清理函数
CREATE OR REPLACE FUNCTION delete_expired_snapshots()
RETURNS trigger AS $$
BEGIN
  -- 删除超过7天的快照（保留7天历史）
  DELETE FROM fridge_snapshots
  WHERE created_at < NOW() - INTERVAL '7 days';

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器（每次INSERT时清理）
DROP TRIGGER IF EXISTS trigger_delete_expired_snapshots ON fridge_snapshots;
CREATE TRIGGER trigger_delete_expired_snapshots
  AFTER INSERT ON fridge_snapshots
  EXECUTE FUNCTION delete_expired_snapshots();

-- ============================================================================
-- 扩展cravings表以支持Craving分析结果
-- ============================================================================

-- 添加新字段（如果不存在）
ALTER TABLE cravings
ADD COLUMN IF NOT EXISTS required_ingredients JSONB,
ADD COLUMN IF NOT EXISTS cuisine TEXT,
ADD COLUMN IF NOT EXISTS difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
ADD COLUMN IF NOT EXISTS estimated_time TEXT,
ADD COLUMN IF NOT EXISTS servings INTEGER;

-- 为菜系字段创建索引（可选，用于按菜系筛选）
CREATE INDEX IF NOT EXISTS idx_cravings_cuisine
  ON cravings(cuisine) WHERE cuisine IS NOT NULL;

-- ============================================================================
-- 测试数据（可选，用于验证）
-- ============================================================================

-- 插入测试快照（需要替换 device_id）
/*
INSERT INTO fridge_snapshots (device_id, items, scan_quality, expires_at)
VALUES (
  'YOUR_DEVICE_ID_HERE'::uuid,
  '[
    {
      "name": "Baby Spinach",
      "quantity": 1,
      "unit": "bag",
      "freshness": "fresh",
      "confidence": 0.9,
      "visualNotes": "Fresh and green"
    },
    {
      "name": "Tomatoes",
      "quantity": 3,
      "unit": "pcs",
      "freshness": "use-soon",
      "confidence": 0.85,
      "visualNotes": "Slight soft spots"
    }
  ]'::jsonb,
  'good',
  NOW() + INTERVAL '24 hours'
);
*/

-- 验证表已创建
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'fridge_snapshots'
ORDER BY ordinal_position;
