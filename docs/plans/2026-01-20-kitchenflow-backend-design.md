# KitchenFlow 后端架构设计文档

**版本**: v1.0  
**日期**: 2026-01-20  
**架构模式**: 混合方案 (Hybrid Approach)

---

## 1. 架构概述

### 1.1 设计理念

KitchenFlow 采用 **"轻后端"** 架构，最大化利用客户端能力和第三方服务，最小化自建后端复杂度。

```
┌─────────────────────────────────────────────────────────────────┐
│                        KitchenFlow 架构                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──────────────┐         ┌──────────────┐                     │
│   │   📱 App     │────────▶│  Gemini API  │                     │
│   │  (React      │  直连    │  (AI 识别)   │                     │
│   │   Native)    │◀────────│              │                     │
│   └──────┬───────┘         └──────────────┘                     │
│          │                                                       │
│          │ 数据同步                                              │
│          ▼                                                       │
│   ┌──────────────────────────────────────────┐                  │
│   │              Supabase                     │                  │
│   │  ┌─────────┐ ┌─────────┐ ┌────────────┐  │                  │
│   │  │PostgreSQL│ │Realtime │ │   Storage  │  │                  │
│   │  │ 数据库   │ │ 实时同步 │ │  (可选)    │  │                  │
│   │  └─────────┘ └─────────┘ └────────────┘  │                  │
│   └──────────────────────────────────────────┘                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 核心决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| AI 调用 | 前端直连 Gemini | 延迟低，实现简单 |
| 数据存储 | Supabase (PostgreSQL) | 免费额度足够 MVP |
| 用户系统 | 匿名用户 (设备 ID) | 降低注册门槛 |
| 实时协作 | Supabase Realtime | 内置功能，无需额外开发 |
| 家庭协作 | 分享链接 | 简单直观 |

---

## 2. 数据模型设计

### 2.1 ER 图

```
┌──────────────┐       ┌──────────────────┐       ┌──────────────┐
│   devices    │       │  shopping_lists  │       │   cravings   │
├──────────────┤       ├──────────────────┤       ├──────────────┤
│ id (PK)      │──┐    │ id (PK)          │    ┌──│ id (PK)      │
│ created_at   │  │    │ share_token      │    │  │ device_id    │
│ nickname     │  │    │ owner_device_id  │◀───┤  │ name         │
│ last_seen    │  └───▶│ name             │    │  │ image_url    │
└──────────────┘       │ created_at       │    │  │ source       │
                       │ expires_at       │    │  │ note         │
                       └────────┬─────────┘    │  │ created_at   │
                                │              │  └──────────────┘
                                │              │
                       ┌────────▼─────────┐    │  ┌──────────────┐
                       │  shopping_items  │    │  │pantry_staples│
                       ├──────────────────┤    │  ├──────────────┤
                       │ id (PK)          │    └──│ id (PK)      │
                       │ list_id (FK)     │       │ device_id    │
                       │ name             │       │ name         │
                       │ quantity         │       │ score        │
                       │ category         │       │ last_used    │
                       │ reason           │       └──────────────┘
                       │ checked          │
                       │ checked_by       │
                       │ created_at       │
                       └──────────────────┘
```

### 2.2 表结构详解

#### devices (设备/用户表)
```sql
CREATE TABLE devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  nickname TEXT,  -- 用户昵称（用于协作显示）
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  push_token TEXT  -- 推送通知 token (可选)
);
```

#### cravings (馋念清单)
```sql
CREATE TABLE cravings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
  name TEXT NOT NULL,  -- 菜名
  name_chinese TEXT,   -- 中文名
  image_url TEXT,      -- 美食图片 URL
  source TEXT DEFAULT 'manual',  -- 来源: voice/share/manual
  note TEXT,           -- 用户备注
  ingredients JSONB,   -- 所需食材 (AI 解析)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_archived BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_cravings_device ON cravings(device_id);
```

#### shopping_lists (购物清单)
```sql
CREATE TABLE shopping_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
  name TEXT DEFAULT '我的购物单',
  share_token TEXT UNIQUE,  -- 分享链接 token
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,   -- 链接过期时间
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_lists_share_token ON shopping_lists(share_token);
```

#### shopping_items (购物项)
```sql
CREATE TABLE shopping_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID REFERENCES shopping_lists(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity TEXT,
  category TEXT DEFAULT 'other',  -- fresh/pantry/other
  reason TEXT,  -- 购买理由 "为了做「冬阴功」"
  checked BOOLEAN DEFAULT FALSE,
  checked_by UUID REFERENCES devices(id),
  checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sort_order INTEGER DEFAULT 0
);

CREATE INDEX idx_items_list ON shopping_items(list_id);
```

#### shopping_list_members (购物清单成员)
```sql
CREATE TABLE shopping_list_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID REFERENCES shopping_lists(id) ON DELETE CASCADE,
  device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  is_online BOOLEAN DEFAULT FALSE,
  UNIQUE(list_id, device_id)
);
```

#### pantry_staples (常备品)
```sql
CREATE TABLE pantry_staples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'condiment',  -- condiment/grain/oil
  score INTEGER DEFAULT 100,  -- 0-100，低于 20 提醒补货
  last_used TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_staples_device ON pantry_staples(device_id);
```

---

## 3. API 设计

### 3.1 Supabase 客户端直连

由于使用 Supabase，大部分数据操作通过客户端 SDK 直接完成，无需传统 REST API。

```typescript
// 示例：前端直接操作数据库
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 获取馋念清单
const { data: cravings } = await supabase
  .from('cravings')
  .select('*')
  .eq('device_id', deviceId)
  .order('created_at', { ascending: false });

// 添加购物项
const { data: item } = await supabase
  .from('shopping_items')
  .insert({
    list_id: listId,
    name: '虾 500g',
    category: 'fresh',
    reason: '为了做「冬阴功」'
  })
  .select()
  .single();
```

### 3.2 实时订阅 (Supabase Realtime)

```typescript
// 订阅购物清单变化
const subscription = supabase
  .channel(`shopping_list:${listId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'shopping_items',
    filter: `list_id=eq.${listId}`
  }, (payload) => {
    // 实时更新 UI
    handleItemChange(payload);
  })
  .subscribe();
```

### 3.3 核心功能 API

#### 设备注册
```typescript
async function registerDevice(nickname?: string): Promise<string> {
  const { data, error } = await supabase
    .from('devices')
    .insert({ nickname })
    .select('id')
    .single();
  
  return data.id;
}
```

#### 创建分享链接
```typescript
async function createShareLink(listId: string, expiresInDays: number = 7): Promise<string> {
  const shareToken = generateToken(); // nanoid 或 uuid
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);
  
  await supabase
    .from('shopping_lists')
    .update({ share_token: shareToken, expires_at: expiresAt })
    .eq('id', listId);
  
  return `kitchenflow://join/${shareToken}`;
  // 或 Web 链接: https://kitchenflow.app/join/${shareToken}
}
```

#### 通过链接加入清单
```typescript
async function joinListByToken(shareToken: string, deviceId: string): Promise<ShoppingList> {
  // 查找清单
  const { data: list } = await supabase
    .from('shopping_lists')
    .select('*')
    .eq('share_token', shareToken)
    .gt('expires_at', new Date().toISOString())
    .single();
  
  if (!list) throw new Error('链接已失效');
  
  // 加入成员
  await supabase
    .from('shopping_list_members')
    .upsert({ list_id: list.id, device_id: deviceId });
  
  return list;
}
```

---

## 4. 安全策略

### 4.1 Row Level Security (RLS)

Supabase 使用 PostgreSQL 的 RLS 确保数据安全：

```sql
-- 设备只能看自己的馋念
CREATE POLICY "Users can view own cravings"
  ON cravings FOR SELECT
  USING (device_id = current_setting('app.device_id')::uuid);

-- 清单成员可以查看/编辑购物项
CREATE POLICY "List members can view items"
  ON shopping_items FOR SELECT
  USING (
    list_id IN (
      SELECT list_id FROM shopping_list_members 
      WHERE device_id = current_setting('app.device_id')::uuid
    )
  );

CREATE POLICY "List members can modify items"
  ON shopping_items FOR ALL
  USING (
    list_id IN (
      SELECT list_id FROM shopping_list_members 
      WHERE device_id = current_setting('app.device_id')::uuid
    )
  );
```

### 4.2 Gemini API Key 安全

**MVP 阶段措施：**
1. 在 Google Cloud Console 设置 API 限制
   - 每日请求上限
   - 限制调用来源（App Bundle ID）
2. 客户端使用环境变量存储 Key
3. 使用 Expo SecureStore 加密存储

**后续升级路径：**
- 迁移到 Supabase Edge Function 调用 Gemini
- 实现用户配额控制

---

## 5. 实时协作流程

### 5.1 家庭协作时序图

```
创建者 (Device A)                    Supabase                    家人 (Device B)
      │                                  │                              │
      │  1. 创建购物清单                  │                              │
      │─────────────────────────────────▶│                              │
      │                                  │                              │
      │  2. 生成分享链接                  │                              │
      │─────────────────────────────────▶│                              │
      │◀─────────────────────────────────│                              │
      │  kitchenflow://join/abc123       │                              │
      │                                  │                              │
      │  ════════ 分享链接给家人 ════════  │                              │
      │                                  │                              │
      │                                  │  3. 点击链接加入               │
      │                                  │◀─────────────────────────────│
      │                                  │─────────────────────────────▶│
      │                                  │  返回清单数据                  │
      │                                  │                              │
      │  4. 订阅实时更新                  │  4. 订阅实时更新              │
      │─────────────────────────────────▶│◀─────────────────────────────│
      │                                  │                              │
      │  5. 添加购物项                    │                              │
      │─────────────────────────────────▶│                              │
      │                                  │  6. 实时推送更新              │
      │                                  │─────────────────────────────▶│
      │                                  │                              │
      │                                  │  7. 勾选已购买                │
      │                                  │◀─────────────────────────────│
      │  8. 实时看到勾选状态              │                              │
      │◀─────────────────────────────────│                              │
      │                                  │                              │
```

### 5.2 在线状态管理

```typescript
// 使用 Supabase Presence 追踪在线状态
const channel = supabase.channel(`list:${listId}`);

channel
  .on('presence', { event: 'sync' }, () => {
    const state = channel.presenceState();
    // 更新 UI 显示在线成员
    updateOnlineMembers(state);
  })
  .subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.track({
        device_id: deviceId,
        nickname: nickname,
        online_at: new Date().toISOString()
      });
    }
  });
```

---

## 6. 数据同步策略

### 6.1 离线优先

使用本地存储作为缓存，网络恢复后同步：

```typescript
// 使用 AsyncStorage 或 MMKV 作为本地缓存
const localCache = {
  async get(key: string) { /* ... */ },
  async set(key: string, value: any) { /* ... */ }
};

// 包装 Supabase 操作
async function addCraving(craving: Craving) {
  // 1. 先写入本地
  await localCache.set(`craving:${craving.id}`, craving);
  updateUI(craving);
  
  // 2. 异步同步到云端
  try {
    await supabase.from('cravings').insert(craving);
  } catch (error) {
    // 标记为待同步
    await markPendingSync('cravings', craving.id);
  }
}
```

### 6.2 冲突解决

对于购物清单的并发编辑，采用 **最后写入胜出 (Last Write Wins)** 策略：

```typescript
// 勾选购物项时带上时间戳
async function checkItem(itemId: string, deviceId: string) {
  const now = new Date().toISOString();
  
  await supabase
    .from('shopping_items')
    .update({ 
      checked: true, 
      checked_by: deviceId,
      checked_at: now 
    })
    .eq('id', itemId)
    .lt('checked_at', now);  // 只有当本次操作更新时才写入
}
```

---

## 7. Supabase 项目配置

### 7.1 环境变量

```env
# .env
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
EXPO_PUBLIC_GEMINI_API_KEY=AIza...
```

### 7.2 Supabase 初始化脚本

```sql
-- 运行此脚本初始化数据库

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 创建所有表（见上文 2.2 节）

-- 启用实时功能
ALTER PUBLICATION supabase_realtime ADD TABLE shopping_items;
ALTER PUBLICATION supabase_realtime ADD TABLE shopping_list_members;

-- 创建 RLS 策略（见上文 4.1 节）
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE cravings ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE pantry_staples ENABLE ROW LEVEL SECURITY;
```

---

## 8. MVP 后端任务清单

### Phase 1 (与前端同步)
- [ ] 创建 Supabase 项目
- [ ] 运行数据库初始化脚本
- [ ] 配置 RLS 策略
- [ ] 集成到前端 App

### Phase 2 (家庭协作)
- [ ] 实现分享链接生成
- [ ] 实现清单加入功能
- [ ] 配置 Realtime 订阅
- [ ] 实现在线状态追踪

### Phase 3 (优化)
- [ ] 添加离线缓存
- [ ] 实现数据同步队列
- [ ] 添加推送通知 (可选)

---

## 附录：技术选型对比

| 功能 | Supabase (选用) | Firebase | 自建 |
|------|-----------------|----------|------|
| 数据库 | PostgreSQL ✅ | Firestore (NoSQL) | 自选 |
| 实时同步 | Realtime ✅ | Realtime Database | Socket.io |
| 认证 | Auth (可选) | Firebase Auth | Passport.js |
| 费用 (MVP) | 免费 ✅ | 免费 | 服务器成本 |
| 学习曲线 | 低 ✅ | 低 | 高 |
| 开源 | 是 ✅ | 否 | 是 |

---

*文档生成时间: 2026-01-20*  
*设计工具: Superpowers Brainstorming*
