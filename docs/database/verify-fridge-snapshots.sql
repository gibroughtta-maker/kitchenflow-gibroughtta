-- ============================================================================
-- 验证 Fridge Snapshots 表是否正确创建
-- ============================================================================

-- 检查表是否存在
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'fridge_snapshots'
  ) THEN
    RAISE NOTICE '✅ fridge_snapshots 表已创建';
  ELSE
    RAISE EXCEPTION '❌ fridge_snapshots 表不存在';
  END IF;
END $$;

-- 检查RLS是否启用
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables
    WHERE tablename = 'fridge_snapshots'
    AND rowsecurity = true
  ) THEN
    RAISE NOTICE '✅ RLS已启用';
  ELSE
    RAISE WARNING '⚠️ RLS未启用';
  END IF;
END $$;

-- 检查策略数量
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'fridge_snapshots';

  IF policy_count >= 3 THEN
    RAISE NOTICE '✅ RLS策略已创建 (% 个)', policy_count;
  ELSE
    RAISE WARNING '⚠️ RLS策略不完整 (% 个)', policy_count;
  END IF;
END $$;

-- 检查cravings表扩展字段
DO $$
DECLARE
  field_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO field_count
  FROM information_schema.columns
  WHERE table_name = 'cravings'
  AND column_name IN ('required_ingredients', 'cuisine', 'difficulty', 'estimated_time', 'servings');

  IF field_count = 5 THEN
    RAISE NOTICE '✅ cravings表已扩展 (5个新字段)';
  ELSE
    RAISE WARNING '⚠️ cravings表扩展不完整 (% 个字段)', field_count;
  END IF;
END $$;

-- 显示表结构
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'fridge_snapshots'
ORDER BY ordinal_position;
