-- ============================================================================
-- Fridge Snapshots Migration - 清理并重建
-- 如果遇到"already exists"错误，先运行此脚本
-- ============================================================================

-- 删除现有的策略（如果存在）
DROP POLICY IF EXISTS "Users can view own snapshots" ON fridge_snapshots;
DROP POLICY IF EXISTS "Users can insert own snapshots" ON fridge_snapshots;
DROP POLICY IF EXISTS "Users can delete own snapshots" ON fridge_snapshots;

-- 删除触发器（如果存在）
DROP TRIGGER IF EXISTS trigger_delete_expired_snapshots ON fridge_snapshots;

-- 删除函数（如果存在）
DROP FUNCTION IF EXISTS delete_expired_snapshots();

-- 删除索引（如果存在）
DROP INDEX IF EXISTS idx_fridge_snapshots_device_expires;
DROP INDEX IF EXISTS idx_fridge_snapshots_created;
DROP INDEX IF EXISTS idx_cravings_cuisine;

-- 删除表（如果存在）
DROP TABLE IF EXISTS fridge_snapshots CASCADE;

-- ============================================================================
-- 现在重新创建所有内容
-- ============================================================================

-- 创建fridge_snapshots表
CREATE TABLE fridge_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  items JSONB NOT NULL,
  scan_quality TEXT NOT NULL CHECK (scan_quality IN ('good', 'medium', 'poor')),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_fridge_snapshots_device_expires
  ON fridge_snapshots(device_id, expires_at DESC);

CREATE INDEX idx_fridge_snapshots_created
  ON fridge_snapshots(created_at DESC);

-- 启用RLS
ALTER TABLE fridge_snapshots ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
CREATE POLICY "Users can view own snapshots"
  ON fridge_snapshots FOR SELECT
  USING (device_id = current_setting('app.device_id', true)::uuid);

CREATE POLICY "Users can insert own snapshots"
  ON fridge_snapshots FOR INSERT
  WITH CHECK (device_id = current_setting('app.device_id', true)::uuid);

CREATE POLICY "Users can delete own snapshots"
  ON fridge_snapshots FOR DELETE
  USING (device_id = current_setting('app.device_id', true)::uuid);

-- 创建自动清理函数
CREATE OR REPLACE FUNCTION delete_expired_snapshots()
RETURNS trigger AS $$
BEGIN
  DELETE FROM fridge_snapshots
  WHERE created_at < NOW() - INTERVAL '7 days';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
CREATE TRIGGER trigger_delete_expired_snapshots
  AFTER INSERT ON fridge_snapshots
  EXECUTE FUNCTION delete_expired_snapshots();

-- ============================================================================
-- 扩展cravings表
-- ============================================================================

-- 添加字段（使用IF NOT EXISTS避免重复错误）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cravings' AND column_name = 'required_ingredients'
  ) THEN
    ALTER TABLE cravings ADD COLUMN required_ingredients JSONB;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cravings' AND column_name = 'cuisine'
  ) THEN
    ALTER TABLE cravings ADD COLUMN cuisine TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cravings' AND column_name = 'difficulty'
  ) THEN
    ALTER TABLE cravings ADD COLUMN difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cravings' AND column_name = 'estimated_time'
  ) THEN
    ALTER TABLE cravings ADD COLUMN estimated_time TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cravings' AND column_name = 'servings'
  ) THEN
    ALTER TABLE cravings ADD COLUMN servings INTEGER;
  END IF;
END $$;

-- 创建cuisine索引
CREATE INDEX IF NOT EXISTS idx_cravings_cuisine
  ON cravings(cuisine) WHERE cuisine IS NOT NULL;

-- ============================================================================
-- 验证表已创建
-- ============================================================================

SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'fridge_snapshots'
ORDER BY ordinal_position;
