# 🔧 立即修复: RLS 策略问题

**问题:** `new row violates row-level security policy`  
**原因:** 用户未登录,RLS 策略拒绝匿名上传  
**需要时间:** 1分钟  
**难度:** ⭐ 非常简单

---

## 🎯 快速修复 (1步)

### 在 Supabase SQL Editor 中运行:

1. 打开 https://supabase.com/dashboard
2. 选择你的项目
3. 点击左侧 **SQL Editor**
4. 点击 **New query**
5. 复制粘贴下面的 SQL
6. 点击 **Run**

```sql
-- 删除现有的限制性策略
DROP POLICY IF EXISTS "Users can upload their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;

-- 创建测试策略 (允许所有操作)
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
```

---

## ✅ 验证

在 SQL Editor 中运行:
```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage';
```

应该看到 4 个新策略:
- ✅ Allow all uploads for testing (INSERT)
- ✅ Allow all reads for testing (SELECT)
- ✅ Allow all updates for testing (UPDATE)
- ✅ Allow all deletes for testing (DELETE)

---

## 🚀 完成后

1. 在应用中按 `r` 重新加载
2. 尝试上传图片
3. 应该成功了! ✨

---

## 📝 这是什么?

### 问题原因
你的应用当前没有用户登录系统,所以 `auth.uid()` 为空。原来的 RLS 策略要求用户必须登录才能上传,导致失败。

### 解决方案
这个修复创建了**测试专用的宽松策略**,允许匿名上传。

### ⚠️ 重要说明

**这是测试配置,仅用于开发!**

- ✅ **适合:** 开发和测试环境
- ✅ **优点:** 无需登录即可测试所有功能
- ❌ **不适合:** 生产环境
- ❌ **缺点:** 任何人都可以上传/删除文件

### 后续步骤

完成测试后,你需要:
1. 实现用户认证系统
2. 恢复严格的 RLS 策略
3. 限制每个用户只能访问自己的文件

---

## 🔒 安全说明

### 当前配置 (测试)
```
任何人 → 可以上传/查看/修改/删除 → kitchenflow-images bucket
```

### 未来配置 (生产)
```
用户A → 只能访问 → {userId-A}/文件夹
用户B → 只能访问 → {userId-B}/文件夹
```

---

## 📖 相关文档

- `docs/database/fix-storage-rls-for-testing.sql` - 完整 SQL 脚本
- `docs/database/setup-storage-bucket.sql` - 原始严格策略

---

**执行这个 SQL,然后重新加载应用,图片上传就能工作了!** 🎉
