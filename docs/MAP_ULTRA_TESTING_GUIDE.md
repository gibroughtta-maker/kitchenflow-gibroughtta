# Map Ultra (Auto-Pilot) 测试指南

本指南用于验证 Map Ultra 的核心功能：**AI 智能分类**与**一键行程规划**。

## 0. 前置准备
1.  确保获得 **位置权限** (Location Permission)。
2.  确保手机安装了 **Google Maps** (模拟器上如果没有，Deep Link 可能会报错或打开浏览器)。
3.  **清空现有清单**: 为了测试准确，建议先清空购物清单。

## 1. 测试 AI 智能分类 (The "Brain")
**目标**: 验证系统能自动识别 "通用商品" vs "特定商品"。

*   **步骤 1**: 在清单页底部 Quick Add 输入框输入 `Milk` (或 `Bread`, `Eggs`)，点击添加。
    *   **预期**: 商品卡片上**不显示**具体的超市图标（或者显示默认），或者在后台数据中 `store_id` 为 `any`。
    *   *注: 目前 UI 可能未针对 'any' 做特殊视觉区分，主要看下一步能否被规划进超市行程。*

*   **步骤 2**: 输入 `Lao Gan Ma` (或 `Kimchi`, `Soy Sauce`)，点击添加。
    *   **预期**: 系统应**不**将其标记为 Any，或者依然遵循旧逻辑（如果没有手动选店，且历史记录无数据，可能会提示选店或默认为上次）。
    *   *说明*: AI 逻辑目前设定为：包含 "Generic Keywords" -> Any；包含 "Specific Keywords" -> Specific。

## 2. 测试一键行程规划 (The "Engine")
**目标**: 验证 "Plan My Trip" 按钮能正确生成 Google Maps 路线。

*   **步骤**:
    1.  确保清单里既有 `Milk` (Any Store)，又有 `Lao Gan Ma` (Specific Store, 假设你手动指定了 Asian Supermarket，或者历史记录里有)。
    2.  点击清单标题栏右侧的 **"✨ Plan"** 按钮。
    3.  观察弹窗提示。

*   **预期结果**:
    *   **弹窗**: 出现 "Trip Ready 🚀" 弹窗。
    *   **路线**: 弹窗内容应显示类似 `Home -> Asian Supermarket -> Sainsbury's (顺路) -> Home` 的路径。
        *   系统会自动把 "Milk" 分配给最近的大超市 (如 Sainsbury's/Tesco)。
    *   **点击 Go!**: 手机应自动跳转 Google Maps App，并填好所有途经点。

## 3. 极端情况测试 (Edge Cases)
*   **场景 A: 只有牛奶**:
    *   只加 "Milk"。
    *   点击 Plan。
    *   预期: `Home -> 最近的大超市 -> Home`。
*   **场景 B: 只有老干妈**:
    *   只加 "Lao Gan Ma" (且指定了 Asian Store)。
    *   点击 Plan。
    *   预期: `Home -> Asian Store -> Home` (不应该有多余的超市停留)。

---
**故障排除**:
*   如果点击 "Plan" 没反应：检查控制台是否有报错（Deep Link 构造失败？）。
*   如果 Google Maps 打开是空的：说明坐标传递格式可能有误，请反馈。
