# KitchenFlow 功能完成度概览

> 用于参赛/演示参考。最后更新：按当前代码与路由整理。

## 路由与入口（App 内）

| 路由 | 屏幕 | 功能概要 | 完成度 |
|------|------|----------|--------|
| `''` | Home | 相机取景、快门拍照、上传相册、快捷入口（Cravings / Shopping / Inventory）、扫描小票 | ✅ 已实现 |
| `fridge/scan` | FridgeScan | 选图/拍照 → 选存储位置 → 调用 AI 分析 | ✅ 已实现 |
| `scan` | ScanResults | 展示识别结果、按新鲜度分组、推荐食谱/生成购物清单、保存到库存、选存储位置弹窗 | ✅ 已实现 |
| `inventory` | Inventory | 全部/冰箱/冷冻/ pantry 切换、库存列表、下拉刷新、空状态、拍照加料 | ✅ 已实现 |
| `cravings` | Cravings | 想吃清单、输入/语音、加购缺失食材、跳食谱详情 | ✅ 已实现 |
| `recipe/:dishName` | RecipeDetail | 食谱详情、食材与步骤、加购缺失 | ✅ 已实现 |
| `shopping` | ShoppingList | 购物清单、快速添加、分享、在线成员、跳 WebView/路线 | ✅ 已实现 |
| (从 Shopping 进入) | ShoppingWebView | 内嵌超市网站 | ✅ 已实现 |
| (从 Shopping 进入) | ShoppingRoute | 路线规划、多店 | ✅ 已实现 |
| `receipt/scan` | ReceiptScan | 小票拍照、解析、加购 | ✅ 已实现 |
| `pantry` | Pantry | 常备食材、补货提醒 | ✅ 已实现 |
| `join/:shareToken` | JoinList | 分享链接加入清单 | ✅ 已实现 |
| `settings` | Settings | 设备信息、关于、常备食材、功能开关 | ✅ 已实现 |
| `dev/*` | DatabaseTest 等 | 开发/测试用 | ✅ 已实现 |

## 后端与依赖

- **AI 扫描**：Gemini API（`scannerService` / `scanFridgeSnapshot`）
- **数据**：Supabase（设备、库存、购物清单、分享等）
- **设备**：`deviceService`（getOrCreateDeviceId）
- **其他**：地图/路线（Google Maps）、语音（expo-speech）等

## 结论

- **核心流程**：首页 → 拍照/上传 → 扫描结果 → 保存/推荐/购物清单；Cravings → 食谱 → 加购；购物清单 → WebView/路线，均已打通。
- **适合参赛**：功能完整度足够做 Demo；评委可重点演示「冰箱扫描 → 结果 → 推荐食谱/购物清单」与「Cravings + 购物清单」。
- **Web 展示**：仓库内已提供参赛用静态 Web 展示页（`web/`），用于落地页 + 扫描/购物清单 Demo 示意，与 App 功能对应。
