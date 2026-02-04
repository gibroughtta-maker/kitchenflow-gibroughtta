# AI 常识升级实施计划 (Common Sense Implementation Plan)

## 目标
将 `productClassification.ts` 从简单的关键词启发式升级为 **Gemini 驱动的 AI 分类器**。
目标是赋予 App “常识”，使其能够区分：
*   **通用商品** (Generic Items, e.g., "牛奶", "普通面粉") -> `Any Store` (任意商店)
*   **特定商品** (Specific Items, e.g., "00号面粉", "老干妈") -> `Specific Store` (特定商店)

## 用户审查说明
> [!IMPORTANT]
> 此功能需要 `.env` 中配置有效的 `EXPO_PUBLIC_GEMINI_API_KEY`。
> 如果 API 调用失败或密钥丢失，系统将回退到现有的启发式逻辑（关键词匹配）。

## 建议变更

### 1. 数据层 (`src/services/ai/schemas.ts`)
*   新增 `PRODUCT_CLASSIFICATION_SCHEMA` 以强制结构化输出。
*   字段包括：`storeFlexibility` ('any' | 'specific'), `reason` (原因说明), `confidence` (置信度)。

### 2. 提示词层 (`src/services/prompts.ts`)
*   新增 `generateProductClassificationPrompt(itemName)`。
*   逻辑：指示 AI 扮演“英国购物助手”，判断该商品是普通日用品还是需要去特定商店购买的特色商品。

### 3. 服务层 (`src/services/scannerService.ts`)
*   新增 `classifyProduct(itemName)` 函数。
*   调用 Gemini API，使用新的提示词和 Schema。

### 4. 集成 (`src/services/ai/productClassification.ts`)
*   修改 `inferStoreFlexibility` 函数：
    1.  **快速路径**：检查现有关键词规则（保留作为快速缓存）。
    2.  **AI 路径**：如果规则不明确，调用 `classifyProduct`。
    3.  **缓存**：在内存中缓存结果（减少 API 调用）。

## 验证计划

### 自动化测试
*   扩展 `Phase5TestScreen.tsx`，增加 "AI Classification Test" 按钮。
*   运行一组测试用例：
    *   "Milk" -> Any (预期：任意超市)
    *   "00 Flour" -> Specific (预期：意大利/特色超市)
    *   "Paracetamol" (扑热息痛) -> Any (超市/药店)
    *   "Saffron" (藏红花) -> Specific

### 手动验证
1.  打开 `Phase5TestScreen`。
2.  点击 "Run AI Classification Test"。
3.  观察日志中的 AI 推理过程 (例如: "Reason: 00 Flour is specialized for pasta/pizza, not always available in basics")。
