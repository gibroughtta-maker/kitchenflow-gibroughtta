# 🚀 Cravings 功能快速启动

> 5 分钟快速测试 Cravings 功能

---

## ⚡ 快速测试步骤

### 1. 启动应用
```bash
cd kitchenflow-app
npx expo start
```

### 2. 导航到 Cravings
- 点击首页的 **Cravings 🍜** 按钮
- 或使用 QuickAccessBar

### 3. 测试场景 A：手动添加
```
1. 在底部输入框输入 "麻婆豆腐"
2. 点击 "➕ Add"
3. 看到卡片显示在列表中 ✅
```

### 4. 测试场景 B：链接分析（AI 功能）
```
1. 复制一个食谱链接，例如：
   https://www.youtube.com/watch?v=example

2. 点击右上角 "📋 Paste" 按钮

3. 确认分析对话框

4. 等待 AI 分析（约 3-5 秒）
   显示 "🤖 AI is analyzing recipe..."

5. 成功后看到 "✅ Success - Recipe analyzed and added!"

6. 卡片显示在列表中，来源标记为 📱
```

### 5. 测试场景 C：生成购物清单
```
1. 确保至少有 1 个从链接添加的馋念

2. 顶部出现 "🛒 Generate Shopping List (1)" 按钮

3. 点击按钮

4. 确认对话框显示菜单列表

5. 点击 "Generate"

6. 跳转到购物清单界面 ✅
```

---

## 🎨 界面预览

```
┌─────────────────────────────┐
│ ← Back   My Cravings 🍜  📋 │
├─────────────────────────────┤
│ 🛒 Generate Shopping List (3)│
├─────────────────────────────┤
│ ┌──────┐  ┌──────┐          │
│ │ 🍽️  │  │ 🍽️  │          │
│ │麻婆  │  │宫保  │          │
│ │✍️   │  │📱   │          │
│ └──────┘  └──────┘          │
├─────────────────────────────┤
│ [Dish name or paste link...]│
│              [➕ Add]        │
└─────────────────────────────┘
```

---

## 🧪 功能清单

### 基础操作
- ✅ 添加馋念（手动输入）
- ✅ 查看馋念列表
- ✅ 下拉刷新
- ✅ 点击添加备注
- ✅ 长按归档

### AI 功能
- ✅ 粘贴链接自动识别
- ✅ Gemini AI 分析食谱
- ✅ 提取食材清单
- ✅ 识别菜系和难度

### 集成功能
- ✅ 连接购物清单生成
- ✅ 显示可购买馋念数量
- ✅ 传递选中馋念到购物清单

---

## 🔧 环境检查

### 必需配置
```bash
# 检查 .env 文件
cat kitchenflow-app/.env

# 应该包含：
EXPO_PUBLIC_GEMINI_API_KEY=your_key_here
EXPO_PUBLIC_SUPABASE_URL=your_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_key_here
```

### 依赖检查
```bash
# 确保已安装
npm list expo-clipboard
# 如果没有：
npm install expo-clipboard
```

---

## 🐛 常见问题

### Q: 点击 Paste 没反应？
**A**: 
1. 先复制一个链接到剪贴板
2. 确保是 http:// 或 https:// 开头
3. 检查权限（Clipboard access）

### Q: AI 分析失败？
**A**: 
1. 检查 Gemini API Key 是否有效
2. 确认网络连接
3. 查看控制台错误信息

### Q: Generate Shopping List 按钮不显示？
**A**: 
1. 至少需要 1 个从链接添加的馋念
2. 手动添加的馋念没有食材清单
3. 确保馋念包含 `required_ingredients` 字段

---

## 📊 数据验证

### 在 Supabase 查看数据
```sql
-- 查看所有馋念
SELECT id, name, source, required_ingredients 
FROM cravings 
WHERE is_archived = false;

-- 查看可用于购物清单的馋念
SELECT name, required_ingredients 
FROM cravings 
WHERE required_ingredients IS NOT NULL;
```

---

## 🎯 下一步

完成 Cravings 测试后：
1. ✅ 测试 FridgeScan 功能
2. ✅ 集成购物清单生成
3. ✅ 测试完整流程：扫描 → 馋念 → 购物清单

---

## 📞 支持

遇到问题？检查：
- `docs/CRAVINGS_INTEGRATION_COMPLETE.md` - 完整文档
- `docs/VOICE_INPUT_GUIDE.md` - 语音输入指南
- Supabase Dashboard - 数据库状态
- 终端日志 - 错误信息

---

**快速启动完成！** 🎉  
现在开始测试您的 Cravings 功能吧！
