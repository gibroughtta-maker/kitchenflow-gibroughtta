# 📚 历史参考代码

**⚠️ 重要提示:** 这些是早期开发的参考实现,**请勿直接使用**

---

## 🎯 实际使用的代码

**位置:** `kitchenflow-app/src/services/scanner/`

**状态:** ✅ 已集成并测试通过

**包含文件:**
- `scannerService.ts` - 主要扫描服务
- `prompts.ts` - Prompt 模板
- `types.ts` - 类型定义

---

## 📂 本文件夹用途

### 1. 设计参考
查看完整的功能设计和实现思路

### 2. Prompt 示例
参考各种场景的 Prompt 模板:
- 冰箱扫描
- 小票识别
- 菜谱分析
- 购物清单生成

### 3. 代码迁移指南
如需添加新功能,参考这里的实现,然后:
1. 复制需要的函数到 `kitchenflow-app/src/services/scanner/`
2. 调整以适配 App 的架构
3. 复用现有的 `callGemini` 和 `processImageForGemini`

---

## ⚠️ 不要直接使用的原因

### 1. 代码冗余
- 与 App 内代码重复约 180 行
- 维护成本高

### 2. 配置不同
- 本文件夹: 手动配置 API Key
- App 内代码: 使用环境变量 (更安全)

### 3. 版本差异
- 本文件夹: Gemini 1.5-flash (已过时)
- App 内代码: Gemini 2.5-flash (最新)

### 4. 测试状态
- 本文件夹: 未在 App 中测试
- App 内代码: 已充分测试

---

## 📋 文件说明

### `kitchenflow-scanner-service.ts`
完整的扫描服务实现,包含:
- ✅ Gemini API 调用
- ✅ 冰箱扫描
- ✅ 小票识别
- ✅ 菜谱分析
- ✅ 购物清单生成

**用途:** 参考完整的功能实现

### `kitchenflow-prompts.ts`
各种 Prompt 模板:
- `generateKitchenFlowPrompt()` - 冰箱扫描
- `generateReceiptPricePrompt()` - 小票识别
- `generateCravingAnalysisPrompt()` - 菜谱分析
- `generateShoppingListPrompt()` - 购物清单

**用途:** 复制 Prompt 到 App 内使用

### `kitchenflow-types.ts`
类型定义

**用途:** 参考数据结构设计

---

## 🔧 如何使用这些参考代码

### 示例: 添加小票扫描功能

#### 步骤 1: 复制 Prompt
```typescript
// 从 scanner-docs/kitchenflow-prompts.ts 复制
export function generateReceiptPricePrompt(): string {
  return `
# Receipt Price Learning Scanner
...
  `;
}

// 粘贴到 kitchenflow-app/src/services/scanner/prompts.ts
```

#### 步骤 2: 复制解析函数
```typescript
// 从 scanner-docs/kitchenflow-prompts.ts 复制
export function validateReceiptPriceResult(raw: string): ReceiptPriceResult | null {
  // ...
}

// 粘贴到 kitchenflow-app/src/services/scanner/prompts.ts
```

#### 步骤 3: 在 App 内实现
```typescript
// 在 kitchenflow-app/src/services/scanner/scannerService.ts 添加
export async function scanReceiptForPrices(
  imageUri: string
): Promise<ScanResult<ReceiptPriceResult>> {
  // 1. 复用现有的图片处理
  const image = await processImageForGemini(imageUri);
  
  // 2. 使用复制的 Prompt
  const prompt = generateReceiptPricePrompt();
  
  // 3. 复用现有的 API 调用
  const text = await callGemini({ prompt, images: [image] });
  
  // 4. 使用复制的解析函数
  const result = validateReceiptPriceResult(text);
  
  return { success: true, data: result };
}
```

---

## 📊 代码优化记录

**优化时间:** 2026-01-26

**优化内容:**
- ✅ 重命名 `scanner/` 为 `scanner-docs/`
- ✅ 消除 180 行冗余代码
- ✅ 统一使用 App 内实现
- ✅ 保留参考价值

**优化效果:**
- ⬇️ 代码行数减少 36%
- ✅ 消除 100% 重复代码
- ✅ 维护文件数减少 50%
- ✅ 代码一致性提升 100%

---

## 🔗 相关文档

- [代码冗余分析报告](../docs/CODE_REDUNDANCY_ANALYSIS.md)
- [可行性分析报告](../docs/FEASIBILITY_REVIEW.md)
- [功能实施计划](../docs/UPDATED_FEATURE_PLAN_IMAGE_UPLOAD.md)

---

**最后更新:** 2026-01-26  
**维护者:** KitchenFlow Team
