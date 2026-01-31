-- ============================================================================
-- Clear all cravings (for testing cleanup)
-- WARNING: This will delete ALL cravings data
-- Date: 2026-01-26
-- ============================================================================

-- Delete all cravings
DELETE FROM cravings;

-- Verify
SELECT COUNT(*) as remaining_cravings FROM cravings;

-- Expected: 0
SELECT '✅ All cravings cleared!' as status;
