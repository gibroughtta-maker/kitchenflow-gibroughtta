import { useState, useEffect, useRef } from 'react';
import { getInventory, setInventory } from '../services/api';
import type { InventoryItem } from '../types';

type Tab = 'all' | 'fridge' | 'freezer' | 'pantry';

const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'fridge', label: 'Fridge' },
  { key: 'freezer', label: 'Freezer' },
  { key: 'pantry', label: 'Pantry' },
];

function SwipeableRow({
  item,
  onDelete,
  onUpdateName,
}: {
  item: InventoryItem;
  onDelete: (id: string) => void;
  onUpdateName: (id: string, name: string) => void;
}) {
  const [offsetX, setOffsetX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(item.name);
  const rowRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (editing) return;
    setStartX(e.clientX);
    setDragging(true);
    if (rowRef.current) rowRef.current.style.transition = 'none';
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const diff = e.clientX - startX;
    if (diff < 0 && diff > -140) setOffsetX(diff);
  };

  const handlePointerUp = () => {
    if (!dragging) return;
    setDragging(false);
    if (rowRef.current) rowRef.current.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    setOffsetX(offsetX < -70 ? -90 : 0);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(item.id);
  };

  const submitName = () => {
    setEditing(false);
    const trimmed = editName.trim();
    if (trimmed) onUpdateName(item.id, trimmed);
    else setEditName(item.name);
  };

  const freshnessLabel = (f: InventoryItem['freshness']) =>
    f === 'fresh' ? '🟢' : f === 'use-soon' ? '🟡' : '🔴';

  return (
    <div className="relative h-[72px] rounded-[1.5rem] overflow-hidden mb-3 select-none">
      <div className="absolute inset-0 flex items-center justify-end pr-4 rounded-[1.5rem] bg-white/5">
        <button
          type="button"
          onClick={handleDelete}
          className="relative z-10 size-11 rounded-full liquid-card border border-white/20 flex items-center justify-center active:scale-90 text-white hover:bg-red-500/30 transition-colors"
          aria-label="删除"
        >
          <span className="material-symbols-outlined text-xl">delete</span>
        </button>
      </div>
      <div
        ref={rowRef}
        className="absolute inset-0 liquid-card rounded-[1.5rem] border border-white/20 flex items-center justify-between px-4 z-10"
        style={{ transform: `translateX(${offsetX}px)` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <div className="flex-1 min-w-0 pr-3">
          {editing ? (
            <input
              ref={inputRef}
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={submitName}
              onKeyDown={(e) => e.key === 'Enter' && submitName()}
              className="w-full bg-transparent border-b-2 border-white/40 text-base font-semibold text-white focus:outline-none py-1 placeholder-white/50"
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-left w-full text-base font-semibold text-glass-primary truncate block"
            >
              {item.name}
            </button>
          )}
          <p className="text-sm text-glass-secondary mt-0.5">
            {item.quantity} {item.unit} · {freshnessLabel(item.freshness)}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [tab, setTab] = useState<Tab>('all');
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
    getInventory().then(setItems).catch((e) => setError(e instanceof Error ? e.message : '加载失败'));
  }, []);

  const filtered = tab === 'all' ? items : items.filter((i) => i.location === tab);

  const remove = async (id: string) => {
    setError('');
    const next = items.filter((i) => i.id !== id);
    try {
      await setInventory(next);
      setItems(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : '删除失败，请稍后重试');
    }
  };

  const updateName = async (id: string, name: string) => {
    setError('');
    const next = items.map((i) => (i.id === id ? { ...i, name } : i));
    try {
      await setInventory(next);
      setItems(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败，请稍后重试');
    }
  };

  return (
    <div className="space-y-5">
      {error && (
        <p className="text-red-300 text-sm text-center py-2 px-4 rounded-xl bg-red-500/20" role="alert">
          {error}
        </p>
      )}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`shrink-0 px-4 py-2.5 rounded-full text-sm font-semibold transition pill-button ${
              tab === key ? '!bg-white/25 border-white/50' : ''
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div>
        {filtered.length === 0 ? (
          <p className="text-glass-secondary text-sm text-center py-12">暂无库存</p>
        ) : (
          filtered.map((item) => (
            <SwipeableRow
              key={item.id}
              item={item}
              onDelete={remove}
              onUpdateName={updateName}
            />
          ))
        )}
      </div>
    </div>
  );
}
