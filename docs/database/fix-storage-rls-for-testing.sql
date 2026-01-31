-- ============================================
-- 修复 Storage RLS 策略 - 测试版本
-- ============================================
-- 
-- 问题: "new row violates row-level security policy"
-- 原因: 用户未登录,auth.uid() 为空
-- 解决: 临时允许匿名上传 (仅用于开发测试)
--
-- ⚠️ 警告: 这是测试配置,生产环境需要启用身份验证!
-- ============================================

-- 1. 删除现有的限制性策略
DROP POLICY IF EXISTS "Users can upload their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;

-- 2. 创建宽松的测试策略 (允许所有操作)
CREATE POLICY "Allow all uploads for testing"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'kitchenflow-images');

CREATE POLICY "Allow all reads for testing"
ON storage.objects FOR SELECT
USING (bucket_id = 'kitchenflow-images');

CREATE POLICY "Allow all updates for testing"
ON storage.objects FOR UPDATE
USING (bucket_id = 'kitchenflow-images');

CREATE POLICY "Allow all deletes for testing"
ON storage.objects FOR DELETE
USING (bucket_id = 'kitchenflow-images');

-- 3. 验证策略
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
ORDER BY policyname;

-- ============================================
-- 预期结果:
-- 应该看到 4 个新策略,都针对 'kitchenflow-images' bucket
-- ============================================

-- ============================================
-- 📝 说明
-- ============================================
-- 
-- 这些策略允许任何人对 kitchenflow-images bucket 执行 CRUD 操作
-- 
-- 优点:
-- ✅ 无需用户登录即可测试上传功能
-- ✅ 快速验证图片上传和 AI 功能
-- ✅ 适合开发和测试环境
-- 
-- 缺点:
-- ⚠️ 任何人都可以上传/删除文件
-- ⚠️ 没有用户隔离
-- ⚠️ 不适合生产环境
-- 
-- 后续步骤:
-- 1. 完成功能测试
-- 2. 实现用户认证系统
-- 3. 恢复严格的 RLS 策略 (见 restore-storage-rls.sql)
-- 
-- ============================================
