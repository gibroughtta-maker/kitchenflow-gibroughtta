# KitchenFlow 前后端集成协议

**版本**: v1.0  
**日期**: 2026-01-20  
**目的**: 作为前端和后端开发者的"合约"，确保接口一致性

---

## 1. 命名规范

| 位置 | 命名风格 | 示例 |
|------|----------|------|
| TypeScript 接口 | camelCase | `nameChinese` |
| PostgreSQL 字段 | snake_case | `name_chinese` |
| 前端需要转换 | Supabase 自动映射 | ✅ |

---

## 2. 共享类型定义

### 2.1 设备 (Device)
```typescript
interface Device {
  id: string;              // UUID, 主键
  created_at: string;      // ISO 8601 时间戳
  nickname?: string;       // 用户昵称（协作时显示）
  last_seen: string;       // 最后活跃时间
}
```

### 2.2 食材 (Ingredient) - AI 识别结果
```typescript
type FreshnessLevel = 'fresh' | 'warning' | 'urgent' | 'neutral';
type IngredientCategory = 'fresh' | 'pantry' | 'other';

interface Ingredient {
  id: string;
  name: string;              // 英文名
  name_chinese: string;      // 中文名 ⚠️ 注意用 snake_case
  quantity?: string;         // 数量描述
  freshness: FreshnessLevel;
  days_left?: number;        // 预估剩余天数
  freshness_note: string;    // 新鲜度说明（中文）
  category: IngredientCategory;
}
```

### 2.3 馋念 (Craving)
```typescript
type CravingSource = 'voice' | 'share' | 'manual';

interface Craving {
  id: string;
  device_id: string;         // 关联设备
  name: string;              // 菜名
  name_chinese?: string;     // 中文菜名
  image_url?: string;        // 美食图片
  source: CravingSource;     // 来源
  note?: string;             // 用户备注
  ingredients?: Ingredient[]; // 所需食材（JSONB）
  created_at: string;
  is_archived: boolean;
}
```

### 2.4 购物清单 (ShoppingList)
```typescript
interface ShoppingList {
  id: string;
  owner_device_id: string;   // 创建者
  name: string;              // 清单名称
  share_token?: string;      // 分享链接 token
  created_at: string;
  expires_at?: string;       // 链接过期时间
  is_active: boolean;
}
```

### 2.5 购物项 (ShoppingItem)
```typescript
interface ShoppingItem {
  id: string;
  list_id: string;           // 所属清单
  name: string;              // 商品名
  quantity?: string;         // 数量
  category: IngredientCategory;
  reason?: string;           // 购买理由
  checked: boolean;          // 是否已购买
  checked_by?: string;       // 谁购买的（device_id）
  checked_at?: string;       // 购买时间
  created_at: string;
  sort_order: number;        // 排序
}
```

### 2.6 清单成员 (ShoppingListMember)
```typescript
interface ShoppingListMember {
  id: string;
  list_id: string;
  device_id: string;
  joined_at: string;
  is_online: boolean;
}
```

### 2.7 常备品 (PantryStaple)
```typescript
interface PantryStaple {
  id: string;
  device_id: string;
  name: string;
  category: 'condiment' | 'grain' | 'oil';
  score: number;             // 0-100, 低于 20 提醒补货
  last_used?: string;
  created_at: string;
}
```

---

## 3. 环境变量

前后端开发者需要共享的环境变量：

```env
# .env (前后端共用)
EXPO_PUBLIC_SUPABASE_URL=https://[PROJECT_ID].supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
EXPO_PUBLIC_GEMINI_API_KEY=AIza...
```

**后端开发者提供：**
- `SUPABASE_URL` 和 `SUPABASE_ANON_KEY`

**前端开发者提供：**
- `GEMINI_API_KEY`（或共用）

---

## 4. API 接口规范

### 4.1 设备管理

#### 注册设备
```typescript
// 前端调用
const device = await supabase
  .from('devices')
  .insert({ nickname: '爸爸' })
  .select()
  .single();

// 存储到本地
await AsyncStorage.setItem('device_id', device.id);
```

### 4.2 馋念管理

#### 获取列表
```typescript
const { data } = await supabase
  .from('cravings')
  .select('*')
  .eq('device_id', deviceId)
  .eq('is_archived', false)
  .order('created_at', { ascending: false });
```

#### 添加馋念
```typescript
await supabase.from('cravings').insert({
  device_id: deviceId,
  name: '冬阴功汤',
  source: 'voice',
  note: '想吃！'
});
```

### 4.3 购物清单

#### 创建清单
```typescript
const { data: list } = await supabase
  .from('shopping_lists')
  .insert({
    owner_device_id: deviceId,
    name: '本周采购'
  })
  .select()
  .single();

// 自动添加创建者为成员
await supabase.from('shopping_list_members').insert({
  list_id: list.id,
  device_id: deviceId
});
```

#### 生成分享链接
```typescript
import { nanoid } from 'nanoid';

const shareToken = nanoid(10);
const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

await supabase
  .from('shopping_lists')
  .update({ share_token: shareToken, expires_at: expiresAt })
  .eq('id', listId);

// 返回链接
const shareLink = `kitchenflow://join/${shareToken}`;
```

#### 加入清单
```typescript
async function joinList(shareToken: string, deviceId: string) {
  const { data: list } = await supabase
    .from('shopping_lists')
    .select('*')
    .eq('share_token', shareToken)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (!list) throw new Error('链接已失效');

  await supabase.from('shopping_list_members').upsert({
    list_id: list.id,
    device_id: deviceId
  });

  return list;
}
```

### 4.4 实时订阅

```typescript
// 订阅购物项变化
const channel = supabase
  .channel(`list:${listId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'shopping_items',
    filter: `list_id=eq.${listId}`
  }, handleChange)
  .subscribe();

// 清理
return () => channel.unsubscribe();
```

---

## 5. 开发时间线

```
Week 1:
├── 前端: Task 1-3 (项目初始化、主题、首页)
└── 后端: Supabase 项目创建 + 数据库初始化

Week 1 结束:
└── 后端提供 .env 给前端

Week 2:
├── 前端: Task 4-5 (AI 服务、扫描结果) + Task 6 (Supabase 集成)
└── 后端: RLS 策略 + Realtime 配置

Week 2 结束:
└── 🔗 集成测试 (需两人同时)

Week 3:
├── 前端: Task 7 (馋念页面) + Task 8 (购物清单页面)
└── 后端: 测试协作功能

Week 3 结束:
└── 🚀 MVP 完成
```

---

## 6. 测试检查清单

### 前端开发者自测
- [ ] 相机拍照功能
- [ ] AI 识别返回正确 JSON
- [ ] UI 正确显示新鲜度颜色
- [ ] Supabase 连接成功

### 后端开发者自测
- [ ] 所有表创建成功
- [ ] RLS 策略生效
- [ ] Realtime 事件正常触发
- [ ] 分享链接生成和验证

### 联合测试
- [ ] 设备 A 创建清单，设备 B 通过链接加入
- [ ] 实时同步：A 添加项目，B 立即看到
- [ ] 勾选同步：B 勾选，A 看到谁购买了
- [ ] 在线状态正确显示

---

*文档生成时间: 2026-01-20*
