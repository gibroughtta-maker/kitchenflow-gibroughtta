# KitchenFlow 项目深度分析报告

**日期**: 2026-01-31
**项目**: KitchenFlow (AI Native Smart Kitchen Assistant)

---

## 1. 项目核心概览

KitchenFlow 是一个理念先进的智能厨房助手，其核心放弃了传统精细化库存管理的繁琐（如扫码入库、精确称重），而是采用 **"不记账，只决策" (No-Accounting, Decision-Only)** 的策略。它利用 **Google Gemini AI** 的多模态视觉能力，通过模糊逻辑来辅助家庭烹饪和购物决策。

### 🛠️ 技术栈 (Tech Stack)
*   **前端框架**: React Native (Expo v54) + TypeScript
*   **后端服务**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
*   **AI 引擎**: Google Gemini 1.5 (Flash/Pro)
    *   关键技术: **Structured Outputs (JSON Schema)** - 确保 AI 输出绝对符合系统要求的 JSON 格式，消除了幻觉风险。
*   **UI 风格**: 现代简约风格，注重图片展示和流体交互。

### 📂 核心目录结构
*   **`kitchenflow-app/`**: 主应用程序核心代码。
    *   `src/screens/`: 所有 UI 页面。
    *   `src/services/`: 业务逻辑与 AI交互层 (重点: `prompts.ts`, `scannerService.ts`)。
    *   `src/liquid-glass-native/`: 视觉效果组件。
*   **`scanner-docs/`**: 包含数据库 SQL Schema 设计稿和 AI Prompt 原型验证。

---

## 2. 核心功能模块分析

### 📸 A. 智能冰箱快照 (Fridge Snapshots)
**"别让我数有多少个鸡蛋，告诉我能不能做番茄炒蛋。"**

*   **功能**: 用户拍摄冰箱一层或多层的照片，AI 自动识别可见的 **Top 5-10 核心食材**。
*   **核心逻辑**:
    *   忽略调料瓶、零食小包装等非决策性物品。
    *   **视觉新鲜度判定 (Visual Freshness)**: AI 不看有效期，而是看"脸色"。
        *   `fresh`: 颜色鲜艳，质地紧实。
        *   `use-soon`: 轻微枯萎或有斑点 -> **触发清理库存建议**。
        *   `priority`: 必须立刻吃掉 -> **高优先级警报**。
*   **数据存储**: `fridge_snapshots` 表 (仅保留最新一次有效的快照，旧数据自动过期)。

### 🤤 B. 馋念清单 (Cravings)
**"我想吃红烧肉，但我不知道还需要买什么。"**

*   **功能**: 用户只需输入（或语音说出）菜名，如"红烧肉"或"冬阴功汤"。
*   **AI 介入**:
    1.  Gemini 解析该菜谱所需的**核心食材** (Essential Ingredients)。
    2.  确定菜系 (Cuisine) 和难度 (Difficulty)。
    3.  生成代表性的 Emoji 用于 UI 展示。
*   **数据存储**: `cravings` 表。

### 🛒 C. 智能购物清单 (Smart Shopping List)
**"帮我算算还要买什么。"**

*   **核心算法**:
    > **购物清单 = (馋念需求 + 常备品补货) - (当前有效库存)**
*   **功能**:
    *   AI 自动比对冰箱里的东西和你想做的菜，只列出**缺少的**食材。
    *   **过期急救**: 自动检测冰箱里标记为 `use-soon`/`priority` 的食材，并在清单底部推荐能消耗它们的菜谱（"你的菠菜快坏了，要不要做个菠菜蛋汤？"）。
*   **数据存储**: `shopping_lists` 表。

### 🧂 D. 隐形常备品管理 (Pantry Staples)
**"盐和米这些东西，不用每次都记，用完了再说。"**

*   **功能**: 大米、油、盐等不适合拍照的物品。
*   **逻辑**: 使用 **Flash/Decay Score (0-100分)** 系统。
    *   满分 100，每次做饭（Completed Cooking）自动扣除 5-10 分。
    *   当分数低于 **30分 (Alert Threshold)** 时，系统会在生成购物清单时主动询问："盐可能不多了，需要补货吗？"
*   **数据存储**: `pantry_staples` 表 (Unique constraint per user/item)。

### 🧾 E. 收据学习 (Receipt Learning)
**"不记账，但要懂行情。"**

*   **功能**: 用户扫描购物小票。
*   **目的**: **不是**为了更新库存（因为扫描太麻烦），而是为了**价格追踪 (Price Learning)**。
    *   让系统"记住"某家店（如 Tesco）的牛肉大概多少钱一斤。
    *   用于在生成购物清单时，提供更准确的 **"预计花费" (Total Estimated Cost)**。

---

## 3. 现有问题与优化建议 (Optimizations)

### 🧹 1. 项目整洁度 (Project Hygiene)
*   **根目录清理**: 根目录下存在大量临时的 `tmpclaude-*` 文件和调试日志 (`FIX_*.md`)。
    *   **建议**: 建立 `archive/` 目录归档历史日志，删除临时文件，保持仓库清爽。
*   **模块合并**: 确认 `smart-kitchen-camera-module` 是否已完全集成。如果是，应将其移除，避免新人混淆。

### 🧠 2. 代码架构 (Code Architecture)
*   **Prompt 解耦**: `src/services/prompts.ts` 文件体积庞大且不仅包含 Prompts，还包含了类型定义和 Schema 验证逻辑。
    *   **优化**: 将 JSON Schemas 提取到 `src/ai/schemas.ts`，类型提取到 `src/types/ai.ts`，让 `prompts.ts` 只负责生成文本提示，提高可维护性。
*   **本地缓存策略**: 增加 `Offline/Local-First` 支持。目前架构强依赖网络，建议对 `Shopping List` 和 `Inventory` 进行本地持久化缓存（AsyncStorage），改善超市地下室等弱网环境的体验。

### ⚡ 3. 用户体验 (User Experience)
*   **后台上传与通知**: 冰箱扫描目前的流程可能是同步等待。
    *   **优化**: 改为"拍完即走"。图片后台上传处理，AI 分析完成后通过系统通知 (Local Notification) 告诉用户："冰箱扫描完成，发现了 3 个快过期的食材！"
*   **交互式反馈学习**: 扫描结果如果出错（比如把苹果认成梨），允许用户长按修正。并将修正数据回传给后台，用于后续微调模型（Few-shot learning examples）。

### 🛡️ 4. 安全性 (Security)
*   **Environment Variables**: 再次检查 `kitchenflow-app/.env` 是否已配置并被 `.gitignore` 忽略。确保生产环境使用 Supabase Edge Functions 来中转 Gemini API 调用，防止 API Key 在客户端被抓包泄露。
