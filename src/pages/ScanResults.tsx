import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getInventory, setInventory } from '../services/api';
import type { FreshItem, FridgeSnapshotResult } from '../types';
import type { InventoryItem } from '../types';

function groupByFreshness(items: FreshItem[]) {
  const fresh: FreshItem[] = [];
  const useSoon: FreshItem[] = [];
  const priority: FreshItem[] = [];
  items.forEach((i) => {
    if (i.freshness === 'fresh') fresh.push(i);
    else if (i.freshness === 'use-soon') useSoon.push(i);
    else priority.push(i);
  });
  return { fresh, useSoon, priority };
}

function Tag({ freshness }: { freshness: FreshItem['freshness'] }) {
  const cls =
    freshness === 'fresh'
      ? 'liquid-tag-green'
      : freshness === 'use-soon'
        ? 'liquid-tag-yellow'
        : 'liquid-tag-red';
  const label = freshness === 'fresh' ? 'Fresh' : freshness === 'use-soon' ? 'Use Soon' : 'Priority';
  return (
    <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${cls}`}>
      {label}
    </span>
  );
}

function ItemRow({ item, imageUrl, isPriority }: { item: FreshItem; imageUrl?: string; isPriority?: boolean }) {
  return (
    <div className={`liquid-card p-4 rounded-3xl flex items-center gap-4 active:scale-[0.98] transition-transform ${isPriority ? 'ring-1 ring-red-500/30 bg-red-500/5' : ''}`}>
      <div className="liquid-bubble-icon size-16 rounded-full flex items-center justify-center shrink-0 relative overflow-hidden">
        {imageUrl ? (
          <>
            <div className="absolute inset-0 bg-cover bg-center opacity-90" style={{ backgroundImage: `url(${imageUrl})`, mixBlendMode: 'multiply' }} />
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent" />
          </>
        ) : (
          <span className="material-symbols-outlined text-3xl text-green-700/80">eco</span>
        )}
        {isPriority && (
          <div className="absolute top-0 right-0 size-3 bg-red-500 rounded-full border border-white/50 shadow-[0_0_15px_rgba(239,68,68,0.6)]" />
        )}
      </div>
      <div className="flex flex-col justify-center flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <p className="text-white text-lg font-bold leading-tight truncate drop-shadow-md">
            {item.name}
          </p>
          <Tag freshness={item.freshness} />
        </div>
        <p className={`text-sm font-medium leading-normal truncate ${isPriority ? 'text-red-200 drop-shadow-sm' : 'text-glass-secondary'}`}>
          {item.quantity} {item.unit}
          {item.visualNotes ? ` · ${item.visualNotes}` : ''}
        </p>
      </div>
      <div className="shrink-0 pl-1">
        <div
          className={`size-3 rounded-full border ${
            item.freshness === 'fresh'
              ? 'bg-green-500 border-green-300 shadow-[0_0_15px_rgba(34,197,94,0.8)]'
              : item.freshness === 'use-soon'
                ? 'bg-yellow-400 border-yellow-200 shadow-[0_0_15px_rgba(250,204,21,0.8)]'
                : 'bg-red-500 border-red-300 shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-pulse'
          }`}
        />
      </div>
    </div>
  );
}

export default function ScanResults() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const { state } = useLocation() as { state?: { result: FridgeSnapshotResult } };
  const result = state?.result;

  if (!result) {
    return (
      <div className="text-center py-12">
        <p className="text-glass-secondary mb-4">暂无扫描结果</p>
        <button
          type="button"
          onClick={() => navigate('/scan')}
          className="pill-button px-6 py-3 rounded-full text-white font-semibold"
        >
          去扫描
        </button>
      </div>
    );
  }

  const { fresh, useSoon, priority } = groupByFreshness(result.items);

  const saveToInventory = async () => {
    setError('');
    try {
      const inv = await getInventory();
      const loc = result.items[0]?.storageLocation ?? 'fridge';
      const newItems: InventoryItem[] = result.items.map((i, idx) => ({
        id: `scan-${Date.now()}-${idx}`,
        name: i.name,
        quantity: i.quantity,
        unit: i.unit,
        freshness: i.freshness,
        location: loc === 'pantry' ? 'pantry' : loc === 'freezer' ? 'freezer' : 'fridge',
        addedAt: Date.now(),
      }));
      await setInventory([...inv, ...newItems]);
      navigate('/inventory');
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存到库存失败，请稍后重试');
    }
  };

  const addToShopping = () => {
    navigate('/shopping', { state: { addItems: result.items.map((i) => i.name) } });
  };

  const heroBg = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDWeRzu1wEYY89DDX6VU9JDqraoTCRy9WL73NuY73bY9dekK4zpRglVN5mLuLQxnxyPaV3v7KlWGR30WB22rHcQ3mgYJLV3PK8ANyb4uqU2NbG3320MoejH9jN-DocDiQUS1bTCYehNEVSE4yg78f0kyao108WzXE_9eiaX4HUww4EnFf8wk1wR9_KgP0TDRrqyAlVmS9smVFctz6U8vcDXlys6zOPLfTtxIebhsCCI75gipPrb4cqoCVVucbWCEqiYFk7KSVII1qH-';

  return (
    <div className="space-y-6 pb-4">
      <div className="flex justify-center mb-10">
        <div className="w-full sm:w-2/3 aspect-[2/1] rounded-3xl glass-frame overflow-hidden relative group">
          <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url(${heroBg})` }} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />
          <div className="absolute bottom-4 right-4 liquid-card !bg-black/40 !backdrop-blur-xl px-4 py-2 rounded-full flex items-center gap-2 border border-white/20">
            <span className="material-symbols-outlined text-green-400 text-lg shadow-[0_0_15px_rgba(34,197,94,0.6)] rounded-full">check_circle</span>
            <span className="text-xs font-semibold text-white tracking-wide">Scan Complete</span>
          </div>
        </div>
      </div>
      {fresh.length > 0 && (
        <div className="mb-8">
          <h3 className="text-glass-primary text-sm font-bold uppercase tracking-widest mb-4 pl-1 flex items-center gap-2 opacity-90">
            <span className="material-symbols-outlined text-green-400 text-lg drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]">eco</span>
            Fresh Ingredients
          </h3>
          <div className="flex flex-col gap-4">
            {fresh.map((item) => (
              <ItemRow key={`${item.name}-${item.quantity}`} item={item} />
            ))}
          </div>
        </div>
      )}
      {(useSoon.length > 0 || priority.length > 0) && (
        <div>
          <h3 className="text-glass-primary text-sm font-bold uppercase tracking-widest mb-4 pl-1 flex items-center gap-2 opacity-90">
            <span className="material-symbols-outlined text-orange-400 text-lg drop-shadow-[0_0_8px_rgba(251,146,60,0.5)]">warning</span>
            Others
          </h3>
          <div className="flex flex-col gap-4">
            {useSoon.map((item) => (
              <ItemRow key={`${item.name}-${item.quantity}`} item={item} />
            ))}
            {priority.map((item) => (
              <ItemRow key={`${item.name}-${item.quantity}`} item={item} isPriority />
            ))}
          </div>
        </div>
      )}
      <div className="h-6" />
      {error && (
        <p className="text-red-300 text-sm text-center py-2 px-4 rounded-xl bg-red-500/20 mx-4" role="alert">
          {error}
        </p>
      )}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-30 w-full max-w-[375px] p-5 pb-8 liquid-bar shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.5)] flex flex-col gap-3" style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}>
        <button type="button" onClick={saveToInventory} className="w-full h-14 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white font-bold text-base shadow-lg shadow-blue-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 border border-white/20">
          <span className="material-symbols-outlined">restaurant_menu</span>
          Recommended Recipes
        </button>
        <button type="button" onClick={addToShopping} className="w-full h-14 rounded-full liquid-card hover:bg-white/20 text-white font-bold text-base active:scale-95 transition-all flex items-center justify-center gap-2 border border-white/30 shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
          <span className="material-symbols-outlined">receipt_long</span>
          Generate Shopping List
        </button>
      </div>
    </div>
  );
}
