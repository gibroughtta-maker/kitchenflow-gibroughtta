-- KitchenFlow Database Schema
-- 符合"不记账，只决策"理念的简化数据结构

-- ==================== 1. Fridge Snapshots (动态库存) ====================

create table if not exists fridge_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  
  -- 核心数据：Top 5-10 食材
  items jsonb not null default '[]'::jsonb,
  -- 示例结构：
  -- [
  --   {
  --     "name": "Baby Spinach",
  --     "quantity": 1,
  --     "unit": "bag",
  --     "freshness": "use-soon",
  --     "confidence": 0.9,
  --     "visualNotes": "leaves slightly wilted"
  --   }
  -- ]
  
  -- 扫描质量
  scan_quality text check (scan_quality in ('good', 'medium', 'poor')) default 'medium',
  
  -- 生命周期：24小时后失效
  expires_at timestamptz not null,
  
  -- 可选：保存原图用于纠错 (v1.1)
  image_urls text[] default '{}',
  
  created_at timestamptz default now()
);

-- 索引：按用户+过期时间查询最新快照
create index idx_fridge_snapshots_user_expires 
  on fridge_snapshots(user_id, expires_at desc);

-- 索引：JSONB 搜索食材名称
create index idx_fridge_snapshots_items 
  on fridge_snapshots using gin(items);

-- RLS 策略
alter table fridge_snapshots enable row level security;

create policy "Users view own snapshots"
  on fridge_snapshots for select
  using (auth.uid() = user_id);

create policy "Users insert own snapshots"
  on fridge_snapshots for insert
  with check (auth.uid() = user_id);

create policy "Users delete own snapshots"
  on fridge_snapshots for delete
  using (auth.uid() = user_id);

-- ==================== 2. Cravings (馋念清单) ====================

create table if not exists cravings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  
  -- 核心字段
  dish_name text not null,
  source text check (source in ('voice', 'link', 'manual')) default 'manual',
  
  -- 由 Gemini 解析得出的所需食材
  required_ingredients jsonb default '[]'::jsonb,
  -- 示例：["豆腐", "肉末", "豆瓣酱", "花椒"]
  
  -- 可选元数据
  cuisine text,  -- "川菜", "粤菜", "西餐"
  difficulty text check (difficulty in ('easy', 'medium', 'hard')),
  estimated_time text,  -- "30分钟"
  
  -- 状态追踪
  fulfilled boolean default false,  -- 购买后标记为true
  fulfilled_at timestamptz,
  
  created_at timestamptz default now()
);

-- 索引
create index idx_cravings_user_fulfilled 
  on cravings(user_id, fulfilled, created_at desc);

create index idx_cravings_ingredients 
  on cravings using gin(required_ingredients);

-- RLS 策略
alter table cravings enable row level security;

create policy "Users manage own cravings"
  on cravings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ==================== 3. Pantry Staples (常备品库) ====================

create table if not exists pantry_staples (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  
  -- 基本信息
  name text not null,
  category text check (category in ('oil', 'sauce', 'spice', 'grain', 'other')) default 'other',
  
  -- 隐形扣减系统
  usage_score integer default 100 check (usage_score >= 0 and usage_score <= 100),
  alert_threshold integer default 30 check (alert_threshold >= 0 and alert_threshold <= 100),
  typical_decay_rate integer default 5,  -- 每次烹饪扣减分数
  
  -- 时间戳
  last_used_at timestamptz,
  updated_at timestamptz default now(),
  
  -- 唯一约束：每个用户的每种常备品只有一条记录
  unique(user_id, name)
);

-- 索引
create index idx_pantry_staples_user_score 
  on pantry_staples(user_id, usage_score);

-- RLS 策略
alter table pantry_staples enable row level security;

create policy "Users manage own staples"
  on pantry_staples for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ==================== 4. Shopping Lists (购物清单) ====================

create table if not exists shopping_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  
  -- 清单项
  items jsonb not null default '[]'::jsonb,
  -- 示例结构：
  -- [
  --   {
  --     "name": "豆腐",
  --     "quantity": 2,
  --     "unit": "块",
  --     "category": "fresh",
  --     "reason": "为了做麻婆豆腐",
  --     "priority": "high",
  --     "usualShop": "Tesco"
  --   }
  -- ]
  
  -- 激活的 Cravings
  activated_cravings uuid[] default '{}',
  
  -- 常备品建议
  staple_suggestions jsonb default '[]'::jsonb,
  -- 示例：[{"name": "盐", "currentScore": 25, "question": "盐还够吗？"}]
  
  -- 过期食材菜谱
  expiration_recipes jsonb default '[]'::jsonb,
  
  -- 状态
  status text check (status in ('draft', 'confirmed', 'shopping', 'completed')) default 'draft',
  
  -- 估算总价
  total_estimated_cost numeric(10,2),
  
  created_at timestamptz default now(),
  completed_at timestamptz
);

-- 索引
create index idx_shopping_lists_user_status 
  on shopping_lists(user_id, status, created_at desc);

-- RLS 策略
alter table shopping_lists enable row level security;

create policy "Users manage own shopping lists"
  on shopping_lists for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ==================== 5. Receipt Scans (收据扫描 - 仅价格学习) ====================

create table if not exists receipt_scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  
  -- 商店信息
  shop_name text not null,
  date date not null,
  
  -- 商品列表（仅用于价格追踪）
  items jsonb not null default '[]'::jsonb,
  -- 示例：
  -- [
  --   {
  --     "name": "Baby Spinach",
  --     "quantity": 1,
  --     "unit": "bag",
  --     "unitPrice": 2.50,
  --     "totalPrice": 2.50
  --   }
  -- ]
  
  total_amount numeric(10,2) not null,
  scan_quality text check (scan_quality in ('good', 'medium', 'poor')),
  
  created_at timestamptz default now()
);

-- 索引
create index idx_receipt_scans_user_date 
  on receipt_scans(user_id, date desc);

create index idx_receipt_scans_shop 
  on receipt_scans(shop_name);

create index idx_receipt_scans_items 
  on receipt_scans using gin(items);

-- RLS 策略
alter table receipt_scans enable row level security;

create policy "Users manage own receipts"
  on receipt_scans for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ==================== 6. Shop Info Cache (商店信息缓存) ====================

create table if not exists shop_info (
  id uuid primary key default gen_random_uuid(),
  
  -- Google Places ID
  place_id text unique not null,
  
  -- 基本信息
  name text not null,
  address text,
  lat numeric(10,7),
  lng numeric(10,7),
  
  -- 营业时间
  opening_hours jsonb,
  -- 示例：
  -- {
  --   "weekdayText": ["Monday: 8:00 AM – 10:00 PM", ...],
  --   "isOpenNow": true
  -- }
  
  -- 分类
  categories text[],
  
  -- 用户备注（关联到用户）
  user_notes jsonb default '{}'::jsonb,
  -- 示例：{"user_id_1": "蔬菜最新鲜", "user_id_2": "价格便宜"}
  
  -- 缓存时间
  cached_at timestamptz default now(),
  
  updated_at timestamptz default now()
);

-- 索引
create index idx_shop_info_place_id on shop_info(place_id);
create index idx_shop_info_location on shop_info(lat, lng);

-- 公开读取（无需 RLS）
alter table shop_info enable row level security;

create policy "Public read shop info"
  on shop_info for select
  to public
  using (true);

-- ==================== 辅助函数 ====================

-- 自动清理过期快照
create or replace function cleanup_expired_snapshots()
returns void as $$
begin
  delete from fridge_snapshots
  where expires_at < now();
end;
$$ language plpgsql;

-- 自动扣减常备品分数
create or replace function decay_pantry_staple(
  p_user_id uuid,
  p_staple_name text,
  p_decay_amount integer default null
)
returns void as $$
declare
  v_decay_rate integer;
begin
  -- 获取默认扣减率
  select typical_decay_rate into v_decay_rate
  from pantry_staples
  where user_id = p_user_id and name = p_staple_name;
  
  -- 执行扣减
  update pantry_staples
  set 
    usage_score = greatest(0, usage_score - coalesce(p_decay_amount, v_decay_rate)),
    last_used_at = now(),
    updated_at = now()
  where user_id = p_user_id and name = p_staple_name;
end;
$$ language plpgsql;

-- 获取最新有效快照
create or replace function get_latest_snapshot(p_user_id uuid)
returns jsonb as $$
declare
  v_snapshot jsonb;
begin
  select items into v_snapshot
  from fridge_snapshots
  where user_id = p_user_id
    and expires_at > now()
  order by created_at desc
  limit 1;
  
  return coalesce(v_snapshot, '[]'::jsonb);
end;
$$ language plpgsql;

-- ==================== 定时任务（需要 pg_cron 扩展） ====================

-- 每天凌晨2点清理过期快照
-- select cron.schedule('cleanup-snapshots', '0 2 * * *', 'select cleanup_expired_snapshots()');

-- ==================== 示例数据（开发用） ====================

-- 插入测试用户的常备品
-- insert into pantry_staples (user_id, name, category, usage_score, typical_decay_rate)
-- values 
--   ('YOUR_USER_ID', '酱油', 'sauce', 80, 5),
--   ('YOUR_USER_ID', '盐', 'spice', 60, 3),
--   ('YOUR_USER_ID', '油', 'oil', 70, 8),
--   ('YOUR_USER_ID', '米', 'grain', 50, 10);

-- ==================== 视图（可选） ====================

-- 当前有效库存视图
create or replace view current_inventory as
select 
  user_id,
  items,
  scan_quality,
  created_at,
  expires_at
from fridge_snapshots
where expires_at > now()
order by created_at desc;

-- 低分常备品提醒视图
create or replace view low_staples_alert as
select 
  user_id,
  name,
  category,
  usage_score,
  alert_threshold,
  last_used_at
from pantry_staples
where usage_score < alert_threshold
order by usage_score asc;

-- 未完成的 Cravings 视图
create or replace view pending_cravings as
select 
  id,
  user_id,
  dish_name,
  required_ingredients,
  cuisine,
  difficulty,
  created_at
from cravings
where fulfilled = false
order by created_at desc;
