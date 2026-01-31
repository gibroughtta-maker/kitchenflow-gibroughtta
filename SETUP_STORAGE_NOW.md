# 🚨 立即操作: 设置 Supabase Storage

**状态:** 🔴 测试被阻塞  
**原因:** Storage bucket 未创建  
**需要时间:** 5分钟  
**难度:** ⭐⭐ 简单

---

## 🎯 快速操作 (3步)

### 1️⃣ 登录 Supabase (30秒)
访问: https://supabase.com/dashboard

### 2️⃣ 创建 Bucket (1分钟)
1. 点击左侧 **Storage**
2. 点击 **New bucket**
3. 填写:
   - **Name:** `kitchenflow-images`
   - **Public bucket:** ✅ 勾选
4. 点击 **Create bucket**

### 3️⃣ 配置策略 (2分钟)
1. 点击左侧 **SQL Editor**
2. 点击 **New query**
3. 复制粘贴下面的 SQL
4. 点击 **Run**

```sql
-- 创建 bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('kitchenflow-images', 'kitchenflow-images', true)
ON CONFLICT (id) DO NOTHING;

-- 配置权限策略
CREATE POLICY "Users can upload their own images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'kitchenflow-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view their own images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'kitchenflow-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'kitchenflow-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'kitchenflow-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

---

## ✅ 验证 (30秒)

在 SQL Editor 中运行:
```sql
SELECT * FROM storage.buckets WHERE id = 'kitchenflow-images';
```

应该看到 1 行结果 ✅

---

## 🚀 完成后

1. 在应用中按 `r` 重新加载
2. 开始测试图片上传功能!

---

## 📖 详细指南

如需更详细的说明,请查看:
- `docs/SUPABASE_STORAGE_SETUP.md` - 完整图文指南
- `docs/TESTING_BLOCKED_2026-01-26.md` - 阻塞分析报告

---

**这是最后一步了!完成后所有功能都可以使用!** 🎉
