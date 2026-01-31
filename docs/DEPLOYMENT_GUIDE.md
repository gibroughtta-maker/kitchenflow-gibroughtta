# 🚀 Structured Output 部署指南

## 📋 部署概述

**功能**: Google Cloud Official Structured Output  
**版本**: 1.0.0  
**日期**: 2026-01-25  
**状态**: ✅ 代码完成，准备测试

---

## 🎯 部署目标

将 KitchenFlow 从手动 JSON 解析迁移到 Google Cloud 官方 Structured Output，实现：
- ✅ 99%+ 可靠性
- ✅ 零解析错误
- ✅ 自动类型验证
- ✅ Enum 强制验证

---

## 📦 已完成的工作

### **代码修改**
1. ✅ `scannerService.ts` - 添加 Schema 支持
2. ✅ `prompts.ts` - 定义 6 个官方 Schema
3. ✅ 所有 6 个 API 函数已更新
4. ✅ 所有验证函数已简化

### **文档**
1. ✅ 实现指南 (`STRUCTURED_OUTPUT_IMPLEMENTATION.md`)
2. ✅ 测试指南 (`STRUCTURED_OUTPUT_TESTING.md`)
3. ✅ 快速参考 (`STRUCTURED_OUTPUT_QUICK_REFERENCE.md`)
4. ✅ 迁移总结 (`STRUCTURED_OUTPUT_MIGRATION_SUMMARY.md`)
5. ✅ 完成报告 (`STRUCTURED_OUTPUT_COMPLETION_REPORT.md`)
6. ✅ 部署检查清单 (`DEPLOYMENT_CHECKLIST.md`)

---

## 🚀 部署步骤

### **步骤 1: 启动应用**

```bash
cd kitchenflow-app
npx expo start --clear
```

**预期输出**:
```
Starting Metro Bundler
Metro waiting on exp://...
```

**如果遇到权限错误**:
```bash
# 清除缓存
rm -rf node_modules/.cache
rm -rf .expo

# 重新启动
npx expo start --clear
```

---

### **步骤 2: 打开应用**

**在 iOS 模拟器**:
- 按 `i` 键

**在 Android 模拟器**:
- 按 `a` 键

**在手机上**:
- 扫描二维码（使用 Expo Go 应用）

---

### **步骤 3: 测试冰箱扫描**

1. 打开应用
2. 点击 "Scan Fridge"
3. 拍摄冰箱照片（或选择照片）
4. 等待结果

**✅ 预期结果**:
- 看到食材列表
- 每个食材有 `freshness` 标签（fresh/use-soon/priority）
- 无错误提示

**❌ 如果失败**:
- 打开 React Native Debugger
- 查看控制台错误
- 参考 `STRUCTURED_OUTPUT_TESTING.md`

---

### **步骤 4: 测试 Craving 分析**

1. 进入 "Cravings" 页面
2. 添加菜名: "Kung Pao Chicken"
3. 等待 AI 分析

**✅ 预期结果**:
- 看到菜谱详情
- `difficulty` 显示为 "Easy", "Medium", 或 "Hard"
- 看到食材列表
- 无数据库错误

**❌ 如果失败**:
- 检查 Gemini API key
- 查看控制台错误
- 确认 Schema 正确应用

---

### **步骤 5: 检查控制台输出**

**打开 React Native Debugger**:
```bash
# 在浏览器中打开
http://localhost:19000/debugger-ui/
```

**或者使用 Chrome DevTools**:
- 在应用中摇晃设备
- 选择 "Debug"

**✅ 预期看到**:
```javascript
// API 请求包含 generationConfig
{
  "contents": [...],
  "generationConfig": {
    "response_mime_type": "application/json",
    "response_schema": {...}
  }
}

// API 响应是纯 JSON
{"items":[...],"scanQuality":"good"}
```

**❌ 不应该看到**:
- "Failed to parse" 错误
- "Invalid response" 错误
- Markdown 包装 (` ``` `)
- 解释文字

---

## 🧪 测试清单

### **功能测试**

- [ ] **冰箱扫描**
  - [ ] 拍照功能正常
  - [ ] 识别食材正确
  - [ ] Freshness 标签正确（fresh/use-soon/priority）
  - [ ] 保存到数据库成功

- [ ] **Craving 分析**
  - [ ] 添加 Craving 成功
  - [ ] AI 分析完成
  - [ ] Difficulty 显示正确（easy/medium/hard）
  - [ ] 食材列表显示
  - [ ] 无数据库约束错误

- [ ] **购物清单**
  - [ ] 生成清单成功
  - [ ] 分类正确
  - [ ] 优先级正确

- [ ] **控制台检查**
  - [ ] 无 "Failed to parse" 错误
  - [ ] 无 "Invalid response" 错误
  - [ ] 看到 `generationConfig`
  - [ ] 响应为纯 JSON

---

## 📊 性能验证

### **基准测试**

运行以下测试并记录结果：

**测试 1: 扫描 5 张冰箱照片**
- 成功率: ___% (目标: 99%+)
- 解析错误: ___ 次 (目标: 0)
- 平均响应时间: ___s (目标: 2-3s)

**测试 2: 添加 5 个 Cravings**
- 成功率: ___% (目标: 99%+)
- Enum 验证: ___% (目标: 100%)
- 数据库错误: ___ 次 (目标: 0)

---

## 🐛 故障排除

### **问题 1: 应用无法启动**

**症状**: Metro Bundler 报错

**解决方案**:
```bash
# 1. 清除缓存
cd kitchenflow-app
rm -rf node_modules/.cache
rm -rf .expo
rm -rf node_modules
npm install

# 2. 重新启动
npx expo start --clear
```

---

### **问题 2: 仍然有解析错误**

**症状**: 控制台显示 "Failed to parse"

**解决方案**:
1. 检查 `responseSchema` 是否传递:
```typescript
// 在 scannerService.ts 中添加日志
console.log('Using schema:', payload.responseSchema ? 'YES' : 'NO');
```

2. 检查 API 请求:
```typescript
console.log('Request body:', JSON.stringify(requestBody, null, 2));
```

3. 检查 API 响应:
```typescript
console.log('Raw response:', text);
```

---

### **问题 3: Enum 验证失败**

**症状**: 数据库约束错误

**解决方案**:
1. 检查 Schema 定义:
```typescript
// prompts.ts
enum: ['fresh', 'use-soon', 'priority'] // ✅ 必须是这些值
```

2. 检查 API 响应:
```typescript
// 应该返回
{"freshness": "fresh"} // ✅ 正确

// 不应该返回
{"freshness": "新鲜"} // ❌ 错误
{"freshness": "Fresh"} // ❌ 错误
```

---

### **问题 4: 400 错误**

**症状**: Gemini API 返回 400

**解决方案**:
1. 简化 Schema:
```typescript
// 如果 Schema 太复杂，简化它
export const SIMPLE_SCHEMA = {
  type: 'object' as const,
  properties: {
    name: { type: 'string' as const }
  },
  required: ['name']
};
```

2. 检查 API key:
```typescript
// .env
EXPO_PUBLIC_GEMINI_API_KEY=your_key_here
```

---

## ✅ 部署确认

### **Staging 环境**

完成以下检查后，标记为完成：

- [ ] 应用正常启动
- [ ] 所有功能测试通过
- [ ] 性能指标达标
- [ ] 无严重错误
- [ ] 控制台输出正常

**签署**: _______________ (日期: _______)

---

### **Production 环境**

完成以下检查后，标记为完成：

- [ ] Staging 测试通过
- [ ] 代码已提交到 Git
- [ ] 文档已更新
- [ ] 团队已通知
- [ ] 监控已配置

**签署**: _______________ (日期: _______)

---

## 📈 监控指标

### **部署后监控**

**第 1 天**:
- [ ] 检查错误率
- [ ] 检查响应时间
- [ ] 收集用户反馈

**第 1 周**:
- [ ] 分析成功率趋势
- [ ] 检查数据库约束错误
- [ ] 优化 Schema（如需要）

**第 1 月**:
- [ ] 全面性能评估
- [ ] 用户满意度调查
- [ ] 计划下一步优化

---

## 🔄 回滚计划

**如果需要回滚** (不推荐):

```bash
# 1. 停止应用
# Ctrl+C 停止 Metro Bundler

# 2. 回滚代码
git revert HEAD

# 3. 重新启动
npx expo start --clear
```

**注意**: 回滚会恢复到不可靠的旧方法（60-80% 成功率）。

---

## 📞 支持资源

### **文档**
- 快速参考: `docs/STRUCTURED_OUTPUT_QUICK_REFERENCE.md`
- 测试指南: `docs/STRUCTURED_OUTPUT_TESTING.md`
- 完整文档: `docs/STRUCTURED_OUTPUT_README.md`

### **官方文档**
- Structured Output: https://cloud.google.com/vertex-ai/generative-ai/docs/multimodal/control-generated-output
- OpenAPI 3.0: https://spec.openapis.org/oas/v3.0.3.html#schema-object

### **联系**
- 技术问题: 查看测试指南
- 紧急问题: 联系团队负责人

---

## 🎉 部署成功标志

当你看到以下情况时，部署成功：

✅ **应用运行正常**
✅ **无解析错误**
✅ **Enum 验证 100% 正确**
✅ **成功率 99%+**
✅ **用户反馈积极**

---

**祝部署顺利！** 🚀

如有问题，请参考 `STRUCTURED_OUTPUT_TESTING.md` 或联系团队。
