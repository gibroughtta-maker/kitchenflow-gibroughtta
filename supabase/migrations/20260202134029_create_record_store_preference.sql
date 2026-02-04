-- Create table for user store preferences if it doesn't exist
create table if not exists public.user_store_preferences (
  id uuid default gen_random_uuid() primary key,
  device_id text not null,
  item_name text not null,
  preferred_store text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(device_id, item_name)
);

-- Enable RLS
alter table public.user_store_preferences enable row level security;

-- Drop policy if it exists to allow re-running script
drop policy if exists "Allow all access to store preferences" on public.user_store_preferences;

-- Create policy to allow anonymous insert/select (since we rely on device_id)
create policy "Allow all access to store preferences"
  on public.user_store_preferences for all
  using (true)
  with check (true);

-- Create function to record user store preference (AI learning)
create or replace function public.record_store_preference(
  p_device_id text,
  p_item_name text,
  p_preferred_store text
)
returns void
language plpgsql
security definer
as $$
begin
  insert into public.user_store_preferences (device_id, item_name, preferred_store, updated_at)
  values (p_device_id, p_item_name, p_preferred_store, now())
  on conflict (device_id, item_name)
  do update set 
    preferred_store = excluded.preferred_store,
    updated_at = now();
end;
$$;

-- Create function to get user store preference
create or replace function public.get_preferred_store(
  p_device_id text,
  p_item_name text
)
returns text
language plpgsql
security definer
as $$
declare
  v_store text;
begin
  select preferred_store into v_store
  from public.user_store_preferences
  where device_id = p_device_id and item_name = p_item_name;
  
  return v_store;
end;
$$;
