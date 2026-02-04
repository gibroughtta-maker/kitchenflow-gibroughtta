# 地图功能深度优化方案 - 打造 "Pro" 级体验

## 目标简述
将当前的 "MVP" 地图功能（硬编码坐标、直线距离）升级为提供情境感知、可靠且高效的购物导航 "Pro" 体验。
**核心理念**：“不仅仅是在地图上显示一个点；而是确保我能买到所需物品，到达时店还开着，并且全程无阻。”

## 用户确认事项
> [!IMPORTANT]
> **成本提示**：此次升级将引入 Google Maps Platform 费用。
> - **Places API (New)**：用于搜索门店。
> - **Distance Matrix API**：用于实时路况路由计算。
> - **Place Details**：用于获取营业时间和停车信息。
> *您需要为您的 Google Cloud Project 关联计费账号。*

## 建议变更

### 1. 门店选择智能层 (Logic Layer)
**现状**：根据直线距离查找最近的门店。
**升级**：
- **智能过滤**：分析清单规模。
    - > 10 件商品：过滤 `includedTypes` 为大型超市（如 Tesco Extra, Sainsbury's Superstore），避免去便利店买不齐。
    - < 5 件商品：允许 `convenience_store`（如 Tesco Express）。
- **营业状态校验**：预先获取 `regularOpeningHours` 和 `business_status`。在显示选项前过滤掉已关门的店铺。

### 2. 真实世界导航精度 (Data Layer)
**现状**：使用包含硬编码数组的 `storeLocationService.ts`。
**升级**：
- **替换数据源**：实现 `GooglePlacesService` 以获取实时数据。
- **基于路况排序**：使用 **Distance Matrix API** 按*驾驶时间*而非*物理距离*对潜在门店进行排序。
- **精准停车**：获取 `parking` 属性。如果可用，尝试导航至“停车场”坐标（如果详细几何信息中提供），或者至少在停车位紧张时发出警告。

### 3. "Pro" 级 UI/UX 增强 (Presentation Layer)
**现状**：简单的地图标记和特定按钮。
**升级**：
- **“繁忙”指示器**：在门店卡片上显示 “空闲” / “适中” / “繁忙” 徽章（源自 `popular_times` 或代理指标）。
- **导航无缝接力**：点击“导航”时，传递*入口*或*停车场*的精确坐标，而不仅仅是建筑物中心点。

### 4. "顺路买" 智能路由 (The "On the Way" Logic)
**现状**：无。
**新增**：引入 **Routes API (Compute Routes)**。
- **场景**：用户设定任意“最终目的地”（如家、公司、或者朋友家）。
- **逻辑**：计算 “当前位置 -> [候选超市] -> 最终目的地” 的总行程时间。
- **核心算法**：
    1. 获取用户输入的 Destination。
    2. 搜索沿途 (Intermediate Waypoints) 的超市。
    3. 对比 “直达时间” vs “经停超市时间”。
- **价值**：智能识别“最顺路”的选项。提示：“这家 Sainsbury's 就在你去公司的路上，仅增加 2 分钟车程。”

## 实施步骤

### 第一阶段：基础设施与 API
- [ ] 在 Google Cloud Console 中启用 Places API (New), Distance Matrix API, **Routes API**。
- [ ] 将 `EXPO_PUBLIC_GOOGLE_PLACES_KEY` 添加到 `.env`。
- [ ] 创建 `src/services/googleMapsService.ts`。

### 第二阶段：逻辑替换
- [ ] 重构 `storeLocationService.ts` 中的 `findNearestStore` 以使用 `googleMapsService`。
- [ ] 实现 `business_status` ('OPERATIONAL') 和 `open_now` 过滤逻辑。
- [ ] 实现基于清单大小的查询过滤（Superstore 对比 Express）。

### 第三阶段：UX 升级
- [ ] 更新 `ShoppingRouteScreen.tsx` 以显示：
    - 实时 开门/关门 状态。
    - 预计驾驶时间（对比距离）。
    - 繁忙状态徽章（如果有数据）。
- [ ] 为导航按钮添加“智能接力”逻辑。

## 验证计划
### 自动化测试
- 模拟 Google API 响应以验证：
    - 已关门的门店被过滤。
    - 大清单触发“大型超市”类型搜索。
    - 小清单允许“便利店”类型搜索。

### 手动验证
- **场景 3**：点击“导航”。验证 Google Maps 应用打开并定位到正确的目的地。

## Phase 5: Map Ultra (Intelligent Itinerary & Autopilot)
**目标**: 从“商店列表”转变为“购物自动驾驶”，规划整个行程。

### 5.1 数据层： "Any Store" 架构
- **修改 `ShoppingItem`**:
    - 更新 `supabase.ts` 中的 `store_id` 类型，允许特定字符串字面量 `'any'` 或 `null` 用于通用商品。
    - 迁移策略：新商品可以选择 "Any Store"。
- **AI 逻辑 (`inferStoreFlexibility`)**:
    - 创建 `src/services/ai/productClassification.ts`。
    - 函数: `inferStoreFlexibility(itemName: string)` -> 返回 `StoreType` (e.g., `'any'`, `'asian_supermarket'`, `'pharmacy'`)。
    - 用例：当用户添加 "牛奶" 时，自动分配给 `'any'`。当用户添加 "老干妈" 时，自动分配给 `'asian_supermarket'`。

### 5.2 核心引擎：ItineraryService
- **新服务**: `src/services/itineraryService.ts`
- **算法 (ROE - 路线优化引擎)**:
    1.  **分组**: 分离 `Must-Visit` (必去) 商品与 `Any-Store` (任意) 商品。
    2.  **候选**: 获取必去商店的位置。
    3.  **插入站点**: 如果存在 `Any-Store` 商品，在路线上寻找最方便的超市（使用 `Routes API`）。
    4.  **优化顺序**:
        - 优先考虑即将关门的商店 (`closingTime - currentTime < 1h`)。
        - 最小化总驾驶时间。
    5.  **风险检查**: 标记交通延误或关门风险。

### 5.3 UI 层：极简自动驾驶 (Direct Map Launch)
- **"Plan My Trip" 按钮**:
    - 点击后，后台计算最优顺序。
    - **直接唤起 Google Maps**: 构造 Deep Link URL (`google.com/maps/dir/...`)。
    - 参数包含: `origin` (Home), `destination` (Last Stop), `waypoints` (Intermediate Stops)。
    - **零 UI**: App 内不显示复杂的行程单，只负责算，算完直接跳。

### 5.4 用户资料 (先决条件)
- **家庭地址**:
    - 简单存储在 `AsyncStorage` 或 Supabase `profiles` 表中。
    - "往返"计算所需。

## 验证 (Phase 5)
- **单元测试**:
    - 测试 `inferStoreFlexibility` 处理常见商品。
    - 测试 `ItineraryService` 处理模拟位置和时间窗口。
- **手动验证**:
    - 场景: 添加 "牛奶" (Any) 和 "酱油" (Asian Store)。
    - 预期: 行程规划为 `Home -> Asian Store -> 最近的 Tesco (顺路) -> Home`。
