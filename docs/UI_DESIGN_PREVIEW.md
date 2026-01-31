# 🎨 Cravings UI Design Preview

## 设计方案对比

---

## 方案 A：渐变色背景 + 首字母（推荐）

### Craving Card
```
┌─────────────────┐
│                 │
│    ╔═══╗        │  
│    ║ K ║        │  ← 大写首字母，渐变色背景
│    ╚═══╝        │     (根据菜系不同颜色)
│                 │
│ Kung Pao        │  ← Serif 字体
│ Chicken         │
│                 │
│           🎤    │  ← Source emoji
└─────────────────┘
```

**颜色方案：**
- Chinese: 🔴 红色渐变 `#FF6B6B → #FF5252`
- Italian: 🟢 绿色渐变 `#51CF66 → #37B24D`
- Japanese: 🟣 紫色渐变 `#CC5DE8 → #AE3EC9`
- Korean: 🔵 蓝色渐变 `#339AF0 → #1C7ED6`
- Thai: 🟠 橙色渐变 `#FF922B → #FD7E14`
- Mexican: 🟡 黄色渐变 `#FCC419 → #FAB005`
- Indian: 🟠 深橙渐变 `#FF8C42 → #FF6B35`
- French: 💜 淡紫渐变 `#B197FC → #9775FA`
- American: ⚪ 灰色渐变 `#ADB5BD → #868E96`
- Default: 🌈 彩虹渐变 `#667EEA → #764BA2`

### Recipe Detail Page
```
┌────────────────────────────┐
│                            │
│         ╔══════╗           │
│         ║  K   ║           │  ← 超大首字母
│         ╚══════╝           │     120px, 渐变背景
│                            │
└────────────────────────────┘

┌────────────────────────────┐
│ Kung Pao Chicken           │
│                            │
│ [Chinese] [😊 Easy]        │
│ [30 minutes]               │
└────────────────────────────┘
```

---

## 方案 B：几何图形 + 食物类别图标

### Craving Card
```
┌─────────────────┐
│                 │
│     ╱────╲      │
│    │  🍗  │     │  ← 食物类别图标
│     ╲────╱      │     六边形边框
│                 │
│ Kung Pao        │
│ Chicken         │
│                 │
│           🎤    │
└─────────────────┘
```

**图标映射：**
- Chicken dishes: 🍗
- Beef dishes: 🥩
- Pork dishes: 🥓
- Seafood: 🦐
- Vegetarian: 🥗
- Pasta: 🍝
- Rice: 🍚
- Noodles: 🍜
- Dessert: 🍰
- Default: 🍽️

### Recipe Detail Page
```
┌────────────────────────────┐
│                            │
│         ╱────╲             │
│        │  🍗  │            │  ← 大图标
│         ╲────╱             │
│                            │
└────────────────────────────┘
```

---

## 方案 C：纯色块 + Typography（极简）

### Craving Card
```
┌─────────────────┐
│ ████████████    │  ← 彩色条带 (顶部)
│                 │
│  KUNG PAO       │  ← 粗体大写
│  Chicken        │  ← 细体小写
│                 │
│  Chinese • Easy │  ← 元数据
│                 │
│           🎤    │
└─────────────────┘
```

**颜色条带：**
- Chinese: `#FF6B6B`
- Italian: `#51CF66`
- Japanese: `#CC5DE8`
- Korean: `#339AF0`
- Thai: `#FF922B`
- Mexican: `#FCC419`
- Indian: `#FF8C42`
- French: `#B197FC`
- American: `#ADB5BD`
- Default: `#667EEA`

### Recipe Detail Page
```
┌────────────────────────────┐
│ ████████████████████████   │  ← 彩色条带
│                            │
│     KUNG PAO CHICKEN       │  ← 超大标题
│                            │
└────────────────────────────┘

┌────────────────────────────┐
│ Chinese • 😊 Easy          │
│ 30 minutes                 │
└────────────────────────────┘
```

---

## 方案 D：食材图标组合（创意）

### Craving Card
```
┌─────────────────┐
│                 │
│   🌶️ 🥜 🐔      │  ← 主要食材的 emoji
│                 │     (最多 3 个)
│                 │
│ Kung Pao        │
│ Chicken         │
│                 │
│           🎤    │
└─────────────────┘
```

**食材提取逻辑：**
- AI 分析结果中选取 top 3 最具代表性的食材
- 如果没有食材数据，使用菜系默认图标

### Recipe Detail Page
```
┌────────────────────────────┐
│                            │
│    🌶️   🥜   🐔           │  ← 大号食材 emoji
│                            │     (60px each)
│                            │
└────────────────────────────┘
```

---

## 📊 方案对比

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| **A: 渐变色首字母** | ✅ 优雅、专业<br>✅ 易识别<br>✅ 无 emoji 依赖 | ⚠️ 需要实现渐变 | 高端应用 |
| **B: 几何图标** | ✅ 有趣、现代<br>✅ 食物关联强 | ⚠️ 图标映射复杂 | 休闲应用 |
| **C: 纯色块** | ✅ 极简、快速<br>✅ 实现简单 | ⚠️ 视觉冲击力弱 | 工具类应用 |
| **D: 食材组合** | ✅ 直观、有趣<br>✅ 信息丰富 | ⚠️ 依赖 AI 质量 | 创意应用 |

---

## 🎯 我的推荐

### **方案 A（渐变色首字母）+ 方案 C（色块元素）的混合**

#### Craving Card 最终设计
```
┌─────────────────────────┐
│ ██████                  │  ← 顶部色条（根据菜系）
│                         │
│       ╔═══╗             │
│       ║ K ║             │  ← 首字母，渐变背景
│       ╚═══╝             │
│                         │
│   Kung Pao Chicken      │  ← Serif 字体，居中
│                         │
│   Chinese • Easy        │  ← 小字元数据
│                 🎤      │  ← Source emoji
└─────────────────────────┘
```

#### Recipe Detail Page
```
┌───────────────────────────────┐
│ ████████████████████████████  │  ← 彩色顶部（高 60px）
│                               │
│          ╔═════╗              │
│          ║  K  ║              │  ← 超大首字母
│          ╚═════╝              │     (100px, 渐变)
│                               │
└───────────────────────────────┘

┌───────────────────────────────┐
│ Kung Pao Chicken              │
│                               │
│ [Chinese] [😊 Easy] [30 min] │
└───────────────────────────────┘
```

---

## 🎨 颜色系统（最终方案）

```typescript
const cuisineColors = {
  'Chinese': {
    gradient: ['#FF6B6B', '#FF5252'],
    solid: '#FF6B6B'
  },
  'Italian': {
    gradient: ['#51CF66', '#37B24D'],
    solid: '#51CF66'
  },
  'Japanese': {
    gradient: ['#CC5DE8', '#AE3EC9'],
    solid: '#CC5DE8'
  },
  'Korean': {
    gradient: ['#339AF0', '#1C7ED6'],
    solid: '#339AF0'
  },
  'Thai': {
    gradient: ['#FF922B', '#FD7E14'],
    solid: '#FF922B'
  },
  'Mexican': {
    gradient: ['#FCC419', '#FAB005'],
    solid: '#FCC419'
  },
  'Indian': {
    gradient: ['#FF8C42', '#FF6B35'],
    solid: '#FF8C42'
  },
  'French': {
    gradient: ['#B197FC', '#9775FA'],
    solid: '#B197FC'
  },
  'American': {
    gradient: ['#ADB5BD', '#868E96'],
    solid: '#ADB5BD'
  },
  'Mediterranean': {
    gradient: ['#20C997', '#12B886'],
    solid: '#20C997'
  },
  'Default': {
    gradient: ['#667EEA', '#764BA2'],
    solid: '#667EEA'
  }
};
```

---

## 📝 实现细节

### 方案 A 实现要点

1. **LinearGradient** for color backgrounds
   - 使用 `expo-linear-gradient`
   - 从上到下的渐变效果

2. **首字母提取**
   ```typescript
   const getInitial = (name: string): string => {
     return name.charAt(0).toUpperCase();
   };
   ```

3. **Typography**
   - 首字母: 72px, bold, white
   - 菜名: 18px, serif, bold
   - 元数据: 12px, sans-serif, medium

4. **布局**
   - 卡片高度: 180px
   - 圆角: 16px
   - 阴影: elevation 4
   - 内边距: 16px

---

## ❓ 你的选择

请告诉我你更喜欢哪个方案，或者是否需要我组合不同方案的元素？

**快速投票：**
- A: 渐变色首字母 ← 推荐
- B: 几何图标
- C: 纯色块
- D: 食材组合
- E: 混合方案（A+C）← 最推荐
- F: 其他（告诉我你的想法）
