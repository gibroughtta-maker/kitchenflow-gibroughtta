# KitchenFlow 後端集成包

> **版本**: v1.0 Final  
> **日期**: 2026-01-20  
> **狀態**: ✅ 後端準備就緒，可開始集成  
> **給**: 前端開發者

---

## 📋 後端完成狀態

### ✅ 已完成項目

| 類別 | 項目 | 狀態 |
|------|------|------|
| **數據庫** | Supabase 項目創建 | ✅ |
| **數據庫** | 6 個表創建 | ✅ |
| **數據庫** | RLS 策略配置 | ✅ |
| **數據庫** | Realtime 啟用 | ✅ |
| **代碼** | 共享類型定義 | ✅ |
| **代碼** | API 服務代碼 | ✅ |
| **文檔** | API 使用文檔 | ✅ |
| **文檔** | 集成指南 | ✅ |

### Realtime 已啟用的表
- `shopping_items` ✅
- `shopping_list_members` ✅

---

## 🗂️ 你需要的文件

### 1. 環境變量 (.env)

```env
# Supabase 配置 - 已驗證可用
VITE_SUPABASE_URL=<從 .env 文件獲取>
VITE_SUPABASE_ANON_KEY=<從 .env 文件獲取>

# Gemini AI 配置
VITE_GEMINI_API_KEY=<你的 Gemini API Key>
```

> 📁 完整 `.env` 文件位於項目根目錄

---

### 2. 共享類型定義

**文件位置**: `backend/types/shared-types.ts`

複製到你的項目 `src/types/index.ts`

**核心類型預覽**:
```typescript
// 設備
interface Device {
  id: string;
  nickname?: string;
  last_seen: string;
}

// 馋念
interface Craving {
  id: string;
  device_id: string;
  name: string;
  source: 'voice' | 'share' | 'manual';
  is_archived: boolean;
}

// 購物清單
interface ShoppingList {
  id: string;
  owner_device_id: string;
  name: string;
  share_token?: string;
}

// 購物項
interface ShoppingItem {
  id: string;
  list_id: string;
  name: string;
  category: 'fresh' | 'pantry' | 'other';
  checked: boolean;
  checked_by?: string;
}
```

---

### 3. Supabase 客戶端代碼

**文件位置**: `backend/services/supabase-client.ts`

可直接使用或參考，包含：
- `getOrCreateDeviceId()` - 設備註冊
- `getCravings()` / `addCraving()` - 馋念管理
- `createShoppingList()` / `addShoppingItem()` - 購物清單
- `subscribeToShoppingItems()` - 實時訂閱

---

## 📊 數據庫結構

### 表關係圖

```
devices
   │
   ├── cravings (1:N)
   │
   ├── pantry_staples (1:N)
   │
   └── shopping_lists (1:N)
          │
          ├── shopping_items (1:N)
          │
          └── shopping_list_members (N:M)
```

### 表結構

#### `devices` - 設備/用戶
| 字段 | 類型 | 說明 |
|------|------|------|
| id | UUID | 主鍵 |
| nickname | TEXT | 顯示名稱 |
| last_seen | TIMESTAMPTZ | 最後活躍 |

#### `cravings` - 馋念清單
| 字段 | 類型 | 說明 |
|------|------|------|
| id | UUID | 主鍵 |
| device_id | UUID | FK → devices |
| name | TEXT | 菜名 |
| source | TEXT | voice/share/manual |
| is_archived | BOOLEAN | 是否完成 |

#### `shopping_lists` - 購物清單
| 字段 | 類型 | 說明 |
|------|------|------|
| id | UUID | 主鍵 |
| owner_device_id | UUID | 創建者 |
| share_token | TEXT | 分享碼 |
| expires_at | TIMESTAMPTZ | 過期時間 |

#### `shopping_items` - 購物項 (Realtime ✅)
| 字段 | 類型 | 說明 |
|------|------|------|
| id | UUID | 主鍵 |
| list_id | UUID | FK → shopping_lists |
| name | TEXT | 商品名 |
| category | TEXT | fresh/pantry/other |
| checked | BOOLEAN | 已購買 |
| checked_by | UUID | 購買者 |

#### `shopping_list_members` - 清單成員 (Realtime ✅)
| 字段 | 類型 | 說明 |
|------|------|------|
| list_id | UUID | FK → shopping_lists |
| device_id | UUID | FK → devices |
| is_online | BOOLEAN | 在線狀態 |

#### `pantry_staples` - 常備品
| 字段 | 類型 | 說明 |
|------|------|------|
| device_id | UUID | FK → devices |
| name | TEXT | 名稱 |
| score | INTEGER | 庫存分數 0-100 |

---

## 🔌 API 調用示例

### 快速開始

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

### 設備註冊

```typescript
// 首次啟動
let deviceId = localStorage.getItem('device_id');

if (!deviceId) {
  const { data } = await supabase
    .from('devices')
    .insert({ nickname: null })
    .select('id')
    .single();
  
  deviceId = data.id;
  localStorage.setItem('device_id', deviceId);
}
```

### 馋念 CRUD

```typescript
// 獲取列表
const { data } = await supabase
  .from('cravings')
  .select('*')
  .eq('device_id', deviceId)
  .eq('is_archived', false)
  .order('created_at', { ascending: false });

// 添加
await supabase.from('cravings').insert({
  device_id: deviceId,
  name: '冬陰功湯',
  source: 'manual'
});

// 歸檔
await supabase.from('cravings')
  .update({ is_archived: true })
  .eq('id', cravingId);
```

### 購物清單

```typescript
// 創建
const { data: list } = await supabase
  .from('shopping_lists')
  .insert({ owner_device_id: deviceId })
  .select()
  .single();

// 添加項目
await supabase.from('shopping_items').insert({
  list_id: list.id,
  name: '牛奶 1L',
  category: 'fresh'
});

// 勾選
await supabase.from('shopping_items')
  .update({ 
    checked: true,
    checked_by: deviceId,
    checked_at: new Date().toISOString()
  })
  .eq('id', itemId);
```

### 實時訂閱

```typescript
// 訂閱購物項變化
const channel = supabase
  .channel(`list:${listId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'shopping_items',
    filter: `list_id=eq.${listId}`
  }, (payload) => {
    console.log('變化:', payload.eventType, payload.new);
    // 更新 UI
  })
  .subscribe();

// 組件卸載時清理
return () => channel.unsubscribe();
```

---

## 🧪 集成測試清單

### 前端開發者自測

- [ ] Supabase 連接成功
- [ ] 設備 ID 生成並存儲
- [ ] 馋念 CRUD 正常
- [ ] 購物清單創建成功
- [ ] 購物項添加/勾選
- [ ] Realtime 訂閱收到事件

### 聯合測試（需兩設備）

- [ ] 設備 A 創建清單
- [ ] 設備 B 通過分享鏈接加入
- [ ] A 添加項目，B 實時看到
- [ ] B 勾選，A 看到誰購買了

---

## 📁 後端文件清單

```
backend/
├── database/
│   ├── supabase-setup.sql           # 數據庫安裝腳本
│   ├── rls-policies-advanced.sql    # 進階 RLS（生產用）
│   └── SUPABASE_SETUP_GUIDE.md
├── services/
│   └── supabase-client.ts           # API 服務代碼
├── types/
│   └── shared-types.ts              # 共享類型定義 ⭐
├── API_DOCUMENTATION.md             # API 詳細文檔
├── FRONTEND_INTEGRATION.md          # 集成指南
└── PHASE1_COMPLETE.md
```

---

## 🚀 開始集成

1. **複製環境變量**
   ```bash
   cp .env kitchenflow-app/.env
   ```

2. **安裝依賴**
   ```bash
   cd kitchenflow-app
   npm install
   ```

3. **複製類型定義**
   ```bash
   cp backend/types/shared-types.ts kitchenflow-app/src/types/index.ts
   ```

4. **啟動開發服務器**
   ```bash
   npm run dev
   ```

5. **驗證連接**
   - 打開瀏覽器控制台
   - 檢查是否有 Supabase 連接錯誤

---

## 📞 問題排查

| 問題 | 原因 | 解決 |
|------|------|------|
| 連接失敗 | 環境變量錯誤 | 檢查 .env |
| 寫入失敗 | RLS 阻止 | 檢查 device_id |
| Realtime 無響應 | 未啟用 | ✅ 已解決 |
| 類型錯誤 | 版本不一致 | 用 shared-types.ts |

---

**後端開發者**: ✅ 交付完成  
**日期**: 2026-01-20 14:33  
**下一步**: 前端開始集成
