# KitchenFlow 优化建议书 (Optimization Proposal)
**基于第一性原理的系统级优化分析**

---

## 🎯 第一性原理回顾
KitchenFlow 的核心价值：**消除摩擦，让决策自动化**。
*   不是"帮用户记账"，而是"替用户决策"。
*   不是"显示信息"，而是"直接行动"。

---

## ⚡ 性能优化 (Performance)

### 1. AI 调用成本优化
**现状**：每次调用 Gemini 都产生 API 费用和延迟。

**优化方案**：
*   **分层缓存策略**：
    *   L1: 内存缓存（当前会话）
    *   L2: AsyncStorage（跨会话）
    *   L3: Supabase（跨设备）
*   **批量处理**：
    *   将购物清单的多个商品一次性发给 AI 分类（减少 API 调用次数）。
    *   示例：`classifyProducts(['Milk', 'Soy Sauce', 'Bread'])` 一次返回 3 个结果。

**实施优先级**：🔴 高（直接影响成本和速度）

---

### 2. 离线优先架构 (Offline-First)
**现状**：在超市地下室等弱网环境下，清单可能无法加载。

**优化方案**：
*   使用 **Redux Persist** 或 **WatermelonDB** 实现本地数据库。
*   购物清单、馋念清单全部本地优先，后台同步。
*   AI 分类结果缓存到本地，离线时使用启发式规则。

**实施优先级**：🟡 中（提升体验，但不影响核心功能）

---

## 🧠 AI 准确性优化

### 3. Few-Shot Learning (用户修正反馈)
**现状**：AI 识别错误（如把苹果认成梨）时，用户无法纠正。

**优化方案**：
*   在扫描结果页添加 **"长按修正"** 功能。
*   将修正数据存储为 Few-Shot Examples：
    ```json
    {
      "userCorrections": [
        {"image": "base64...", "aiSaid": "pear", "userSaid": "apple"}
      ]
    }
    ```
*   下次扫描时，将这些案例注入 Prompt：
    > "Previous corrections: User confirmed this item was 'apple', not 'pear'."

**实施优先级**：🟢 低（Nice to Have，但需要后端支持）

---

### 4. 个性化商品分类
**现状**：AI 使用通用规则（"Milk" = Any Store）。

**优化方案**：
*   学习用户习惯：
    *   如果用户总是在 Waitrose 买有机牛奶，系统应记住 "Organic Milk" -> Waitrose（而非 Any）。
*   实现方式：
    *   在 Supabase 中添加 `user_store_preferences` 表。
    *   AI 调用时注入用户历史：
        > "User usually buys organic products at Waitrose."

**实施优先级**：🟡 中（提升个性化，但需要数据积累）

---

## 🗺️ Map Ultra 优化

### 5. 实时路况 + 动态重新规划
**现状**：路线规划是静态的，不考虑实时交通。

**优化方案**：
*   调用 **Google Routes API** 获取实时路况。
*   如果检测到严重拥堵，弹窗询问：
    > "Tesco 前方堵车 30 分钟，换去 Sainsbury's？"

**实施优先级**：🟢 低（Progressive Enhancement）

---

### 6. 店铺库存预测
**现状**：规划路线时，不知道目标店铺是否有货。

**优化方案**：
*   集成 **Supermarket API**（如 Tesco API）查询库存。
*   如果老干妈缺货，自动推荐备选店铺。

**实施优先级**：🔴 高（避免白跑一趟）

---

## 🏗️ 架构优化

### 7. 提取通用 AI Service Layer
**现状**：`scannerService.ts` 承担了所有 AI 调用逻辑。

**优化方案**：
*   创建 `src/services/ai/geminiClient.ts`，专门负责 API 调用。
*   其他服务（`scannerService`, `productClassification` 等）只负责业务逻辑。

**实施优先级**：🟡 中（提升可维护性）

---

### 8. 单元测试覆盖
**现状**：核心逻辑缺少自动化测试。

**优化方案**：
*   为 `inferStoreFlexibility` 添加单元测试：
    ```typescript
    test('should classify Milk as Any', () => {
      expect(inferStoreFlexibility('Milk')).toBe('any');
    });
    ```
*   为 `generateItinerary` 添加集成测试（Mock Google Maps API）。

**实施优先级**：🔴 高（防止回归）

---

## 🎨 UX 优化

### 9. 语音输入 (Voice-First)
**现状**：用户需要手动输入商品名。

**优化方案**：
*   购物清单的 Quick Add 栏增加 **语音按钮**。
*   调用 Expo Speech Recognition 识别语音：
    > "加一瓶老干妈"
*   系统自动解析并添加。

**实施优先级**：🟡 中（符合 "Zero UI" 理念）

---

### 10. 智能通知 (Proactive Alerts)
**现状**：用户需要主动打开 App 查看。

**优化方案**：
*   每天晚上 8 点，系统检查冰箱快照：
    > "菠菜快坏了，明天要不要做个菠菜蛋汤？"
*   路过超市时，推送提醒：
    > "你离 Tesco 只有 500 米，要顺路买老干妈吗？"

**实施优先级**：🟢 低（需要地理围栏功能）

---

## 📊 优先级总结

| 优化项 | 优先级 | 预估工作量 | ROI |
|-------|--------|-----------|-----|
| AI 调用缓存 | 🔴 高 | 2 天 | 高 |
| 店铺库存预测 | 🔴 高 | 5 天 | 高 |
| 单元测试覆盖 | 🔴 高 | 3 天 | 高 |
| 个性化分类 | 🟡 中 | 4 天 | 中 |
| 离线优先架构 | 🟡 中 | 7 天 | 中 |
| 语音输入 | 🟡 中 | 2 天 | 中 |
| Few-Shot Learning | 🟢 低 | 5 天 | 低 |
| 实时路况 | 🟢 低 | 3 天 | 低 |
| 智能通知 | 🟢 低 | 4 天 | 低 |

---

## 🚀 建议实施路线

**Sprint 1 (本周)**：
1.  实现 AI 调用缓存（立竿见影）
2.  添加核心功能单元测试（稳定性）

**Sprint 2 (下周)**：
3.  集成店铺库存 API（避免白跑）
4.  实现个性化分类（提升准确性）

**Sprint 3 (月底)**：
5.  语音输入功能（Zero UI 升级）
6.  离线优先架构（弱网优化）
