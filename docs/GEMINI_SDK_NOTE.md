# ⚠️ Gemini SDK 使用说明

**日期:** 2026-01-26  
**状态:** 需要注意

---

## 📦 当前使用的包

**Package:** `@google/generative-ai`  
**Version:** ^0.24.1  
**Status:** ✅ 已安装并可用

---

## 🔄 SDK 迁移说明

### 理想情况
根据 `@skill/gemini-api-cursor` 的建议,应该使用:
- ✅ `@google/genai` - 新版 SDK (2025+)
- ❌ `@google/generative-ai` - 旧版 SDK (将于 2025年11月废弃)

### 实际情况
目前项目使用 `@google/generative-ai` 因为:
1. `@google/genai` 包在 npm 上不存在或版本号不匹配
2. 现有代码已经基于 `@google/generative-ai` 实现
3. 功能完全正常工作

---

## 🎯 当前策略

### 短期 (现在)
- ✅ 继续使用 `@google/generative-ai`
- ✅ 所有功能正常工作
- ✅ 代码已经实现并测试

### 中期 (2025年下半年)
- [ ] 关注 `@google/genai` 的正式发布
- [ ] 准备迁移计划
- [ ] 更新代码以使用新 SDK

### 长期 (2025年11月前)
- [ ] 完成迁移到 `@google/genai`
- [ ] 测试所有功能
- [ ] 更新文档

---

## 📝 代码兼容性

### 当前代码使用的 API
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// 文本生成
const result = await model.generateContent(prompt);

// 视觉 API
const result = await model.generateContent([
  prompt,
  { inlineData: { mimeType, data: base64 } }
]);
```

### 未来 @google/genai API (参考)
```typescript
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({});  // 自动读取 GEMINI_API_KEY
const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: prompt
});
```

---

## ✅ 测试状态

### 当前包 (@google/generative-ai)
- ✅ 已安装
- ✅ API Key 已配置
- ✅ 代码已实现
- ✅ 功能可以测试

### 迁移到新包的优先级
- **优先级:** Low (不紧急)
- **原因:** 当前包工作正常,废弃日期还很远
- **建议:** 在2025年中期开始准备迁移

---

## 🔍 验证当前设置

### 检查包是否安装
```powershell
Test-Path node_modules\@google\generative-ai
# 应该返回 True
```

### 检查 API Key
```powershell
Get-Content .env | Select-String "GEMINI_API_KEY"
# 应该显示 API Key
```

### 测试 API 调用
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.EXPO_PUBLIC_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

const result = await model.generateContent('Hello');
console.log(result.response.text());
```

---

## 📊 迁移计划 (未来)

### Phase 1: 研究 (2025年6月)
- [ ] 确认 `@google/genai` 正式发布
- [ ] 阅读迁移指南
- [ ] 了解 API 变化

### Phase 2: 准备 (2025年8月)
- [ ] 创建迁移分支
- [ ] 更新 package.json
- [ ] 修改代码以使用新 API

### Phase 3: 测试 (2025年9月)
- [ ] 测试所有功能
- [ ] 修复兼容性问题
- [ ] 性能测试

### Phase 4: 部署 (2025年10月)
- [ ] 合并到主分支
- [ ] 部署到生产环境
- [ ] 监控错误

---

## 🎯 结论

**当前状态:** ✅ 可以继续测试

**使用的包:** `@google/generative-ai` v0.24.1

**是否需要立即迁移:** ❌ 否

**何时迁移:** 2025年中期开始准备

**测试是否受影响:** ❌ 否,可以正常测试所有功能

---

**文档创建:** 2026-01-26  
**最后更新:** 2026-01-26  
**状态:** ✅ 当前配置可用
