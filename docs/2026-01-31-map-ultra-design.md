# 设计方案：智能行程规划系统 (Smart Shopping Itinerary) - Map Ultra

**状态**: 草案 (Draft)
**日期**: 2026-01-31

## 1. 核心需求与第一性原理

用户不是想“看列表”，而是想“完成采购任务”。在这个过程中，用户不仅面临“买什么”的问题，更面临“怎么买最快/最顺/最稳”的决策压力。

**用户痛点**:
1.  **多点采购困扰**: 既要买中超特产，又要买英超生鲜，不知道先去哪个。
2.  **不确定性焦虑 (FUD)**: 担心到了发现关门了 (Closing Soon)、路上堵死了 (Traffic)、或者人太多 (Crowd)。
3.  **缺乏灵活性**: 有些东西（如土豆）随便哪家买都行 (Any Store)，但现在的系统强行绑定了某一家。

**成功标准**:
系统能直接吐出一张 **"最优行程单" (Itinerary)**，告诉用户：
*   先去 A 店 (因为它是瓶颈，比如快关门了)。
*   再去 B 店 (因为顺路)。
*   C 商品可以在 A 或 B 顺便买到 (Any Store匹配)。
*   全程预计耗时 X 分钟。

---

## 2. 解决方案架构

我们引入一个新的核心服务：`ItineraryService`。

### 2.1 核心概念：Route Optimization Engine (ROE)

这不是简单的 Google Maps 导航，这是一个基于约束条件的求解器。

**输入 (Inputs)**:
*   **User Location**: 当前位置 (Home/Work)。
*   **Must-Visit Items**: 绑定了特定店铺的商品 (如：老干妈 -> 中超)。
*   **Any-Store Items**: 标记为 `Generic` 的商品 (如：土豆 -> 任意超市)。
*   **Constraints**: 
    *   时间窗口 (Opening Hours)。
    *   实时路况 (Traffic Model)。

**输出 (Outputs)**:
*   **Waypoints Sequence**: 最佳访问顺序。
*   **Stop Allocation**: 每个站点买什么 (把 Any Store 的东西分配到最顺路的店)。
*   **Risk Alerts**: "注意：A店还有30分钟关门"。

---

## 3. 算法逻辑详解

### Step 1: 处理 "Any Store" (Dynamic Assignment)
*   **逻辑**: 不预先分配店铺。
*   **执行**: 在计算路线时，检查 Must-Visit 店铺中是否包含超市类别。
    *   *Case A*: 如果 Must-Visit 列表中已经包含一家大超市 (如 Tesco Extra)，直接将所有 `Generic` 商品分配给它（一站式购物优先）。
    *   *Case B*: 如果 Must-Visit 只有专卖店 (如中超)，则在路径上搜索一家评分最高且顺路的超市作为补充站点。

### Step 2: 建立候选站点 (Candidate Selection)
对于 Must-Visit 商品，调用 Places API 获取确切坐标、**营业状态 (`openNow`)** 和 **关门时间 (`nextCloseTime`)**。
*   *过滤*: 如果某必须去的店已关门，直接报错/警告用户，或者推荐同品牌的另一家分店。

### Step 3: 路径规划与排序 (Sequence Optimization)
这是一个简化的 TSP (旅行商问题)。由于通常站点不超过 3-4 个，我们可以用 **穷举法 + 剪枝**：

1.  **优先级排序 (Priority Sorting)**:
    *   **高优先级**: 快关门的店 (Closing Soon)。如果 A 店 17:00 关门，B 店 23:00 关门，必须先去 A。
2.  **距离计算 (Distance Matrix)**:
    *   调用 `Routes API` (或本地 Haversine 估算) 计算 `User -> A -> B -> Home` 和 `User -> B -> A -> Home` 的耗时。
    *   取耗时最短者。

### Step 3: 风险评估 (Risk Assessment)
*   **拥堵检测**: 使用 Routes API 的 `trafficModel: 'best_guess'` 获取实时驾车时长。如果比平时多 30%，标记 "Heavy Traffic"。
*   **关门预警**: 计算 `Arrival Time` (当前时间 + 驾驶时长)。如果 `Arrival Time > Closing Time - 15min`，标记 "Risk: Might Close"。

---

## 4. API 技术栈

| 功能 | API Endpoint | 关键参数 | 成本估算 |
| :--- | :--- | :--- | :--- |
| **找店/查营业时间** | `Places API (New)` | `fields: location, currentOpeningHours` | 中 |
| **算路/查路况** | `Routes API` | `trafficModel: best_guess`, `intermediates` | 高 (需按需调用) |
| **距离矩阵 (备选)** | `Distance Matrix` | - | 低 |

---

## 5. 数据结构设计 (Data Model)

不需要修改数据库 Schema，这全是运行时 (Runtime) 计算。但需要在前端定义新的 Types：

```typescript
interface ItineraryItem {
  stopOrder: number; // 1, 2, 3
  store: StoreLocation;
  itemsToBuy: ShoppingItem[]; // 包含必须买的 + 分配过来的 Any Store 商品
  drivingDurationWait: number; // 预计驾驶耗时
  riskLevel: 'safe' | 'warning' | 'critical';
  riskReason?: string; // "Closing in 40 mins"
}

interface Itinerary {
  totalDuration: number; // 总耗时
  stops: ItineraryItem[];
  overviewPolyline?: string; // 用于在地图上画全览线
}
```

---

## 6. 用户体验流程 (The User Flow)

1.  **Trigger**: 用户点击清单页右上角的 "✨ Plan My Trip" (智能规划)。
2.  **Computing**: 屏幕显示骨架屏，提示 "Analyzing Opening Hours & Traffic..."。
3.  **Result**: 
    *   展示一张 **行程单 (Itinerary Card)**。
    *   显示：**Stop 1: 中超** (🔴 1h 后关门) -> **Stop 2: Tesco** (顺路)。
    *   显示：**Total: 45 min**。
4.  **Action**: 用户点击 "Start Stop 1"，唤起 Google Maps 导航去第一站。

---

## 7. 分阶段实施策略

*   **Phase 5.1**: 实现 "Any Store" 逻辑 & 基础营业时间检查（先去快关门的）。
*   **Phase 5.2**: 接入 Routes API 真实路况与多点算路。
