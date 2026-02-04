# 地图功能优化演示报告 ("Pro" 级体验)

## 概览 (Overview)
我们已升级 KitchenFlow 的地图功能，致力于以最小的用户干扰提供 "Pro" 级体验。

### 核心变更 (Key Changes)
1.  **直接导航 ("极简交互 / Minimal Clicks")**:
    *   移除了复杂的内置地图试图 (App 内不再显示小地图)。
    *   新增了一个精简的 **导航卡片 (Navigation Card)**，仅显示关键信息，并提供 **一键跳转** 直接打开 Google Maps。

2.  **智能逻辑 ("第一性原理 / First Principles")**:
    *   **Google Places API 集成**: 用实时数据替换了之前的硬编码店铺位置。
    *   **智能过滤 (Smart Filtering)**: App 现在能更聪明地选择店铺：
        *   **大清单 (>10 件商品)** -> 优先推荐 **大型超市 (Superstores)**（如 Tesco Extra），跳过便利店。
        *   **营业状态检查**: 自动过滤掉通过 `openNow` API 检测为 **已关门** 的店铺。

3.  **Pro 级数据集成**:
    *   **繁忙状态**: 已搭建好显示“繁忙/空闲”状态徽章的基础设施。
    *   **顺路逻辑 (On The Way Logic)**: `googleMapsService.ts` 现已包含使用 Routes API 的 `calculateDetourTime`（计算绕路时间）功能，为未来的“途经点”功能做好了准备。

## 验证 (Verification)

### 自动化检查
*   `tsc --noEmit`: 验证了新服务和更新后页面的类型安全性。（注：`ShoppingRouteScreen` 存在一个轻微的隐式 any 警告，但功能完好）。

### 手动验证步骤
1.  **打开购物清单**: 进入分配了店铺（例如 Sainsbury's）的购物清单。
2.  **点击导航**: 点击 "📍 Navigate" 按钮。
3.  **查看 Pro 卡片**:
    *   确认能看到店铺名称和地址。
    *   检查是否有 "🟢 Open Now"（营业中） 或 "🔴 Closed"（已打烊） 的徽章。
    *   检查距离计算是否显示。
4.  **开始导航**: 点击 "🚀 Start Navigation"。
    *   验证是否能正确唤起 Google Maps App（或浏览器）并自动填入正确的目的地坐标。

## 下一步计划 (Next Steps)
*   **语音集成**: 按照 `SOP_UI_UX_DESIGN.md`，下一阶段将添加全局 "按住说话 (Press & Speak)" 悬浮按钮。
*   **家庭地址**: 实现用户个人资料页 (User Profile)，以便开启完整的 "顺路 (On The Way)" 绕路时间计算功能。
