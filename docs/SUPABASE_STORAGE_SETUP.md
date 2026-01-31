# 🗄️ Supabase Storage 设置指南

**问题:** `Bucket not found` 错误  
**原因:** Supabase Storage bucket 尚未创建  
**优先级:** 🔴 Critical - 阻止所有上传功能

---

## 🚀 快速设置 (5分钟)

### 步骤 1: 登录 Supabase Dashboard

1. 访问 [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. 登录你的账户
3. 选择 **KitchenFlow** 项目

---

### 步骤 2: 创建 Storage Bucket

#### 方式 1: 使用 UI (推荐)

1. 在左侧菜单中点击 **Storage**
2. 点击 **New bucket** 按钮
3. 填写以下信息:
   - **Name:** `kitchenflow-images`
   - **Public bucket:** ✅ 勾选 (允许公开访问)
   - **File size limit:** 50 MB (可选)
   - **Allowed MIME types:** `image/*` (可选)
4. 点击 **Create bucket**

#### 方式 2: 使用 SQL (高级)

1. 在左侧菜单中点击 **SQL Editor**
2. 点击 **New query**
3. 复制粘贴以下 SQL:

```sql
-- 创建 storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('kitchenflow-images', 'kitchenflow-images', true)
ON CONFLICT (id) DO NOTHING;
```

4. 点击 **Run** 执行

---

### 步骤 3: 配置 RLS 策略

1. 在 **SQL Editor** 中创建新查询
2. 复制粘贴以下完整 SQL:

```sql
-- ============================================
-- Storage RLS Policies for KitchenFlow
-- ============================================

-- 1. 允许用户上传自己的图片
CREATE POLICY "Users can upload their own images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'kitchenflow-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 2. 允许用户查看自己的图片
CREATE POLICY "Users can view their own images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'kitchenflow-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. 允许用户更新自己的图片
CREATE POLICY "Users can update their own images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'kitchenflow-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. 允许用户删除自己的图片
CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'kitchenflow-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

3. 点击 **Run** 执行

---

### 步骤 4: 验证设置

#### 检查 Bucket

在 SQL Editor 中运行:

```sql
SELECT * FROM storage.buckets WHERE id = 'kitchenflow-images';
```

**预期结果:**
```
id                  | name                | public | created_at
--------------------|---------------------|--------|------------
kitchenflow-images  | kitchenflow-images  | true   | 2026-01-26...
```

#### 检查 RLS 策略

在 SQL Editor 中运行:

```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage';
```

**预期结果:** 应该看到 4 个策略:
- Users can upload their own images (INSERT)
- Users can view their own images (SELECT)
- Users can update their own images (UPDATE)
- Users can delete their own images (DELETE)

---

## 📁 文件夹结构

创建 bucket 后,图片将按以下结构存储:

```
kitchenflow-images/
├── {userId}/
│   ├── fridge-scans/
│   │   ├── 1706234567890-abc123.jpg
│   │   ├── thumb_1706234567890-abc123.jpg
│   │   └── ...
│   ├── receipts/
│   │   ├── 1706234567890-def456.jpg
│   │   ├── thumb_1706234567890-def456.jpg
│   │   └── ...
│   └── items/
│       ├── 1706234567890-ghi789.jpg
│       └── ...
```

---

## ✅ 完成后

### 1. 重新加载应用

在 Expo 开发服务器中按 `r` 重新加载应用

### 2. 测试上传

尝试:
- 📸 从相册上传图片
- 🧾 扫描小票
- 🔍 冰箱扫描

### 3. 验证 Storage

在 Supabase Dashboard:
1. 进入 **Storage** > **kitchenflow-images**
2. 应该看到你的 userId 文件夹
3. 点击进入查看上传的图片

---

## 🐛 故障排除

### 问题 1: "Bucket not found" 仍然存在

**解决方案:**
1. 确认 bucket 名称完全匹配: `kitchenflow-images`
2. 检查 bucket 是否设置为 public
3. 重启应用并重试

### 问题 2: "new row violates row-level security policy"

**解决方案:**
1. 确认已创建所有 4 个 RLS 策略
2. 确认用户已登录 (有 auth.uid())
3. 检查策略中的 bucket_id 是否正确

### 问题 3: 图片上传成功但无法查看

**解决方案:**
1. 确认 bucket 设置为 **public**
2. 检查 "Users can view their own images" 策略
3. 验证图片 URL 格式正确

---

## 📊 安全说明

### RLS 策略如何工作

1. **文件夹隔离:** 每个用户只能访问自己的文件夹 `{userId}/`
2. **自动验证:** Supabase 自动验证 `auth.uid()` 匹配文件夹名
3. **公开访问:** Bucket 设置为 public,允许通过 URL 访问图片
4. **操作限制:** 用户只能对自己的文件执行 CRUD 操作

### 为什么设置为 Public Bucket?

- ✅ 允许应用直接通过 URL 加载图片
- ✅ 不需要每次都生成签名 URL
- ✅ 更快的图片加载速度
- ✅ RLS 策略仍然保护上传/删除操作

---

## 📞 相关文档

- `docs/database/setup-storage-bucket.sql` - 完整 SQL 脚本
- `docs/database/add-image-columns.sql` - 数据库 schema
- Supabase Storage 文档: https://supabase.com/docs/guides/storage

---

## 🎯 下一步

完成 Storage 设置后:

1. ✅ 重新加载应用
2. 🧪 测试图片上传
3. 📝 记录测试结果
4. 🚀 继续功能测试

---

**设置时间:** ~5分钟  
**优先级:** 🔴 Critical  
**状态:** ⏳ 等待用户执行

---

## 💡 提示

如果你不确定如何操作,可以:
1. 截图 Supabase Dashboard
2. 询问具体步骤
3. 我可以提供更详细的指导

**记住:** 这是一次性设置,完成后就不需要再做了! 💪
