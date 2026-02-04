# 优化实施计划 (Optimization Implementation Plan)

## 实施策略

基于依赖关系和工作量，将 6 个任务分为 **3 个 Sprint**：

---

## 🔴 Sprint 1: 核心性能优化（本周完成）

### Task 1.1: AI 调用缓存系统
**目标**: 减少 API 调用次数和延迟。

**技术方案**:
1. **内存缓存 (L1)**
   - 在 `productClassification.ts` 中添加 `Map<string, StoreFlexibility>`
   - TTL: 会话期间有效

2. **持久化缓存 (L2)**
   - 使用 `AsyncStorage` 存储分类结果
   - Key: `ai_classification_cache`
   - TTL: 7 天

3. **批量分类**
   - 修改 `classifyProduct` 为 `classifyProducts(itemNames: string[])`
   - 一次 API 调用处理整个清单

**验证**:
- 添加 10 个商品，第二次添加相同商品时应从缓存读取（无 API 调用）
- 检查 AsyncStorage 中的缓存数据

---

### Task 1.2: 单元测试覆盖
**目标**: 为核心逻辑添加自动化测试。

**测试文件**:
1. `src/services/ai/__tests__/productClassification.test.ts`
   - `inferStoreFlexibility('Milk')` -> 'any'
   - `inferStoreFlexibility('Lao Gan Ma')` -> 'specific'

2. `src/services/__tests__/itineraryService.test.ts`
   - Mock Google Maps API
   - 测试路线排序逻辑

**工具**:
- Jest (已配置在 React Native)
- 使用 `jest.mock()` 模拟 API 调用

**验证**:
- 运行 `npm test`，所有测试通过

---

## 🟡 Sprint 2: 智能化升级（下周完成）

### Task 2.1: 个性化商品分类
**目标**: 学习用户购物习惯。

**数据层**:
```sql
CREATE TABLE user_store_preferences (
  user_id UUID,
  item_name TEXT,
  preferred_store uk_supermarket,
  frequency INT DEFAULT 1,
  PRIMARY KEY (user_id, item_name)
);
```

**逻辑**:
1. 每次用户手动指定商品的商店时，记录到 `user_store_preferences`
2. AI 分类时，优先查询用户历史：
   ```typescript
   const userPref = await getUserPreference(itemName);
   if (userPref && userPref.frequency > 2) {
     return { storeId: userPref.preferred_store };
   }
   ```

**验证**:
- 用户连续 3 次在 Waitrose 买有机牛奶
- 第 4 次添加"有机牛奶"时，系统自动推荐 Waitrose

---

### Task 2.2: 语音输入功能
**目标**: 实现 "Zero UI" 语音添加商品。

**技术栈**:
- Expo Speech Recognition (或 React Native Voice)

**UI 集成**:
1. 在 `QuickAddBar` 添加麦克风图标按钮
2. 点击后开始录音
3. 识别结果自动填入输入框

**Prompt 优化**:
- 调用 Gemini 解析语音文本：
  > "用户说：'加一瓶老干妈和两袋米'，请提取商品列表"

**验证**:
- 说"加牛奶"，系统自动添加 1 个 Milk

---

## ⏸️ 暂缓任务（需要外部资源）

### Task X.1: 店铺库存预测
**原因**: 需要 Tesco API 集成，涉及商务合作。

### Task X.2: 离线优先架构
**原因**: 需要引入 WatermelonDB，架构变动较大。

---

## 实施顺序建议

**Week 1 (2 天)**:
1. AI 缓存系统 ✅
2. 单元测试框架搭建 ✅

**Week 2 (3 天)**:
3. 个性化分类 ✅
4. 语音输入 ✅

**总计**: 5 天完成核心优化。

---

## 风险与依赖

| 任务 | 风险 | 缓解措施 |
|-----|------|---------|
| AI 缓存 | 缓存失效策略不当 | 设置合理 TTL + 手动清除按钮 |
| 单元测试 | Mock 配置复杂 | 使用成熟的 Mock 库 |
| 个性化 | 冷启动问题（新用户无数据） | 回退到通用规则 |
| 语音输入 | 识别准确率低 | 提供手动修正入口 |

---

## 下一步

请确认是否从 **Sprint 1: AI 缓存 + 测试** 开始实施？
