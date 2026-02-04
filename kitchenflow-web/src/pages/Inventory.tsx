import { useState, useEffect } from 'react';
import { getInventory, setInventory } from '../services/storage';
import type { InventoryItem } from '../types';

type Tab = 'all' | 'fridge' | 'freezer' | 'pantry';

const tabs: { key: Tab; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'fridge', label: '冰箱' },
  { key: 'freezer', label: '冷冻' },
  { key: 'pantry', label: 'Pantry' },
];

export default function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [tab, setTab] = useState<Tab>('all');

  useEffect(() => {
    setItems(getInventory());
  }, []);

  const filtered = tab === 'all' ? items : items.filter((i) => i.location === tab);

  const remove = (id: string) => {
    const next = items.filter((i) => i.id !== id);
    setInventory(next);
    setItems(next);
  };

  const freshnessLabel = (f: InventoryItem['freshness']) =>
    f === 'fresh' ? '🟢' : f === 'use-soon' ? '🟡' : '🔴';

  return (
    <div className="space-y-6">
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`shrink-0 px-4 py-3 rounded-full text-sm font-semibold transition pill-button ${
              tab === key ? '!bg-white/25 border-white/50' : ''
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="text-glass-secondary text-sm text-center py-12">暂无库存</p>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="liquid-card rounded-3xl p-4 flex items-center justify-between gap-3 active:scale-[0.98] transition-transform"
            >
              <div>
                <p className="font-semibold text-white">{item.name}</p>
                <p className="text-sm text-glass-secondary">
                  {item.quantity} {item.unit} · {freshnessLabel(item.freshness)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => remove(item.id)}
                className="text-red-300 text-sm font-medium active:opacity-80"
              >
                删除
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
