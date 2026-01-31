# KitchenFlow 完整集成路线图

## 🎯 项目概览

**产品名称**: KitchenFlow (暂定)  
**核心理念**: 不记账，只决策 (Don't Manage, Just Flow)  
**技术栈**: React + TypeScript + Vite + Supabase + Gemini AI + Google Maps

---

## 📅 开发阶段规划

### Phase 1: 核心 MVP (2-3周)

**目标**: 验证核心概念 - "拍照 → 决策 → 购物"

#### Week 1: 基础架构 + 冰箱扫描

**1.1 项目初始化**
```bash
# 创建新项目或调整现有 Smart Kitchen AI
npm create vite@latest kitchenflow -- --template react-ts
cd kitchenflow
npm install

# 核心依赖
npm install @supabase/supabase-js
npm install lucide-react
npm install react-router-dom
```

**1.2 集成现有 Camera Module**
- [ ] 复制 `smart-kitchen-camera-module` 到 `src/features/camera`
- [ ] 替换 `types.ts` 为 `kitchenflow-types.ts`
- [ ] 替换 `promptTemplates.ts` 为 `kitchenflow-prompts.ts`
- [ ] 替换 `scannerService.ts` 为 `kitchenflow-scanner-service.ts`

**1.3 Supabase 设置**
```bash
# 创建 Supabase 项目
# 执行 kitchenflow-schema.sql

# 安装 Supabase CLI（可选）
npm install -g supabase
supabase login
supabase init
```

**1.4 核心页面开发**
```
src/
├── pages/
│   ├── Home.tsx              # 首页（大按钮："拍冰箱"）
│   ├── FridgeSnapshot.tsx    # 冰箱扫描页
│   └── SnapshotResult.tsx    # 扫描结果展示
├── features/
│   └── camera/               # 相机模块（已有）
├── lib/
│   ├── supabase.ts           # Supabase 客户端
│   └── gemini.ts             # Gemini API 配置
└── types/
    └── index.ts              # 导出 kitchenflow-types
```

**交付物**:
- ✅ 用户可以拍照扫描冰箱
- ✅ 显示 Top 5-10 食材 + 新鲜度（绿/黄/红）
- ✅ 数据保存到 Supabase（24小时过期）

---

#### Week 2: Cravings + 购物清单生成

**2.1 Cravings 管理**
```
src/pages/
├── Cravings.tsx              # 馋念清单管理
└── AddCraving.tsx            # 添加馋念（手动输入）
```

**功能点**:
- [ ] 手动添加 Craving（输入菜名）
- [ ] Gemini 解析菜谱 → 所需食材
- [ ] 显示 Cravings 列表（未完成 + 已完成）
- [ ] 删除/标记完成

**2.2 购物清单生成**
```
src/pages/
└── ShoppingList.tsx          # 智能购物清单
```

**核心算法实现**:
```typescript
// 伪代码
const generateList = async () => {
  // 1. 获取最新冰箱快照
  const snapshot = await getLatestSnapshot(userId);
  
  // 2. 获取未完成的 Cravings
  const cravings = await getPendingCravings(userId);
  
  // 3. 解析所需食材
  const ingredients = await analyzeCravingsBatch(cravings);
  
  // 4. 检查常备品
  const lowStaples = await getLowStaples(userId);
  
  // 5. 调用 Gemini 生成购物清单
  const shoppingList = await generateSmartShoppingList({
    currentInventory: snapshot.items,
    cravings: ingredients,
    pantryStaples: lowStaples,
    expiringItems: snapshot.items.filter(i => i.freshness === 'priority')
  });
  
  // 6. 保存清单
  await saveShoppingList(shoppingList);
};
```

**交付物**:
- ✅ 用户可以添加想吃的菜
- ✅ 生成智能购物清单（缺什么买什么）
- ✅ 显示购买理由（"为了做麻婆豆腐"）

---

#### Week 3: 常备品管理 + UI 优化

**3.1 常备品初始化**
```
src/pages/
└── PantrySetup.tsx           # 一次性设置常备品
```

**功能**:
- [ ] 勾选家中常备品（油、盐、酱油等）
- [ ] 设置提醒阈值（默认30分）
- [ ] 每次"去烹饪"时自动扣减分数

**3.2 UI/UX 优化**
- [ ] 响应式设计（移动端优先）
- [ ] 加载动画（扫描时的骨架屏）
- [ ] 错误处理（API 失败、网络异常）
- [ ] 空状态设计（无快照、无 Cravings）

**3.3 测试**
- [ ] 端到端测试（拍照 → 生成清单 → 购物）
- [ ] 边界情况（空冰箱、5张照片、低质量图片）

**交付物**:
- ✅ 完整的 MVP 流程可用
- ✅ 移动端体验流畅

---

### Phase 2: 进阶功能 (3-4周)

#### Week 4: 语音输入集成

**4.1 Web Speech API (临时方案)**
```typescript
// src/hooks/useVoiceInput.ts
const recognition = new webkitSpeechRecognition();
recognition.lang = 'zh-CN';
recognition.onresult = async (event) => {
  const transcript = event.results[0][0].transcript;
  const parsed = await parseVoiceCommand(transcript);
  
  if (parsed.intent === 'add-craving') {
    await addCraving(parsed.extractedData.dishName);
  }
};
```

**4.2 原生集成（未来）**
- iOS: App Intents (Siri Shortcuts)
- Android: App Actions (Google Assistant)

**交付物**:
- ✅ 用户可以语音添加 Craving
- ✅ 识别准确率 > 80%

---

#### Week 5-6: Receipt 扫描 + 价格学习

**5.1 Receipt Scanner**
```
src/pages/
└── ReceiptScan.tsx           # 扫描收据
```

**功能**:
- [ ] 拍摄收据
- [ ] 提取商品 + 价格
- [ ] 学习"常去店铺"（usualShop）
- [ ] 价格趋势分析（可选）

**5.2 价格智能**
```typescript
// 示例：购物清单显示预估价格
const estimatePrice = (item: string, shop: string) => {
  // 从历史 receipts 中查找平均价格
  const avgPrice = await getAveragePriceFromReceipts(item, shop);
  return avgPrice;
};
```

**交付物**:
- ✅ Receipt 扫描功能
- ✅ 购物清单显示预估总价

---

#### Week 7: Google Maps 集成

**7.1 商店路线规划**
```bash
npm install @googlemaps/js-api-loader
```

```typescript
// src/services/maps.ts
const generateRoute = async (shops: ShopInfo[], userLocation: Location) => {
  const directionsService = new google.maps.DirectionsService();
  
  const result = await directionsService.route({
    origin: userLocation,
    destination: userLocation,
    waypoints: shops.map(s => ({ location: s.location })),
    optimizeWaypoints: true,
    travelMode: google.maps.TravelMode.DRIVING
  });
  
  return result;
};
```

**交付物**:
- ✅ 生成最优购物路线
- ✅ 显示营业时间、距离、预计时长

---

### Phase 3: 高级特性 (4-6周)

#### Week 8-9: AR 反向查菜谱

**功能**:
- [ ] 在超市扫描食材
- [ ] 推荐可以做的菜（基于家中库存）
- [ ] 显示"买这个正好"提示

**技术**:
- 使用 Camera API 实时识别
- 调用 `scanItemForRecipes()`
- 显示匹配度 Score

---

#### Week 10-11: 社交功能（可选）

**功能**:
- [ ] 分享菜谱链接（Instagram/小红书）
- [ ] 自动解析食材
- [ ] 导入到 Cravings

---

#### Week 12: Agent Shopping（长期目标）

**功能**:
- [ ] 集成超市 API（Tesco, Sainsbury's）
- [ ] 自动比价
- [ ] 一键下单

---

## 🛠️ 技术债务清单

### 现有 Smart Kitchen AI 需要删除的功能
- [ ] 移除 QR Loyalty 系统
- [ ] 简化多 Location 管理
- [ ] 删除复杂的库存管理 UI
- [ ] 移除 Container/FillLevel 等字段

### 需要新增的基础设施
- [ ] Cron Job 清理过期快照（Supabase Edge Functions）
- [ ] 图片存储（Supabase Storage）
- [ ] API Rate Limiting（Gemini API）
- [ ] 错误监控（Sentry）

---

## 📊 里程碑检查点

### Milestone 1: Alpha (Week 3)
- [ ] 用户可以完成完整流程：拍照 → 添加 Craving → 生成购物清单
- [ ] 数据正确保存到 Supabase
- [ ] 移动端可用

### Milestone 2: Beta (Week 7)
- [ ] 语音输入可用
- [ ] Receipt 扫描可用
- [ ] Google Maps 路线规划
- [ ] 5 个真实用户测试

### Milestone 3: Public Launch (Week 12)
- [ ] 所有核心功能稳定
- [ ] 性能优化（< 3s 扫描时间）
- [ ] 文档完善
- [ ] App Store / Google Play 上线（如果做原生）

---

## 🚦 风险管理

### 技术风险
1. **Gemini API 精度**
   - 风险：食材识别错误率 > 20%
   - 缓解：Fine-tune prompts，添加纠错 UI

2. **24小时快照过期**
   - 风险：用户忘记更新，数据陈旧
   - 缓解：推送提醒"冰箱快照已过期"

3. **语音识别准确度**
   - 风险：中文菜名复杂，识别困难
   - 缓解：提供手动纠错选项

### 产品风险
1. **用户习惯养成**
   - 风险：用户不愿意每次购物前拍照
   - 缓解：强调"零阻力"设计，语音输入降低门槛

2. **与现有工具竞争**
   - 风险：用户已有购物清单习惯（纸笔/Notes）
   - 缓解：突出"智能决策"差异化

---

## 📈 成功指标 (KPIs)

### 用户留存
- Day 1: > 40%
- Day 7: > 20%
- Day 30: > 10%

### 功能使用率
- 冰箱扫描：每周 ≥ 1次
- Craving 添加：每周 ≥ 2次
- 购物清单生成：每周 ≥ 1次

### 技术指标
- 扫描成功率：> 90%
- 食材识别准确率：> 85%
- API 响应时间：< 3s (P95)

---

## 📝 下一步行动

### 立即可做（本周）
1. **测试 Demo HTML** - 验证扫描效果
2. **初始化项目** - 创建 Vite + Supabase 项目
3. **设置 Supabase** - 执行 schema.sql
4. **集成 Camera Module** - 复制文件到新项目

### 未来2周
1. **完成首页 + 扫描页面**
2. **实现 Cravings 管理**
3. **开发购物清单生成逻辑**

### 需要讨论的问题
1. **原生 App vs PWA?**
   - 原生：更好的语音集成、推送通知
   - PWA：快速迭代、跨平台

2. **Freemium 模式？**
   - 免费：基础扫描 + 购物清单
   - 付费：AR 查菜谱、Agent Shopping、无限快照

3. **目标市场？**
   - 个人/家庭（当前定位）
   - 小型餐厅（未来扩展）

---

## 🎉 总结

你现在有了：
- ✅ 完整的类型定义
- ✅ 优化的 AI Prompts
- ✅ Scanner Service
- ✅ 数据库 Schema
- ✅ 可运行的 Demo

**下一步：打开 `kitchenflow-scanner-demo.html` 测试扫描效果！**
